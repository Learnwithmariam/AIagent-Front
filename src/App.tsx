import React, { useState, useEffect, useRef } from 'react';
import { apiFetch, setToken, getToken, setUnauthorizedHandler, wsUrl } from './lib/api';
import { Pause, Sparkles, ShieldCheck, Newspaper, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Aurora } from './components/ui/Aurora';
import { BrandMark, APP_NAME } from './components/ui/BrandMark';
import { TiltCard } from './components/ui/TiltCard';
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
      <div className="min-h-dvh flex flex-col items-center justify-center gap-5 text-slate-400 text-sm">
        <Aurora />
        <div className="relative z-10 flex flex-col items-center gap-5">
          <BrandMark size={64} className="float-slow" />
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <span key={i} className="typing-dot w-1.5 h-1.5 rounded-full bg-brand-400" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    const ka = language === 'ka';
    const features = [
      {
        icon: Sparkles,
        title: ka ? 'AI ასისტენტი' : 'AI teaching assistant',
        text: ka ? 'სილაბუსზე დაფუძნებული პასუხები, რამდენიმე უფასო AI მოდელით.' : 'Answers grounded in the syllabus, powered by several free AI models.',
      },
      {
        icon: ShieldCheck,
        title: ka ? 'გამოცდები მონიტორინგით' : 'Proctored exams',
        text: ka ? 'სერვერის ტაიმერი და რეალურ დროში მონიტორინგი ლექტორისთვის.' : 'Server-side timer and live monitoring for the lecturer.',
      },
      {
        icon: Newspaper,
        title: ka ? 'დილის დაიჯესტი' : 'Morning digest',
        text: ka ? 'ყოველ დილით სტარტაპების სიახლეები — ქართულად.' : 'Startup news every morning, in Georgian or English.',
      },
    ];
    return (
      <div className="min-h-dvh text-slate-100 relative">
        <Aurora />
        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 min-h-dvh flex flex-col">
          <header className="flex items-center justify-between py-6">
            <div className="flex items-center gap-3">
              <BrandMark size={40} />
              <span className="font-extrabold tracking-tight text-white">{APP_NAME}</span>
            </div>
            <div className="flex items-center p-1 rounded-xl bg-black/30 border border-white/[0.06] text-[11px] font-semibold">
              {(['ka', 'en'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLanguage(l)}
                  className={`px-2.5 py-1 rounded-lg ${language === l ? 'bg-gradient-to-br from-brand-500 to-brand-700 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  {l === 'ka' ? 'ქარ' : 'ENG'}
                </button>
              ))}
            </div>
          </header>

          <main className="flex-1 grid lg:grid-cols-[1.1fr_1fr] gap-12 lg:gap-16 items-center py-10">
            <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}>
              <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-300 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
                BTU • {ka ? 'ინოვაციური მეწარმეობა და სტარტაპები' : 'Innovative Entrepreneurship & Startups'}
              </span>
              <h1 className="mt-6 text-4xl sm:text-5xl xl:text-6xl font-extrabold tracking-tight leading-[1.05] text-white">
                {ka ? 'ისწავლე, შექმენი,' : 'Learn, build,'}
                <br />
                <span className="text-gradient-brand">{ka ? 'გაუშვი სტარტაპი.' : 'launch your startup.'}</span>
              </h1>
              <p className="mt-5 text-base sm:text-lg text-slate-300/90 max-w-xl leading-relaxed">
                {ka
                  ? 'კურსის პლატფორმა ერთ სივრცეში: AI მენტორი, გამოცდები და ყოველდღიური სიახლეები.'
                  : 'Your course in one place: an AI mentor, exams and a daily news briefing.'}
              </p>

              <div className="mt-10 grid sm:grid-cols-3 gap-3.5">
                {features.map((f, i) => (
                  <motion.div key={f.title} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.08, duration: 0.5 }}>
                    <TiltCard className="glass rounded-2xl p-4 h-full">
                      <div className="tilt__pop w-9 h-9 rounded-xl grid place-items-center bg-gradient-to-br from-brand-500/30 to-violet-600/20 border border-brand-500/30 text-brand-200 mb-3">
                        <f.icon className="w-4.5 h-4.5" />
                      </div>
                      <div className="text-sm font-bold text-white">{f.title}</div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{f.text}</p>
                    </TiltCard>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            <motion.section
              className="flex justify-center lg:justify-end"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <AuthLoginModal isOpen inline onClose={() => {}} onLoginSuccess={handleLoginSuccess} language={language} />
            </motion.section>
          </main>

          <footer className="py-6 text-[11px] text-slate-500 flex flex-wrap gap-x-4 gap-y-1 justify-between">
            <span>© {new Date().getFullYear()} {APP_NAME}</span>
            <span>Business and Technology University • Tbilisi</span>
          </footer>
        </div>
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
    <div className="min-h-dvh text-slate-100 flex flex-col relative">
      <Aurora />
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
      <main className="flex-1 relative z-10">
        <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
        >
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
        </motion.div>
        </AnimatePresence>
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
      <AnimatePresence>
        {currentRole === 'admin' && adminPauseNotification && (
          <motion.div
            id="admin-pause-notification-toast"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="fixed bottom-6 right-6 left-6 sm:left-auto z-50 sm:max-w-md glass-strong rounded-2xl p-4 flex items-start gap-3.5 border-amber-500/40 shadow-[0_24px_60px_-20px_rgba(245,158,11,0.45)]"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/40 grid place-items-center shrink-0 text-amber-300">
              <Pause className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                  {language === 'ka' ? 'სტუდენტმა გამოცდა დააპაუზა' : 'Student paused exam'}
                </span>
                <button onClick={() => setAdminPauseNotification(null)} className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-white/5" aria-label="Dismiss">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-sm font-bold text-white mt-1 truncate">
                {adminPauseNotification.studentName} <span className="text-slate-400 font-normal text-xs">({adminPauseNotification.studentEmail})</span>
              </p>
              <p className="text-xs text-slate-300 mt-0.5 truncate">
                {language === 'ka' ? 'ტესტი:' : 'Test:'} {adminPauseNotification.testTitle}
              </p>
              <div className="mt-2.5 pt-2.5 border-t border-white/[0.06] text-[11px] text-slate-300 flex items-center justify-between gap-2">
                <span className="truncate">
                  {language === 'ka' ? 'მიზეზი:' : 'Reason:'} <strong className="text-white">{adminPauseNotification.reason}</strong>
                </span>
                <span className="font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30 shrink-0">
                  {adminPauseNotification.pauseCreditsRemaining} {language === 'ka' ? 'კრედიტი' : 'left'}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
