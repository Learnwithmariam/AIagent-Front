import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../lib/api';
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flag,
  ChevronLeft,
  ChevronRight,
  Send,
  Lock,
  Maximize2,
  HelpCircle,
  XCircle,
  Pause,
  Play,
  Coffee,
} from 'lucide-react';
import { Test, Student, TestSubmission } from '../types';
import { playAlertChime } from '../utils/audio';
import { CountdownTimer } from './CountdownTimer';
import { useLanguage } from '../context/LanguageContext';

interface ExamTakingScreenProps {
  test: Test;
  student: Student;
  onExit: () => void;
  onSubmitSuccess: (submission: TestSubmission) => void;
  ws: WebSocket | null;
  /** Remaining time as calculated by the SERVER — reloading the page does not reset it. */
  initialSeconds: number;
  /** Pause credits left on the server for this attempt. */
  initialPauseCredits: number;
  maxPauses: number;
}

export const ExamTakingScreen: React.FC<ExamTakingScreenProps> = ({
  test,
  student,
  onExit,
  onSubmitSuccess,
  ws,
  initialSeconds,
  initialPauseCredits,
  maxPauses,
}) => {
  const { language } = useLanguage();
  const isKa = language === 'ka';
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAutoSubmitting, setIsAutoSubmitting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Proctoring Violations & Strike Tracking
  const [infractionsCount, setInfractionsCount] = useState(0);
  const [tabHiddenCount, setTabHiddenCount] = useState(0);
  const [windowBlurCount, setWindowBlurCount] = useState(0);
  const [copyPasteAttempts, setCopyPasteAttempts] = useState(0);
  const [flagsRaised, setFlagsRaised] = useState<string[]>([]);
  const [totalAwaySeconds, setTotalAwaySeconds] = useState(0);
  const [awaySince, setAwaySince] = useState<number | null>(null);

  // Exam Pause Feature State (Backend tracks max 3 pause credits)
  const [isPaused, setIsPaused] = useState(false);
  const [pauseCreditsRemaining, setPauseCreditsRemaining] = useState(initialPauseCredits);
  const [totalPausesUsed, setTotalPausesUsed] = useState(0);
  const [pauseModalOpen, setPauseModalOpen] = useState(false);
  const [selectedPauseReason, setSelectedPauseReason] = useState('Restroom / Personal Break');
  const [customPauseReason, setCustomPauseReason] = useState('');
  const [pauseStartTime, setPauseStartTime] = useState<number | null>(null);
  const [pauseElapsedSeconds, setPauseElapsedSeconds] = useState(0);
  const [isPausingAction, setIsPausingAction] = useState(false);
  const [isResumingAction, setIsResumingAction] = useState(false);

  const isPausedRef = useRef(false);
  isPausedRef.current = isPaused;
  const submittedRef = useRef(false);

  // Time left according to the server; changing it restarts the countdown (used after resume).
  const [serverSeconds, setServerSeconds] = useState(initialSeconds);

  // Transient warning banner state
  const [activeWarning, setActiveWarning] = useState<string | null>(null);
  const [proctorDirectMessage, setProctorDirectMessage] = useState<string | null>(null);

  const currentQuestion = test.questions[currentQuestionIndex];
  const answeredCount = Object.keys(answers).length;

  // Tick elapsed pause duration timer while paused
  useEffect(() => {
    if (!isPaused || !pauseStartTime) return;
    const interval = setInterval(() => {
      const elapsed = Math.max(0, Math.round((Date.now() - pauseStartTime) / 1000));
      setPauseElapsedSeconds(elapsed);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused, pauseStartTime]);

  // Send WebSocket Proctor Event Helper
  const sendProctorEvent = (
    eventType:
      | 'tab_hidden'
      | 'tab_visible'
      | 'window_blur'
      | 'window_focus'
      | 'copy_attempt'
      | 'paste_attempt'
      | 'context_menu'
      | 'fullscreen_exit'
      | 'timer_expired'
      | 'exam_paused'
      | 'exam_resumed',
    details: string,
    durationSeconds?: number,
    severity: 'low' | 'medium' | 'high' = 'medium'
  ) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: 'student:event',
          payload: {
            studentEmail: student.email,
            studentName: student.name,
            testId: test.id,
            testTitle: test.title,
            eventType,
            details,
            durationSeconds,
            severity,
          },
        })
      );
    }
  };

  // Join the exam session via WebSocket on mount
  useEffect(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: 'student:join',
          payload: {
            studentEmail: student.email,
            studentName: student.name,
            testId: test.id,
            testTitle: test.title,
          },
        })
      );
    }

    // Heartbeat every 5 seconds
    const hbInterval = setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'student:heartbeat',
            payload: { studentEmail: student.email },
          })
        );
      }
    }, 5000);

    // Listen for direct proctor messages and pause acks
    const handleWsMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'proctor:warning_received') {
          playAlertChime('alert');
          setProctorDirectMessage(data.payload.message);
        } else if (data.type === 'student:join_ack') {
          if (data.payload?.session) {
            if (typeof data.payload.session.pauseCreditsRemaining === 'number') {
              setPauseCreditsRemaining(data.payload.session.pauseCreditsRemaining);
            }
            if (typeof data.payload.session.totalPausesUsed === 'number') {
              setTotalPausesUsed(data.payload.session.totalPausesUsed);
            }
            if (data.payload.session.currentStatus === 'paused') {
              setIsPaused(true);
              if (data.payload.session.pausedAt) {
                setPauseStartTime(new Date(data.payload.session.pausedAt).getTime());
              }
            }
          }
        } else if (data.type === 'student:pause_ack') {
          setIsPausingAction(false);
          if (data.payload?.success) {
            setIsPaused(true);
            if (typeof data.payload.pauseCreditsRemaining === 'number') {
              setPauseCreditsRemaining(data.payload.pauseCreditsRemaining);
            }
            if (typeof data.payload.totalPausesUsed === 'number') {
              setTotalPausesUsed(data.payload.totalPausesUsed);
            }
            setPauseStartTime(Date.now());
            setPauseElapsedSeconds(0);
            setPauseModalOpen(false);
            playAlertChime('warning');
          } else {
            alert(data.payload?.error || 'Could not pause exam');
          }
        } else if (data.type === 'student:resume_ack') {
          setIsResumingAction(false);
          if (data.payload?.success) {
            setIsPaused(false);
            if (typeof data.payload.pauseCreditsRemaining === 'number') {
              setPauseCreditsRemaining(data.payload.pauseCreditsRemaining);
            }
            setPauseStartTime(null);
            playAlertChime('success');
          }
        }
      } catch (err) {
        console.error('Error parsing WS message in exam screen:', err);
      }
    };

    if (ws) {
      ws.addEventListener('message', handleWsMessage);
    }

    return () => {
      clearInterval(hbInterval);
      if (ws) {
        ws.removeEventListener('message', handleWsMessage);
      }
    };
  }, [ws, student, test]);

  // Handle Pause Examination Request
  const handleConfirmPause = async () => {
    if (pauseCreditsRemaining <= 0) {
      alert(
        isKa
          ? `პაუზის ლიმიტი ამოწურულია (მაქსიმუმ ${maxPauses}).`
          : `No pause credits remaining (maximum ${maxPauses} per exam).`
      );
      return;
    }
    setIsPausingAction(true);
    const finalReason =
      selectedPauseReason === 'Other' && customPauseReason.trim()
        ? customPauseReason.trim()
        : selectedPauseReason;

    // Pausing goes through REST only — the server counts the credit once and
    // notifies the proctor dashboard over WebSocket itself.
    try {
      const res = await apiFetch('/api/exam/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId: test.id,
          reason: finalReason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsPaused(true);
        setPauseCreditsRemaining(data.pauseCreditsRemaining);
        setTotalPausesUsed(data.session?.totalPausesUsed ?? (totalPausesUsed + 1));
        setPauseStartTime(Date.now());
        setPauseElapsedSeconds(0);
        setPauseModalOpen(false);
        playAlertChime('warning');
      } else {
        alert(data.error || 'Failed to pause exam');
      }
    } catch (err) {
      console.error('Error pausing exam:', err);
    } finally {
      setIsPausingAction(false);
    }
  };

  // Handle Resume Examination Request
  const handleResumeExam = async () => {
    setIsResumingAction(true);

    try {
      const res = await apiFetch('/api/exam/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testId: test.id }),
      });
      const data = await res.json();
      if (data.success) {
        setIsPaused(false);
        setPauseCreditsRemaining(data.pauseCreditsRemaining);
        setPauseStartTime(null);
        if (typeof data.remainingSeconds === 'number') {
          setServerSeconds(data.remainingSeconds);
        }
        playAlertChime('success');
      }
    } catch (err) {
      console.error('Error resuming exam:', err);
    } finally {
      setIsResumingAction(false);
    }
  };

  const formatSeconds = (totalSecs: number) => {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Anti-Cheating Event Listeners (visibilitychange, blur, focus, copy, paste, select, contextmenu)
  useEffect(() => {
    // 1. Visibility Change (Tab Switch Detection)
    const handleVisibilityChange = () => {
      // If student is on an approved pause, do not flag as infraction!
      if (isPausedRef.current) {
        return;
      }

      if (document.hidden) {
        // Student switched away from test tab!
        const now = Date.now();
        setAwaySince(now);
        setInfractionsCount((c) => c + 1);
        setTabHiddenCount((c) => c + 1);
        setFlagsRaised((f) => [...f, `Tab switched away at ${new Date().toLocaleTimeString()}`]);
        setActiveWarning('VIOLATION: You switched tabs or minimized the examination window!');
        playAlertChime('warning');

        sendProctorEvent(
          'tab_hidden',
          `Student switched tab or minimized browser window at ${new Date().toLocaleTimeString()}`,
          undefined,
          'high'
        );
      } else {
        // Student returned to tab
        if (awaySince) {
          const duration = Math.round((Date.now() - awaySince) / 1000);
          setTotalAwaySeconds((s) => s + duration);
          setAwaySince(null);
          sendProctorEvent(
            'tab_visible',
            `Student returned to tab after ${duration} seconds away.`,
            duration,
            'medium'
          );
        }
      }
    };

    // 2. Window Blur & Focus (Detects loss of focus / alt-tab / clicking outside applet)
    const handleWindowBlur = () => {
      // If student is on an approved pause, do not flag as infraction!
      if (isPausedRef.current) {
        return;
      }

      if (!document.hidden) {
        // Focused window changed
        setInfractionsCount((c) => c + 1);
        setWindowBlurCount((c) => c + 1);
        setFlagsRaised((f) => [...f, `Window lost focus at ${new Date().toLocaleTimeString()}`]);
        setActiveWarning('WARNING: Window lost focus. Keep focus within the active test screen.');
        playAlertChime('warning');

        sendProctorEvent(
          'window_blur',
          `Window focus lost (possible multi-monitor or desktop app switch).`,
          undefined,
          'medium'
        );
      }
    };

    const handleWindowFocus = () => {
      if (isPausedRef.current) return;
      sendProctorEvent('window_focus', `Window focus regained.`, undefined, 'low');
    };

    // 3. Prevent and Flag Copy Attempts
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      setInfractionsCount((c) => c + 1);
      setCopyPasteAttempts((c) => c + 1);
      setFlagsRaised((f) => [...f, `Unauthorized clipboard copy attempt at ${new Date().toLocaleTimeString()}`]);
      setActiveWarning('SECURITY: Copying text is strictly disabled during proctored exams.');
      playAlertChime('warning');

      sendProctorEvent(
        'copy_attempt',
        `Student attempted to copy test content to clipboard.`,
        undefined,
        'medium'
      );
    };

    // 4. Prevent and Flag Paste Attempts
    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      setInfractionsCount((c) => c + 1);
      setCopyPasteAttempts((c) => c + 1);
      setFlagsRaised((f) => [...f, `Unauthorized clipboard paste attempt at ${new Date().toLocaleTimeString()}`]);
      setActiveWarning('SECURITY: Pasting external text is strictly prohibited.');
      playAlertChime('warning');

      sendProctorEvent(
        'paste_attempt',
        `Student attempted to paste external text into test field.`,
        undefined,
        'medium'
      );
    };

    // 5. Prevent Context Menu (Right Click)
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      setActiveWarning('Right-click context menu is disabled in exam mode.');
      sendProctorEvent('context_menu', `Right click context menu attempt intercepted.`, undefined, 'low');
    };

    // 6. Prevent Text Selection
    const handleSelectStart = (e: Event) => {
      const target = e.target as HTMLElement;
      // Allow selection inside textarea/inputs only
      if (target.tagName !== 'TEXTAREA' && target.tagName !== 'INPUT') {
        e.preventDefault();
      }
    };

    // 7. Fullscreen change
    const handleFullscreenChange = () => {
      const isFs = Boolean(document.fullscreenElement);
      setIsFullscreen(isFs);
      if (!isFs) {
        sendProctorEvent('fullscreen_exit', 'Exited fullscreen examination mode.', undefined, 'medium');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [awaySince, ws, student, test]);

  // Auto-Submit triggered when CountdownTimer expires
  const handleAutoSubmit = () => {
    setIsAutoSubmitting(true);
    sendProctorEvent(
      'timer_expired',
      'Examination time limit reached. Automated submission triggered.',
      undefined,
      'low'
    );
    handleFinalSubmit(true);
  };

  const handleAnswerChange = (val: string | number) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: val,
    }));
  };

  const toggleFlagCurrent = () => {
    setFlagged((prev) => ({
      ...prev,
      [currentQuestion.id]: !prev[currentQuestion.id],
    }));
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Submit test to backend.
  // NOTE: the integrity summary is NOT sent from here — the server builds it from
  // the proctor events it recorded itself, so a tampered client can't report "clean".
  const handleFinalSubmit = async (isAutoSubmit = false) => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setIsSubmitting(true);
    try {
      // Notify WS server that student submitted
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'student:submit',
            payload: { studentEmail: student.email, testId: test.id, isAutoSubmit },
          })
        );
      }

      const res = await apiFetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId: test.id,
          answers,
          language,
          autoSubmitted: isAutoSubmit,
        }),
      });

      if (res.ok) {
        const submission: TestSubmission = await res.json();
        playAlertChime('success');
        onSubmitSuccess(submission);
      } else {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed submitting answers');
      }
    } catch (err: any) {
      submittedRef.current = false;
      alert(
        (isKa ? 'პასუხების გაგზავნა ვერ მოხერხდა: ' : 'Could not submit your answers: ') +
          (err?.message || 'network error')
      );
    } finally {
      setIsSubmitting(false);
      setIsAutoSubmitting(false);
      setShowSubmitModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col select-none">
      {/* Top Proctoring Security Header */}
      <header className="border-b border-slate-800 bg-slate-900 px-4 sm:px-6 py-3 flex items-center justify-between shadow-lg sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm text-slate-100">{test.title}</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 font-semibold uppercase tracking-wider flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                {isKa ? 'აქტიური პროქტორინგი' : 'Active Proctoring'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {isKa ? 'გამოსაცდელი: ' : 'Candidate: '}
              <span className="text-slate-200 font-medium">{student.name}</span> ({student.email})
            </p>
          </div>
        </div>

        {/* Center: Live Anti-Cheat Status & Infraction Strikes */}
        <div className="flex items-center gap-3">
          {/* Strike indicator badge */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
              infractionsCount === 0
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : infractionsCount < 3
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse'
                : 'bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>
              {isKa ? `დარღვევები: ${infractionsCount}/3` : `Infractions: ${infractionsCount}/3 strikes`}
            </span>
          </div>

          {/* Fullscreen toggle button */}
          <button
            onClick={handleToggleFullscreen}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>{isFullscreen ? (isKa ? 'გამოსვლა' : 'Exit Fullscreen') : (isKa ? 'სრული ეკრანი' : 'Fullscreen')}</span>
          </button>
        </div>

        {/* Right: Pause Exam, Countdown Timer & Submit Trigger */}
        <div className="flex items-center gap-3">
          {/* Pause Button */}
          <button
            id="exam-pause-button"
            type="button"
            onClick={() => setPauseModalOpen(true)}
            disabled={pauseCreditsRemaining <= 0 || isPaused}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
              isPaused
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-md shadow-amber-950/40 animate-pulse'
                : pauseCreditsRemaining > 0
                ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-amber-500/30 hover:border-amber-500/60 shadow-sm'
                : 'bg-slate-900 text-slate-500 border-slate-800 cursor-not-allowed opacity-50'
            }`}
            title={
              pauseCreditsRemaining > 0
                ? isKa
                  ? `გამოცდის დაპაუზება (${pauseCreditsRemaining} / 3 დარჩენილია)`
                  : `Pause Exam (${pauseCreditsRemaining} of 3 pauses remaining)`
                : isKa
                ? 'შესვენების ლიმიტი ამოიწურა (მაქსიმუმ 3)'
                : 'No pauses remaining (maximum 3 pauses reached)'
            }
          >
            <Pause className="w-3.5 h-3.5 text-amber-400" />
            <span>{isPaused ? (isKa ? 'შეჩერებულია' : 'Paused') : (isKa ? 'პაუზა' : 'Pause')}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                pauseCreditsRemaining > 0
                  ? 'bg-amber-500/20 text-amber-200'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              {pauseCreditsRemaining}/3
            </span>
          </button>

          <CountdownTimer
            initialSeconds={serverSeconds}
            onExpire={handleAutoSubmit}
            onTick={(secs) => setSecondsRemaining(secs)}
            warningThresholdSeconds={300}
            criticalThresholdSeconds={60}
            showProgress={true}
            isPaused={isPaused}
          />

          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5"
          >
            <span>{isKa ? 'დასრულება და ჩაბარება' : 'Finish & Submit'}</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Floating Warning Toast */}
      {activeWarning && (
        <div className="bg-rose-950/90 border-b border-rose-800 px-6 py-2.5 text-center text-xs font-semibold text-rose-200 flex items-center justify-center gap-2 shadow-lg animate-bounce">
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          <span>{activeWarning}</span>
          <button
            onClick={() => setActiveWarning(null)}
            className="ml-4 px-2 py-0.5 rounded bg-rose-900 hover:bg-rose-800 text-[10px] text-white"
          >
            Acknowledge
          </button>
        </div>
      )}

      {/* Main Exam Interface Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Question Content & Interactive Answering */}
        <main className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl">
          <div>
            {/* Question Meta Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-bold text-xs">
                  Question {currentQuestionIndex + 1} of {test.questions.length}
                </span>
                <span className="text-xs text-slate-400">
                  Worth: <strong className="text-slate-200">{currentQuestion.points} points</strong>
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase font-medium">
                  {currentQuestion.type === 'mcq'
                    ? 'Multiple Choice'
                    : currentQuestion.type === 'short_answer'
                    ? 'Short Answer'
                    : 'Code / Technical Essay'}
                </span>
              </div>

              <button
                onClick={toggleFlagCurrent}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  flagged[currentQuestion.id]
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>{flagged[currentQuestion.id] ? 'Flagged for Review' : 'Flag for Review'}</span>
              </button>
            </div>

            {/* Question Prompt */}
            <div className="text-base sm:text-lg font-medium text-slate-100 leading-relaxed mb-6">
              {currentQuestion.prompt}
            </div>

            {/* Optional Code Snippet in Question */}
            {currentQuestion.codeSnippet && (
              <div className="mb-6 rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-emerald-400 overflow-x-auto leading-relaxed">
                <pre>{currentQuestion.codeSnippet}</pre>
              </div>
            )}

            {/* Interactive Inputs by Question Type */}
            {currentQuestion.type === 'mcq' && currentQuestion.options && (
              <div className="space-y-3">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = answers[currentQuestion.id] === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswerChange(idx)}
                      className={`w-full text-left p-4 rounded-xl border text-sm font-medium transition-all flex items-start gap-3 ${
                        isSelected
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 shadow-md shadow-indigo-500/10'
                          : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600 text-slate-300'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
                          isSelected
                            ? 'border-indigo-400 bg-indigo-500 text-white'
                            : 'border-slate-600 bg-slate-900'
                        }`}
                      >
                        {isSelected && <span className="w-2 h-2 rounded-full bg-white"></span>}
                      </div>
                      <span className="flex-1">{option}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {(currentQuestion.type === 'short_answer' || currentQuestion.type === 'essay_code') && (
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span>Write your analytical answer below:</span>
                  <span>Auto-saved locally</span>
                </div>
                <textarea
                  value={(answers[currentQuestion.id] as string) || ''}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  placeholder={
                    currentQuestion.type === 'essay_code'
                      ? 'Type explanation and concise pseudocode/implementation here...'
                      : 'Type concise technical definition, formulas, and conditions here...'
                  }
                  rows={currentQuestion.type === 'essay_code' ? 10 : 6}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-y"
                />
              </div>
            )}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between border-t border-slate-800 pt-6 mt-8">
            <button
              onClick={() => setCurrentQuestionIndex((i) => Math.max(0, i - 1))}
              disabled={currentQuestionIndex === 0}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Question</span>
            </button>

            <span className="text-xs text-slate-400">
              {answers[currentQuestion.id] !== undefined ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Answer recorded
                </span>
              ) : (
                <span className="text-slate-500">Unanswered</span>
              )}
            </span>

            {currentQuestionIndex < test.questions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestionIndex((i) => Math.min(test.questions.length - 1, i + 1))}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all"
              >
                <span>Next Question</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowSubmitModal(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
              >
                <span>Review & Submit</span>
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </main>

        {/* Right Sidebar: Proctoring Security HUD & Question Navigator */}
        <aside className="space-y-6">
          {/* Security HUD Status */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <Lock className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Proctoring Telemetry
              </h3>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50">
                <span className="text-slate-400">Tab Switch Count:</span>
                <span className={`font-mono font-bold ${tabHiddenCount > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                  {tabHiddenCount}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50">
                <span className="text-slate-400">Window Blur Count:</span>
                <span className={`font-mono font-bold ${windowBlurCount > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                  {windowBlurCount}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50">
                <span className="text-slate-400">Copy/Paste Blocks:</span>
                <span className={`font-mono font-bold ${copyPasteAttempts > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                  {copyPasteAttempts}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50">
                <span className="text-slate-400">Total Away Time:</span>
                <span className={`font-mono font-bold ${totalAwaySeconds > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                  {totalAwaySeconds}s
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 leading-relaxed">
              Anti-cheat telemetry is encrypted and streamed via WebSocket to the examiner dashboard in real time.
            </div>
          </div>

          {/* Question Grid Navigator */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Question Navigator
              </h3>
              <span className="text-xs text-slate-400">
                {answeredCount}/{test.questions.length} answered
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {test.questions.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined;
                const isCurrent = idx === currentQuestionIndex;
                const isFlagged = flagged[q.id];

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`h-10 rounded-xl font-bold text-xs flex flex-col items-center justify-center relative transition-all ${
                      isCurrent
                        ? 'ring-2 ring-indigo-400 bg-indigo-600 text-white shadow-md'
                        : isAnswered
                        ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40'
                        : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <span>{idx + 1}</span>
                    {isFlagged && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400"></span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-600"></span>
                <span>Unanswered</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <span>Flagged</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Direct Proctor Warning Modal */}
      {proctorDirectMessage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-rose-950 border-2 border-rose-500 rounded-2xl max-w-md w-full p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 border border-rose-500/50 flex items-center justify-center mx-auto mb-4 text-rose-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-white mb-2">OFFICIAL PROCTOR WARNING</h3>
            <p className="text-sm text-rose-200 bg-rose-900/50 p-4 rounded-xl border border-rose-800 mb-6 font-mono">
              "{proctorDirectMessage}"
            </p>
            <button
              onClick={() => setProctorDirectMessage(null)}
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-rose-600/30"
            >
              I Understand & Acknowledge
            </button>
          </div>
        </div>
      )}

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-lg text-slate-100 mb-2">Confirm Exam Submission</h3>
            <p className="text-xs text-slate-400 mb-4">
              Are you ready to submit your exam answers? You will not be able to modify your answers once submitted.
            </p>

            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-2 mb-6 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Total Questions:</span>
                <span className="font-mono font-bold">{test.questions.length}</span>
              </div>
              <div className="flex justify-between text-emerald-400">
                <span>Answered:</span>
                <span className="font-mono font-bold">{answeredCount}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Unanswered:</span>
                <span className="font-mono font-bold">{test.questions.length - answeredCount}</span>
              </div>
              <div className="flex justify-between text-amber-400">
                <span>Flagged for review:</span>
                <span className="font-mono font-bold">{Object.values(flagged).filter(Boolean).length}</span>
              </div>
              <div className="flex justify-between text-rose-400">
                <span>Proctor Infractions:</span>
                <span className="font-mono font-bold">{infractionsCount}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
              >
                Continue Exam
              </button>
              <button
                onClick={() => handleFinalSubmit(false)}
                disabled={isSubmitting}
                className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-bold text-white shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  <span>Auto-Grading with AI...</span>
                ) : (
                  <>
                    <span>Confirm & Submit</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Pause Overlay when exam is actively paused */}
      {isPaused && (
        <div
          id="exam-paused-overlay"
          className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-40 flex items-center justify-center p-4 animate-in fade-in duration-300 select-none"
        >
          <div className="bg-slate-900 border-2 border-amber-500/70 rounded-3xl max-w-lg w-full p-8 shadow-2xl text-center space-y-6 relative overflow-hidden">
            {/* Ambient subtle backlights */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="w-20 h-20 rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 flex items-center justify-center mx-auto text-amber-400 shadow-xl shadow-amber-950/50">
              <Pause className="w-10 h-10 animate-pulse" />
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/80 px-3 py-1 rounded-full border border-amber-800">
                Exam Session Suspended
              </span>
              <h2 className="text-2xl font-extrabold text-white mt-3">Examination Paused</h2>
              <p className="text-xs text-slate-300 mt-1.5">
                Reason:{' '}
                <span className="font-semibold text-amber-300">
                  {selectedPauseReason === 'Other' && customPauseReason ? customPauseReason : selectedPauseReason}
                </span>
              </p>
            </div>

            {/* Live Pause Duration & Credit Counter */}
            <div className="grid grid-cols-2 gap-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs">
              <div className="text-left">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Pause Duration</span>
                <span className="text-xl font-bold font-mono text-amber-400">{formatSeconds(pauseElapsedSeconds)}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Remaining Pauses</span>
                <span className="text-xl font-bold font-mono text-emerald-400">{pauseCreditsRemaining} of 3</span>
              </div>
            </div>

            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-left space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Timer is frozen — no allocated exam time is being deducted.</span>
              </div>
              <div className="flex items-center gap-2 text-indigo-300">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Real-time notice dispatched to the proctor dashboard.</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Anti-cheat tab and blur infraction penalties are suspended.</span>
              </div>
            </div>

            <button
              id="resume-exam-button"
              type="button"
              onClick={handleResumeExam}
              disabled={isResumingAction}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 text-sm font-extrabold shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>{isResumingAction ? 'Resuming Exam...' : 'Resume Examination Now'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Pause Confirmation & Reason Modal */}
      {pauseModalOpen && (
        <div
          id="pause-confirmation-modal"
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Pause className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Pause Examination</h3>
                  <span className="text-xs text-amber-400 font-mono font-bold">
                    {pauseCreditsRemaining} of 3 pause credits remaining
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPauseModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              You can pause your exam up to 3 times. Pausing freezes the countdown clock, veils your questions, and alerts the proctor administrator in real time.
            </p>

            {/* Reason Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">Select Reason for Pause:</label>
              <div className="grid grid-cols-1 gap-2 text-xs">
                {[
                  'Restroom / Personal Break',
                  'Water / Hydration Break',
                  'Technical / Hardware Check',
                  'Mental Rest / Ergonomic Stretch',
                  'Other',
                ].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setSelectedPauseReason(reason)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                      selectedPauseReason === reason
                        ? 'bg-amber-500/15 border-amber-500 text-amber-200 font-semibold'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <span>{reason}</span>
                    {selectedPauseReason === reason && (
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    )}
                  </button>
                ))}
              </div>

              {selectedPauseReason === 'Other' && (
                <input
                  type="text"
                  placeholder="Specify brief reason..."
                  value={customPauseReason}
                  onChange={(e) => setCustomPauseReason(e.target.value)}
                  className="w-full mt-2 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPauseModalOpen(false)}
                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                id="confirm-pause-btn"
                type="button"
                onClick={handleConfirmPause}
                disabled={isPausingAction}
                className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-xs font-bold text-slate-950 shadow-md shadow-amber-500/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>{isPausingAction ? 'Pausing...' : 'Confirm & Pause'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Submit Modal when Exam Countdown Timer Expires */}
      {isAutoSubmitting && (
        <div
          id="exam-auto-submit-modal"
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300"
        >
          <div className="bg-slate-900 border-2 border-rose-500/80 rounded-2xl max-w-md w-full p-8 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-500/20 border-2 border-rose-500/60 flex items-center justify-center mx-auto text-rose-400">
              <Clock className="w-8 h-8 animate-spin" />
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 bg-rose-950/80 px-2.5 py-0.5 rounded-full border border-rose-800">
                Time Limit Reached
              </span>
              <h3 className="font-bold text-xl text-white mt-2">Exam Duration Has Expired</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              The allotted time for this examination has concluded. Your recorded answers and proctoring telemetry are being auto-finalized and securely submitted to the grading engine.
            </p>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center gap-2.5 text-xs text-indigo-300 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-ping"></span>
              <span>Submitting exam responses... Please do not close this window.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
