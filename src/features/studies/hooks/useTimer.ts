'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

export function useTimer(targetMinutes: number = 25) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [target, setTarget] = useState(targetMinutes * 60);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = Date.now() - elapsed * 1000;
      intervalRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 200);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning]);

  const start = useCallback(() => { setIsRunning(true); }, []);
  const pause = useCallback(() => { setIsRunning(false); }, []);
  const reset = useCallback(() => { setIsRunning(false); setElapsed(0); }, []);
  const setTargetMin = useCallback((min: number) => { setTarget(min * 60); }, []);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const progress = target > 0 ? Math.min(elapsed / target, 1) : 0;
  const isComplete = elapsed >= target;

  return { isRunning, elapsed, minutes, seconds, progress, isComplete, start, pause, reset, target, setTargetMin, startTime: startTimeRef.current };
}
