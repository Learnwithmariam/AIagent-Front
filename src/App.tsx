import React, { useState, useEffect, useRef } from 'react';
import { apiFetch, setToken, getToken, setUnauthorizedHandler, wsUrl } from './lib/api';
import { Pause } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { StudentTeachingAgent } from './components/StudentTeachingAgent';
import { StudentExamCenter } from './components/StudentExamCenter';
import { ExamTakingScreen } from './components/ExamTakingScreen';
import { StudentDigests } from './components/StudentDigests';
import { AdminLiveMonitor } from './components/AdminLiveMonitor';
import { AdminTestManager } from './components/AdminTestManager';
import { AdminKnowledgeBase } from './components/AdminKnowledgeBase';
import { AdminStudentDirectory } from './components/AdminStudentDirectory';
import { AdminDigestCron } from './components/AdminDigestCron';
import { StudentSubmissionReviewModal } from './components/StudentSubmissionReviewModal';
import { PasswordChangeModal } from './components/PasswordChangeModal';
import { AuthLoginModal } from './components/AuthLoginModal';
import { Role, Student, Test, TestSubmission, ActiveExamSession, ProctorEvent, UserAccount } from './types';
import { playAlertChime } from './utils/audio';
import { useLanguage } from './context/LanguageContext';

export default function App() {
  const { language, setLanguage } = useLanguage();
  const [currentRole, setCurrentRole] = useState<Role>('student');
  const [activeTab, setActiveTab] = useState<string>('agent');
  const [booting, setBooting] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [tests, setTests] = useState<Test[]>([]);
  const [submissions, setSubmissions] = useState<TestSubmission[]>([]);

  // Authentication. There is no anonymous access: nothing loads before login.
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);

  // Active examination state. The server decides the remaining time and pause credits.
  const [activeExam, setActiveExam] = useState<Test | null>(null);
  const [examSession, setExamSession] = useState<{
    remainingSeconds: number;
    pauseCreditsRemaining: number;
    maxPauses: number;
  } | null>(null);
  const [startingExam, setStartingExam] = useState(false);
  const [selectedSubmissionReview, setSelectedSubmissionReview] = useState<TestSubmission | null>(null);

  // Real-time WebSocket proctoring state
  const [wsConnected, setWsConnected] = useState(false);
  const [activeSessions, setActiveSessions] = useState<ActiveExamSession[]>([]);
  const [proctorEvents, setProctorEvents] = useState<ProctorEvent[]>([]);
  const [audioAlertsEnabled, setAudioAlertsEnabled] = useState(true);
  const [adminPauseNotification, setAdminPauseNotification] = useState<{
    studentName: string;
    studentEmail: string;
    testTitle: string;
    pauseCreditsRemaining: number;
    reason?: string;
    timestamp: string;
  } | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Auto-dismiss pause notification banner after 9 seconds
  useEffect(() => {
    if (!adminPauseNotification) return;
    const timer = setTimeout(() => {
      setAdminPauseNotification(null);
    }, 9000);
    return () => clearTimeout(timer);
  }, [adminPauseNotification]);

  // Restore the session on page load (token kept in localStorage)
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setCurrentUser(null);
      setActiveStudent(null);
      setActiveExam(null);
      setShowLoginModal(true);
    });

    const restore = async () => {
      if (!getToken()) {
        setBooting(false);
        setShowLoginModal(true);
        return;
      }
      const res = await apiFetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        applySession(data.user, data.student, Boolean(data.user.isTemporaryPassword));
      } else {
        setShowLoginModal(true);
      }
      setBooting(false);
    };
    restore().catch(() => setBooting(false));
  }, []);

  const applySession = (user: UserAccount, student: Student | null, requiresPasswordChange: boolean) => {
    setCurrentUser(user);
    setCurrentRole(user.role);
    setActiveTab(user.role === 'admin' ? 'test-manager' : 'agent');
    setActiveStudent(
      user.role === 'student'
        ? student || {
            id: user.id,
            name: user.name,
            email: user.email,
            avatar: '',
            enrolledAt: user.createdAt || new Date().toISOString(),
            digestSubscribed: true,
            department: user.department || '',
          }
        : null
    );
    if (requiresPasswordChange) setShowPasswordChangeModal(true);
    fetchInitialData(user.role);
  };

  const handleLogout = () => {
    setToken(null);
    setCurrentUser(null);
    setActiveStudent(null);
    setActiveExam(null);
    setStudents([]);
    setTests([]);
    setSubmissions([]);
    setProctorEvents([]);
    setActiveSessions([]);
    setShowLoginModal(true);
  };

  // Only requests the endpoints this role is allowed to see.
  const fetchInitialData = async (role: Role = currentRole) => {
    try {
      const requests: Promise<Response>[] = [apiFetch('/api/tests'), apiFetch('/api/submissions')];
      if (role === 'admin') {
        requests.push(apiFetch('/api/students'), apiFetch('/api/proctor/events'));
      }
      const [testsRes, subsRes, stdRes, evtsRes] = await Promise.all(requests);

      if (testsRes.ok) setTests(await testsRes.json());
      if (subsRes.ok) setSubmissions(await subsRes.json());
      if (stdRes?.ok) setStudents(await stdRes.json());
      if (evtsRes?.ok) setProctorEvents(await evtsRes.json());
    } catch (err) {
      console.error('Failed fetching bootstrap data', err);
    }
  };

  /** Ask the server to open (or resume) the attempt, then enter the exam screen. */
  const handleStartExam = async (test: Test) => {
    if (startingExam) return;
    setStartingExam(true);
    try {
      const res = await apiFetch('/api/exam/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testId: test.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || (language === 'ka' ? 'გამოცდის დაწყება ვერ მოხერხდა.' : 'Could not start the exam.'));
        return;
      }
      setExamSession({
        remainingSeconds: data.remainingSeconds,
        pauseCreditsRemaining: Math.max(0, (data.maxPauses ?? 0) - (data.attempt?.pausesUsed ?? 0)),
        maxPauses: data.maxPauses ?? 0,
      });
      setActiveExam(data.test); // server copy: no correct answers inside
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({ type: 'student:join', payload: { testId: data.test.id } })
        );
      }
    } catch (err) {
      alert(language === 'ka' ? 'ქსელის შეცდომა.' : 'Network error.');
    } finally {
      setStartingExam(false);
    }
  };

  // WebSocket Connection Management
  useEffect(() => {
    if (!currentUser) return;
    let ws: WebSocket;
    let reconnectTimeout: any;
    let closedByUs = false;

    const connectWebSocket = () => {
      try {
        // The token travels in the query string — browsers can't set headers on WebSockets.
        ws = new WebSocket(wsUrl());
        wsRef.current = ws;

        ws.onopen = () => {
          setWsConnected(true);
          if (currentUser.role === 'admin') {
            ws.send(JSON.stringify({ type: 'admin:subscribe' }));
          }
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'admin:sessions_update') {
              setActiveSessions(msg.payload);
            } else if (msg.type === 'admin:init_state') {
              if (msg.payload?.activeSessions) {
                setActiveSessions(msg.payload.activeSessions);
              }
              if (msg.payload?.recentEvents) {
                setProctorEvents(msg.payload.recentEvents);
              }
            } else if (msg.type === 'admin:student_joined' || msg.type === 'admin:session_updated') {
              const updatedSession: ActiveExamSession = msg.payload;
              setActiveSessions((prev) => {
                const next = [...prev];
                const idx = next.findIndex((s) => s.studentEmail === updatedSession.studentEmail);
                if (idx >= 0) next[idx] = updatedSession;
                else next.push(updatedSession);
                return next;
              });
            } else if (msg.type === 'admin:student_paused') {
              const { session, studentName, studentEmail, testTitle, pauseCreditsRemaining, pauseReason } = msg.payload;
              if (session) {
                setActiveSessions((prev) => {
                  const next = [...prev];
                  const idx = next.findIndex((s) => s.studentEmail === session.studentEmail);
                  if (idx >= 0) next[idx] = session;
                  else next.push(session);
                  return next;
                });
              }
              setAdminPauseNotification({
                studentName: studentName || session?.studentName || studentEmail,
                studentEmail,
                testTitle: testTitle || session?.testTitle || 'Exam',
                pauseCreditsRemaining: pauseCreditsRemaining ?? session?.pauseCreditsRemaining ?? 2,
                reason: pauseReason || session?.pauseReason || 'Candidate requested pause',
                timestamp: new Date().toLocaleTimeString(),
              });
              if (audioAlertsEnabled) {
                playAlertChime('warning');
              }
            } else if (msg.type === 'admin:student_resumed') {
              const { session } = msg.payload;
              if (session) {
                setActiveSessions((prev) => {
                  const next = [...prev];
                  const idx = next.findIndex((s) => s.studentEmail === session.studentEmail);
                  if (idx >= 0) next[idx] = session;
                  else next.push(session);
                  return next;
                });
              }
            } else if (msg.type === 'admin:proctor_alert') {
              const newEvt: ProctorEvent = msg.payload.event;
              setProctorEvents((prev) => [newEvt, ...prev]);

              if (msg.payload.session) {
                const updated: ActiveExamSession = msg.payload.session;
                setActiveSessions((prev) => {
                  const next = [...prev];
                  const idx = next.findIndex((s) => s.studentEmail === updated.studentEmail);
                  if (idx >= 0) next[idx] = updated;
                  else next.push(updated);
                  return next;
                });
              }

              // Play chime if enabled
              if (audioAlertsEnabled && (newEvt.severity === 'high' || newEvt.severity === 'medium')) {
                playAlertChime('alert');
              }
            }
          } catch (e) {
            console.error('Failed parsing WS message', e);
          }
        };

        ws.onclose = (evt) => {
          setWsConnected(false);
          // 4001/4003 = rejected by the server (bad or expired token) — don't hammer it
          if (!closedByUs && evt.code !== 4001 && evt.code !== 4003) {
            reconnectTimeout = setTimeout(connectWebSocket, 3000);
          }
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch (err) {
        console.error('WebSocket connection error:', err);
      }
    };

    connectWebSocket();

    return () => {
      closedByUs = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (wsRef.current) wsRef.current.close();
    };
  }, [audioAlertsEnabled, currentUser?.id]);

  const handleLoginSuccess = (user: UserAccount, student: Student | null, requiresPasswordChange: boolean) => {
    setShowLoginModal(false);
    applySession(user, student, requiresPasswordChange || Boolean(user.isTemporaryPassword));
  };

  const handlePasswordChangeSuccess = (updatedUser: UserAccount) => {
    setCurrentUser(updatedUser);
  };

  // Nothing is rendered before the session is known
  if (booting) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center text-sm">
        {language === 'ka' ? 'იტვირთება…' : 'Loading…'}
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-2xl font-bold">CogniTest • BTU</h1>
        <p className="text-slate-400 text-sm max-w-md">
          {language === 'ka'
            ? 'კურსის პლატფორმა: AI ასისტენტი, გამოცდები და დილის დაიჯესტი. გასაგრძელებლად გაიარეთ ავტორიზაცია.'
            : 'Course platform: AI assistant, proctored exams and the morning digest. Please sign in to continue.'}
        </p>
        <button
          onClick={() => setShowLoginModal(true)}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm"
        >
          {language === 'ka' ? 'შესვლა' : 'Sign in'}
        </button>
        <AuthLoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={handleLoginSuccess}
          language={language}
        />
      </div>
    );
  }

  // If student is in an active proctored exam, take over the screen
  if (activeExam && activeStudent && examSession) {
    return (
      <ExamTakingScreen
        test={activeExam}
        student={activeStudent}
        ws={wsRef.current}
        initialSeconds={examSession.remainingSeconds}
        initialPauseCredits={examSession.pauseCreditsRemaining}
        maxPauses={examSession.maxPauses}
        onExit={() => {
          setActiveExam(null);
          setExamSession(null);
        }}
        onSubmitSuccess={(newSubmission) => {
          setSubmissions((prev) => [newSubmission, ...prev]);
          setActiveExam(null);
          setExamSession(null);
          setSelectedSubmissionReview(newSubmission);
          setActiveTab('results');
          fetchInitialData();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Global Application Navbar */}
      <Navbar
        currentRole={currentRole}
        activeStudent={activeStudent}
        onLogout={handleLogout}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        wsConnected={wsConnected}
        activeExamTitle={activeExam ? activeExam.title : null}
        language={language}
        onLanguageChange={setLanguage}
        currentUser={currentUser}
        onOpenPasswordModal={() => setShowPasswordChangeModal(true)}
      />

      {/* Main Routed Area */}
      <main className="flex-1">
        {currentRole === 'student' && activeStudent && (
          <>
            {activeTab === 'agent' && <StudentTeachingAgent activeStudent={activeStudent} language={language} />}
            {activeTab === 'exams' && (
              <StudentExamCenter
                tests={tests}
                submissions={submissions}
                activeStudent={activeStudent}
                onStartExam={handleStartExam}
                onViewSubmission={(sub) => setSelectedSubmissionReview(sub)}
                language={language}
              />
            )}
            {activeTab === 'results' && (
              <StudentExamCenter
                tests={tests}
                submissions={submissions}
                activeStudent={activeStudent}
                onStartExam={handleStartExam}
                onViewSubmission={(sub) => setSelectedSubmissionReview(sub)}
                language={language}
              />
            )}
            {activeTab === 'digests' && (
              <StudentDigests
                activeStudent={activeStudent}
                onUpdateSubscription={(isSubscribed) => {
                  setActiveStudent({ ...activeStudent, digestSubscribed: isSubscribed });
                  setStudents((prev) =>
                    prev.map((s) =>
                      s.email === activeStudent.email ? { ...s, digestSubscribed: isSubscribed } : s
                    )
                  );
                }}
                language={language}
              />
            )}
          </>
        )}

        {currentRole === 'admin' && (
          <>
            {activeTab === 'live-monitor' && (
              <AdminLiveMonitor
                activeSessions={activeSessions}
                proctorEvents={proctorEvents}
                ws={wsRef.current}
                audioEnabled={audioAlertsEnabled}
                onToggleAudio={() => setAudioAlertsEnabled(!audioAlertsEnabled)}
                language={language}
              />
            )}
            {activeTab === 'test-manager' && (
              <AdminTestManager
                tests={tests}
                submissions={submissions}
                onRefreshTests={() => fetchInitialData()}
                onUpdateSubmission={(updated) => {
                  setSubmissions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
                }}
                language={language}
              />
            )}
            {activeTab === 'knowledge-base' && <AdminKnowledgeBase language={language} />}
            {activeTab === 'students-dir' && (
              <AdminStudentDirectory
                students={students}
                onRefreshStudents={() => fetchInitialData()}
                language={language}
              />
            )}
            {activeTab === 'cron-digest' && <AdminDigestCron language={language} />}
          </>
        )}
      </main>

      {/* Student Submission Review Modal */}
      {selectedSubmissionReview && (
        <StudentSubmissionReviewModal
          submission={selectedSubmissionReview}
          test={tests.find((t) => t.id === selectedSubmissionReview.testId)}
          onClose={() => setSelectedSubmissionReview(null)}
          language={language}
        />
      )}

      {/* Admin Real-Time Pause Notification Toast */}
      {currentRole === 'admin' && adminPauseNotification && (
        <div
          id="admin-pause-notification-toast"
          className="fixed bottom-6 right-6 z-50 max-w-md w-full bg-slate-900 border-2 border-amber-500/80 rounded-2xl p-4 shadow-2xl shadow-amber-950/70 flex items-start gap-3.5 animate-in slide-in-from-bottom-5 duration-300"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-400">
            <Pause className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                {language === 'ka' ? 'სტუდენტმა გამოცდა დააპაუზა' : 'Student Paused Exam'}
              </span>
              <button
                onClick={() => setAdminPauseNotification(null)}
                className="text-slate-400 hover:text-slate-200 text-xs p-1"
              >
                ✕
              </button>
            </div>
            <p className="text-xs font-bold text-white mt-1">
              {adminPauseNotification.studentName}{' '}
              <span className="text-slate-400 font-normal">({adminPauseNotification.studentEmail})</span>
            </p>
            <p className="text-[11px] text-amber-300 mt-0.5 font-medium truncate">
              {language === 'ka' ? 'ტესტი:' : 'Test:'} {adminPauseNotification.testTitle}
            </p>
            <div className="mt-2 text-[11px] text-slate-300 flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="truncate mr-2">
                {language === 'ka' ? 'მიზეზი:' : 'Reason:'} <strong className="text-white">{adminPauseNotification.reason}</strong>
              </span>
              <span className="font-mono font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/60 shrink-0">
                {adminPauseNotification.pauseCreditsRemaining} {language === 'ka' ? 'კრედიტი დარჩა' : 'credits left'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Mandatory / On-Demand Password Change Modal */}
      {currentUser && (
        <PasswordChangeModal
          isOpen={showPasswordChangeModal}
          currentUser={currentUser}
          onClose={() => setShowPasswordChangeModal(false)}
          onSuccess={handlePasswordChangeSuccess}
          language={language}
          forced={Boolean(currentUser.isTemporaryPassword)}
        />
      )}
    </div>
  );
}
