'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

export function useTimer(targetMinutes: number = 25) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [target, setTarget] = useState(targetMinutes * 60);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const accumulatedRef = useRef<number>(0);
  const startRunRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0); // For external reference of initial start

  useEffect(() => {
    if (isRunning) {
      startRunRef.current = Date.now();
      if (startTimeRef.current === 0) startTimeRef.current = Date.now();
      
      intervalRef.current = setInterval(() => {
        const currentRunTime = Date.now() - startRunRef.current;
        setElapsed(Math.floor((accumulatedRef.current + currentRunTime) / 1000));
      }, 200);
    } else {
      // Save accumulated time when paused
      if (startRunRef.current > 0) {
        accumulatedRef.current += Date.now() - startRunRef.current;
        startRunRef.current = 0;
      }
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning]);

  const start = useCallback(() => { setIsRunning(true); }, []);
  const pause = useCallback(() => { setIsRunning(false); }, []);
  const reset = useCallback(() => { 
    setIsRunning(false); 
    setElapsed(0); 
    accumulatedRef.current = 0; 
    startRunRef.current = 0;
    startTimeRef.current = 0;
  }, []);
  const setTargetMin = useCallback((min: number) => { setTarget(min * 60); }, []);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const progress = target > 0 ? Math.min(elapsed / target, 1) : 0;
  const isComplete = elapsed >= target;

  return { isRunning, elapsed, minutes, seconds, progress, isComplete, start, pause, reset, target, setTargetMin, getStartTime: () => startTimeRef.current };
}
