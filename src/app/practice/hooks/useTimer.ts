// src/app/practice/hooks/useTimer.ts
import { useState, useEffect, useRef, useCallback } from 'react';

interface UseTimerOptions {
  autoStart?: boolean;
  onTick?: (elapsed: number) => void;
}

export interface TimerState {
  isRunning: boolean;
  elapsedSeconds: number;
  formattedTime: string;
}

export function useTimer({ autoStart = false, onTick }: UseTimerOptions = {}) {
  const [isRunning, setIsRunning] = useState(autoStart);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const start = useCallback(() => {
    if (!isRunning) {
      setIsRunning(true);
      startTimeRef.current = Date.now() - (elapsedSeconds * 1000);
    }
  }, [isRunning, elapsedSeconds]);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setElapsedSeconds(0);
    startTimeRef.current = null;
  }, []);

  const stop = useCallback(() => {
    setIsRunning(false);
    const finalElapsed = elapsedSeconds;
    return finalElapsed;
  }, [elapsedSeconds]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const newElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setElapsedSeconds(newElapsed);
          onTick?.(newElapsed);
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, onTick]);

  const timerState: TimerState = {
    isRunning,
    elapsedSeconds,
    formattedTime: formatTime(elapsedSeconds)
  };

  return {
    ...timerState,
    start,
    pause,
    reset,
    stop
  };
}

// Hook for tracking per-question timing
export function useQuestionTimer() {
  const [questionTimes, setQuestionTimes] = useState<Record<number, number>>({});
  const [currentQuestionStartTime, setCurrentQuestionStartTime] = useState<number | null>(null);

  const startQuestionTimer = useCallback((_questionId: number) => { // eslint-disable-line @typescript-eslint/no-unused-vars
    setCurrentQuestionStartTime(Date.now());
  }, []);

  const stopQuestionTimer = useCallback((questionId: number) => {
    if (currentQuestionStartTime) {
      const timeSpent = Math.floor((Date.now() - currentQuestionStartTime) / 1000);
      setQuestionTimes(prev => ({
        ...prev,
        [questionId]: (prev[questionId] || 0) + timeSpent
      }));
      setCurrentQuestionStartTime(null);
      return timeSpent;
    }
    return 0;
  }, [currentQuestionStartTime]);

  const getQuestionTime = useCallback((questionId: number) => {
    return questionTimes[questionId] || 0;
  }, [questionTimes]);

  const getTotalTime = useCallback(() => {
    return Object.values(questionTimes).reduce((sum, time) => sum + time, 0);
  }, [questionTimes]);

  const getAverageTime = useCallback(() => {
    const times = Object.values(questionTimes);
    if (times.length === 0) return 0;
    return Math.floor(times.reduce((sum, time) => sum + time, 0) / times.length);
  }, [questionTimes]);

  const reset = useCallback(() => {
    setQuestionTimes({});
    setCurrentQuestionStartTime(null);
  }, []);

  return {
    questionTimes,
    startQuestionTimer,
    stopQuestionTimer,
    getQuestionTime,
    getTotalTime,
    getAverageTime,
    reset
  };
}