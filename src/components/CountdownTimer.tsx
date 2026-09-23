import React, { useState, useEffect, useRef } from 'react';
import { Clock, AlertTriangle, AlertCircle, Pause } from 'lucide-react';
import { playAlertChime } from '../utils/audio';
import { useLanguage } from '../context/LanguageContext';

interface CountdownTimerProps {
  initialSeconds: number;
  onExpire: () => void;
  onTick?: (secondsLeft: number) => void;
  warningThresholdSeconds?: number; // e.g. 300 (5 mins)
  criticalThresholdSeconds?: number; // e.g. 60 (1 min)
  className?: string;
  showProgress?: boolean;
  isPaused?: boolean;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  initialSeconds,
  onExpire,
  onTick,
  warningThresholdSeconds = 300,
  criticalThresholdSeconds = 60,
  className = '',
  showProgress = false,
  isPaused = false,
}) => {
  const { language } = useLanguage();
  const isKa = language === 'ka';
  const [secondsRemaining, setSecondsRemaining] = useState<number>(initialSeconds);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const warned5MinRef = useRef<boolean>(false);
  const warned1MinRef = useRef<boolean>(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  // Use absolute end timestamp to prevent clock drift during tab inactivity
  const targetEndTimeRef = useRef<number>(Date.now() + initialSeconds * 1000);
  const pausedAtRef = useRef<number | null>(null);

  useEffect(() => {
    targetEndTimeRef.current = Date.now() + initialSeconds * 1000;
    setSecondsRemaining(initialSeconds);
    setIsExpired(false);
    warned5MinRef.current = false;
    warned1MinRef.current = false;
    pausedAtRef.current = null;
  }, [initialSeconds]);

  // Handle pausing and resuming: freeze targetEndTime by adding elapsed pause duration
  useEffect(() => {
    if (isPaused) {
      if (!pausedAtRef.current) {
        pausedAtRef.current = Date.now();
      }
    } else {
      if (pausedAtRef.current) {
        const pausedElapsed = Date.now() - pausedAtRef.current;
        targetEndTimeRef.current += pausedElapsed;
        pausedAtRef.current = null;
      }
    }
  }, [isPaused]);

  useEffect(() => {
    if (isExpired) return;

    const interval = setInterval(() => {
      if (isPaused) {
        // While paused, do not decrement time
        return;
      }

      const now = Date.now();
      const distance = Math.max(0, Math.round((targetEndTimeRef.current - now) / 1000));

      setSecondsRemaining(distance);
      if (onTick) {
        onTick(distance);
      }

      // Audio chimes on thresholds
      if (distance <= warningThresholdSeconds && distance > criticalThresholdSeconds && !warned5MinRef.current) {
        warned5MinRef.current = true;
        playAlertChime('warning');
      }

      if (distance <= criticalThresholdSeconds && distance > 0 && !warned1MinRef.current) {
        warned1MinRef.current = true;
        playAlertChime('alert');
      }

      if (distance <= 0) {
        clearInterval(interval);
        setIsExpired(true);
        playAlertChime('alert');
        onExpireRef.current();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isExpired, isPaused, warningThresholdSeconds, criticalThresholdSeconds, onTick]);

  const formatTime = (totalSecs: number) => {
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const isWarning = secondsRemaining <= warningThresholdSeconds && secondsRemaining > criticalThresholdSeconds;
  const isCritical = secondsRemaining <= criticalThresholdSeconds;
  const progressPercent = Math.max(0, Math.min(100, (secondsRemaining / initialSeconds) * 100));

  return (
    <div
      id="exam-countdown-timer"
      aria-label="Exam countdown timer"
      className={`flex flex-col items-end gap-1 ${className}`}
    >
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono text-sm font-bold border transition-all ${
          isPaused
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-lg shadow-amber-950/40 ring-1 ring-amber-500/30'
            : isCritical
            ? 'bg-rose-500/20 text-rose-300 border-rose-500/60 shadow-lg shadow-rose-950/50 animate-pulse'
            : isWarning
            ? 'bg-amber-500/15 text-amber-300 border-amber-500/50 shadow-md shadow-amber-950/30'
            : 'bg-slate-800 text-indigo-300 border-indigo-500/30'
        }`}
      >
        {isPaused ? (
          <Pause className="w-4 h-4 text-amber-400 animate-pulse" />
        ) : isCritical ? (
          <AlertCircle className="w-4 h-4 text-rose-400 animate-bounce" />
        ) : isWarning ? (
          <AlertTriangle className="w-4 h-4 text-amber-400" />
        ) : (
          <Clock className="w-4 h-4 text-indigo-400" />
        )}

        <span className="tracking-wider">
          {isExpired
            ? isKa
              ? '00:00 (ვადა ამოიწურა)'
              : '00:00 (EXPIRED)'
            : formatTime(secondsRemaining)}
        </span>

        {isPaused ? (
          <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-700/60">
            {isKa ? 'შეჩერებულია' : 'Paused'}
          </span>
        ) : isCritical ? (
          <span className="text-[10px] uppercase font-bold text-rose-400 bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-700/60 hidden sm:inline">
            {isKa ? 'ავტო-ჩაბარება ახლოვდება' : 'Auto-Submit Near'}
          </span>
        ) : null}
      </div>

      {showProgress && (
        <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ease-linear rounded-full ${
              isPaused
                ? 'bg-amber-500'
                : isCritical
                ? 'bg-rose-500'
                : isWarning
                ? 'bg-amber-400'
                : 'bg-indigo-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
    </div>
  );
};
