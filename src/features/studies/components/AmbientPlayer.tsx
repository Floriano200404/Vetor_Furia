'use client';

/**
 * AmbientPlayer — Plays ambient background sounds during study sessions.
 * Uses Web Audio API with oscillators and noise generators. Zero external dependencies.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, CloudRain, Flame, Wind, Radio } from 'lucide-react';
import styles from './AmbientPlayer.module.css';

type SoundType = 'rain' | 'fire' | 'wind' | 'lofi';

interface SoundConfig {
  id: SoundType;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const SOUNDS: SoundConfig[] = [
  { id: 'rain', label: 'Chuva', icon: <CloudRain size={18} />, color: '#60a5fa' },
  { id: 'fire', label: 'Fogueira', icon: <Flame size={18} />, color: '#f97316' },
  { id: 'wind', label: 'Vento', icon: <Wind size={18} />, color: '#a3e635' },
  { id: 'lofi', label: 'Lo-fi', icon: <Radio size={18} />, color: '#c084fc' },
];

function createNoiseBuffer(ctx: AudioContext, duration: number = 2): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * duration;
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

function startRain(ctx: AudioContext, gainNode: GainNode) {
  // Brown noise via filtering white noise
  const noise = ctx.createBufferSource();
  noise.buffer = createNoiseBuffer(ctx, 4);
  noise.loop = true;

  const lpf = ctx.createBiquadFilter();
  lpf.type = 'lowpass';
  lpf.frequency.setValueAtTime(400, ctx.currentTime);

  const hpf = ctx.createBiquadFilter();
  hpf.type = 'highpass';
  hpf.frequency.setValueAtTime(50, ctx.currentTime);

  noise.connect(lpf).connect(hpf).connect(gainNode);
  noise.start();
  return noise;
}

function startFire(ctx: AudioContext, gainNode: GainNode) {
  const noise = ctx.createBufferSource();
  noise.buffer = createNoiseBuffer(ctx, 4);
  noise.loop = true;

  const bpf = ctx.createBiquadFilter();
  bpf.type = 'bandpass';
  bpf.frequency.setValueAtTime(200, ctx.currentTime);
  bpf.Q.setValueAtTime(0.5, ctx.currentTime);

  // Crackling via LFO modulation
  const lfo = ctx.createOscillator();
  lfo.frequency.setValueAtTime(3, ctx.currentTime);
  const lfoGain = ctx.createGain();
  lfoGain.gain.setValueAtTime(0.3, ctx.currentTime);
  lfo.connect(lfoGain).connect(gainNode.gain);
  lfo.start();

  noise.connect(bpf).connect(gainNode);
  noise.start();
  return noise;
}

function startWind(ctx: AudioContext, gainNode: GainNode) {
  const noise = ctx.createBufferSource();
  noise.buffer = createNoiseBuffer(ctx, 4);
  noise.loop = true;

  const lpf = ctx.createBiquadFilter();
  lpf.type = 'lowpass';
  lpf.frequency.setValueAtTime(300, ctx.currentTime);

  // Slow sweep for "wind gusts"
  const lfo = ctx.createOscillator();
  lfo.frequency.setValueAtTime(0.15, ctx.currentTime);
  const lfoGain = ctx.createGain();
  lfoGain.gain.setValueAtTime(200, ctx.currentTime);
  lfo.connect(lfoGain).connect(lpf.frequency);
  lfo.start();

  noise.connect(lpf).connect(gainNode);
  noise.start();
  return noise;
}

function startLofi(ctx: AudioContext, gainNode: GainNode) {
  // Simple chord pad to simulate lo-fi vibes
  const notes = [261.63, 329.63, 392.0, 493.88]; // C4, E4, G4, B4
  const oscillators: OscillatorNode[] = [];

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    // Detune slightly for warmth
    osc.detune.setValueAtTime(Math.random() * 10 - 5, ctx.currentTime);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.08, ctx.currentTime);

    // LFO vibrato
    const vibrato = ctx.createOscillator();
    vibrato.frequency.setValueAtTime(0.3 + i * 0.1, ctx.currentTime);
    const vibratoGain = ctx.createGain();
    vibratoGain.gain.setValueAtTime(2, ctx.currentTime);
    vibrato.connect(vibratoGain).connect(osc.frequency);
    vibrato.start();

    osc.connect(oscGain).connect(gainNode);
    osc.start();
    oscillators.push(osc);
  });

  return oscillators[0]; // Return first for stopping reference
}

export function AmbientPlayer() {
  const [active, setActive] = useState<SoundType | null>(null);
  const [volume, setVolume] = useState(0.3);
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | OscillatorNode | null>(null);

  const stopSound = useCallback(() => {
    if (ctxRef.current && ctxRef.current.state !== 'closed') {
      ctxRef.current.close().catch(() => {});
    }
    ctxRef.current = null;
    gainRef.current = null;
    sourceRef.current = null;
    setActive(null);
  }, []);

  const playSound = useCallback((type: SoundType) => {
    // Stop current if any
    if (ctxRef.current) {
      ctxRef.current.close().catch(() => {});
    }

    try {
      const ctx = new AudioContext();
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.connect(ctx.destination);

      ctxRef.current = ctx;
      gainRef.current = gain;

      let source: AudioBufferSourceNode | OscillatorNode | null = null;
      switch (type) {
        case 'rain': source = startRain(ctx, gain); break;
        case 'fire': source = startFire(ctx, gain); break;
        case 'wind': source = startWind(ctx, gain); break;
        case 'lofi': source = startLofi(ctx, gain); break;
      }
      sourceRef.current = source;
      setActive(type);
    } catch {
      console.warn('Web Audio not available');
    }
  }, [volume]);

  // Update volume in real-time
  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.setValueAtTime(volume, gainRef.current.context.currentTime);
    }
  }, [volume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (ctxRef.current && ctxRef.current.state !== 'closed') {
        ctxRef.current.close().catch(() => {});
      }
    };
  }, []);

  const handleToggle = useCallback((type: SoundType) => {
    if (active === type) {
      stopSound();
    } else {
      playSound(type);
    }
  }, [active, stopSound, playSound]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.label}>
          {active ? <Volume2 size={14} /> : <VolumeX size={14} />}
          Som Ambiente
        </span>
        {active && (
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className={styles.volumeSlider}
          />
        )}
      </div>
      <div className={styles.buttons}>
        {SOUNDS.map((s) => (
          <motion.button
            key={s.id}
            className={`${styles.soundBtn} ${active === s.id ? styles.soundBtnActive : ''}`}
            onClick={() => handleToggle(s.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={active === s.id ? { borderColor: s.color, boxShadow: `0 0 12px ${s.color}40` } : {}}
          >
            <span style={active === s.id ? { color: s.color } : {}}>{s.icon}</span>
            <span>{s.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
