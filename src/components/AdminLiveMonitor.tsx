import React, { useState } from 'react';
import {
  Radio,
  ShieldAlert,
  Volume2,
  VolumeX,
  AlertTriangle,
  User,
  Clock,
  Send,
  CheckCircle,
  XCircle,
  Filter,
  Eye,
  MessageSquareWarning,
  Pause,
  Play,
} from 'lucide-react';
import { ActiveExamSession, ProctorEvent } from '../types';
import { Language, translations } from '../i18n';

interface AdminLiveMonitorProps {
  activeSessions: ActiveExamSession[];
  proctorEvents: ProctorEvent[];
  ws: WebSocket | null;
  audioEnabled: boolean;
  onToggleAudio: () => void;
  language?: Language;
}

export const AdminLiveMonitor: React.FC<AdminLiveMonitorProps> = ({
  activeSessions,
  proctorEvents,
  ws,
  audioEnabled,
  onToggleAudio,
  language = 'ka',
}) => {
  const t = translations[language];
  const [warningTarget, setWarningTarget] = useState<ActiveExamSession | null>(null);
  const [customWarningText, setCustomWarningText] = useState(t.liveWarningDefaultText || 'Tab switch detected. Return your focus to the test window immediately or your session will be invalidated.');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const sendWarningToStudent = (studentEmail: string) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      alert('WebSocket is disconnected. Cannot send warning.');
      return;
    }

    ws.send(
      JSON.stringify({
        type: 'admin:send_warning',
        payload: {
          studentEmail,
          message: customWarningText,
        },
      })
    );

    setWarningTarget(null);
  };

  const filteredEvents = proctorEvents.filter((evt) => {
    if (filterSeverity !== 'all' && evt.severity !== filterSeverity) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        evt.studentName.toLowerCase().includes(q) ||
        evt.studentEmail.toLowerCase().includes(q) ||
        evt.eventType.toLowerCase().includes(q) ||
        evt.details.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeCount = activeSessions.filter((s) => s.currentStatus !== 'submitted').length;
  const pausedCount = activeSessions.filter((s) => s.currentStatus === 'paused').length;
  const awayCount = activeSessions.filter((s) => s.currentStatus === 'away_tab' || s.currentStatus === 'away_window').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Real-time Header HUD */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
              {t.liveHeaderBadge || t.liveMonitorTitle}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {t.liveMonitorTitle}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t.liveMonitorSubtitle}
          </p>
        </div>

        {/* Stats & Audio alert toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">{t.liveInExam}</div>
              <div className="text-base font-bold text-emerald-400 font-mono">{activeCount}</div>
            </div>
            <div className="h-6 w-px bg-slate-800"></div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">{t.livePausedCount}</div>
              <div className={`text-base font-bold font-mono ${pausedCount > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-300'}`}>
                {pausedCount}
              </div>
            </div>
            <div className="h-6 w-px bg-slate-800"></div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-semibold">{t.liveAway}</div>
              <div className={`text-base font-bold font-mono ${awayCount > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-300'}`}>
                {awayCount}
              </div>
            </div>
          </div>

          <button
            onClick={onToggleAudio}
            className={`p-2.5 rounded-xl border transition-all ${
              audioEnabled
                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40'
                : 'bg-slate-800 text-slate-500 border-slate-700'
            }`}
            title={audioEnabled ? (language === 'ka' ? 'ხმოვანი სიგნალი ჩართულია' : 'Audio alerts enabled') : (language === 'ka' ? 'ხმოვანი სიგნალი გათიშულია' : 'Audio alerts muted')}
          >
            {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Active Students Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Radio className="w-5 h-5 text-indigo-400 animate-pulse" />
            {t.liveStudentsList} ({activeSessions.length})
          </h2>
          <span className="text-xs text-slate-400">{t.liveStreamUpdatesNotice || 'Status updates stream automatically'}</span>
        </div>

        {activeSessions.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
            <User className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="font-medium text-slate-300">{t.liveNoSessions}</p>
            <p className="text-xs text-slate-500 mt-1">
              {language === 'ka'
                ? 'გადართეთ სტუდენტის რეჟიმზე გამოცდის დასაწყებად და რეალური დროის მონიტორინგის სანახავად.'
                : 'Switch to Student mode to start an examination and inspect live proctoring events here.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeSessions.map((session) => {
              const isPaused = session.currentStatus === 'paused';
              const isAwayTab = session.currentStatus === 'away_tab';
              const isAwayWindow = session.currentStatus === 'away_window';
              const isWarningState = session.currentStatus === 'warning_state';
              const isSubmitted = session.currentStatus === 'submitted';

              return (
                <div
                  key={session.studentEmail}
                  className={`rounded-2xl p-5 border transition-all ${
                    isPaused
                      ? 'bg-amber-950/20 border-amber-500/80 shadow-xl shadow-amber-950/30'
                      : isAwayTab
                      ? 'bg-rose-950/30 border-rose-500 shadow-xl shadow-rose-950/40 animate-pulse'
                      : isAwayWindow
                      ? 'bg-amber-950/20 border-amber-500'
                      : isWarningState
                      ? 'bg-rose-950/40 border-rose-600'
                      : isSubmitted
                      ? 'bg-slate-900/60 border-slate-800 opacity-80'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-bold text-sm text-slate-100">{session.studentName}</h3>
                      <span className="text-xs text-slate-400 font-mono">{session.studentEmail}</span>
                    </div>

                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border flex items-center gap-1 ${
                        isPaused
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : isAwayTab
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : isAwayWindow
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : isWarningState
                          ? 'bg-rose-500/30 text-rose-200 border-rose-500'
                          : isSubmitted
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isPaused
                            ? 'bg-amber-400 animate-pulse'
                            : isAwayTab || isWarningState
                            ? 'bg-rose-400 animate-ping'
                            : isAwayWindow
                            ? 'bg-amber-400'
                            : isSubmitted
                            ? 'bg-indigo-400'
                            : 'bg-emerald-400'
                        }`}
                      ></span>
                      {isPaused
                        ? (t.liveExamPausedBadge || 'EXAM PAUSED')
                        : isAwayTab
                        ? (t.liveTabHiddenBadge || 'TAB HIDDEN')
                        : isAwayWindow
                        ? (t.liveFocusLostBadge || 'FOCUS LOST')
                        : isWarningState
                        ? (t.liveSuspiciousBadge || 'SUSPICIOUS')
                        : isSubmitted
                        ? (t.liveSubmittedBadge || 'SUBMITTED')
                        : (t.liveSafeBadge || 'IN TAB (SAFE)')}
                    </span>
                  </div>

                  <div className="text-xs text-slate-300 font-medium mb-3 truncate">
                    {language === 'ka' ? 'ტესტი:' : 'Test:'} <span className="text-indigo-300">{session.testTitle}</span>
                  </div>

                  {/* Pause Active Banner */}
                  {isPaused && (
                    <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-2.5 mb-3 text-xs text-amber-200 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-bold">
                          <Pause className="w-3.5 h-3.5 text-amber-400" />
                          {t.liveStudentOnPause}
                        </span>
                        <span className="font-mono text-[10px] bg-amber-900/80 px-2 py-0.5 rounded text-amber-200 border border-amber-700/60 font-bold">
                          {session.pauseCreditsRemaining ?? 2}/3 {t.livePausesLeft}
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-300 truncate">
                        {t.liveReason} <strong className="text-white">{session.pauseReason || (language === 'ka' ? 'სტუდენტმა მოითხოვა შესვენება' : 'Candidate requested break')}</strong>
                      </p>
                    </div>
                  )}

                  {/* Telemetry Metrics */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-xs mb-4">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">{t.liveInfractions}</span>
                      <span
                        className={`font-mono font-bold text-sm ${
                          session.infractionsCount > 0 ? 'text-rose-400' : 'text-slate-300'
                        }`}
                      >
                        {session.infractionsCount} {t.liveStrikes}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">{t.liveAwayDuration}</span>
                      <span className="font-mono font-bold text-sm text-slate-300">
                        {session.totalAwaySeconds}{language === 'ka' ? 'წმ' : 's'}
                      </span>
                    </div>
                  </div>

                  {/* Pauses Used Badge if not currently paused */}
                  {!isPaused && session.totalPausesUsed !== undefined && session.totalPausesUsed > 0 && (
                    <div className="text-[11px] text-slate-400 bg-slate-950 p-2 rounded-lg border border-slate-800 mb-3 flex items-center justify-between">
                      <span>{t.livePausesUsed}</span>
                      <span className="font-mono font-bold text-amber-400">
                        {session.totalPausesUsed}/3 ({language === 'ka' ? 'დარჩა:' : 'left:'} {session.pauseCreditsRemaining ?? (3 - session.totalPausesUsed)})
                      </span>
                    </div>
                  )}

                  {session.lastEvent && (
                    <div className="text-[11px] text-slate-400 bg-slate-800/50 p-2 rounded-lg border border-slate-800 mb-4 line-clamp-2">
                      <strong className="text-slate-300">{t.liveLatestEvent}</strong> {session.lastEvent.details}
                    </div>
                  )}

                  {!isSubmitted && (
                    <button
                      onClick={() => setWarningTarget(session)}
                      className="w-full py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/40 border border-rose-500/40 text-rose-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      <MessageSquareWarning className="w-4 h-4 text-rose-400" />
                      <span>{t.liveSendWarningBtn}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Proctoring Event Log Stream */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
              {t.liveAuditLogTitle}
            </h2>
            <p className="text-xs text-slate-400">
              {language === 'ka'
                ? 'ტაბის გადართვის, ფანჯრის დაბინდვისა და ბუფერის დაცვის სრული აუდიტის ჟურნალი'
                : 'Complete audit trail of all tab switches, window blurs, and intercepted clipboard actions'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder={t.liveSearchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />

            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">{t.liveFilterAll}</option>
              <option value="high">{t.liveFilterHigh}</option>
              <option value="medium">{t.liveFilterMedium}</option>
              <option value="low">{t.liveFilterLow}</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">{t.liveTableTimestamp}</th>
                <th className="py-3 px-4">{t.liveTableCandidate}</th>
                <th className="py-3 px-4">{t.liveTableEventType}</th>
                <th className="py-3 px-4">{t.liveTableDetails}</th>
                <th className="py-3 px-4">{t.liveTableSeverity}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 italic">
                    {t.liveNoEventsMatching}
                  </td>
                </tr>
              ) : (
                filteredEvents.slice(0, 40).map((evt) => (
                  <tr key={evt.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-slate-400 font-mono whitespace-nowrap">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200">{evt.studentName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{evt.studentEmail}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-mono text-[11px] px-2 py-0.5 rounded border inline-flex items-center gap-1.5 ${
                          evt.eventType === 'exam_paused'
                            ? 'bg-amber-950/60 text-amber-300 border-amber-600/50'
                            : evt.eventType === 'exam_resumed'
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-600/50'
                            : evt.eventType === 'timer_expired'
                            ? 'bg-rose-950/60 text-rose-300 border-rose-600/50'
                            : 'text-indigo-300 bg-indigo-950/40 border-indigo-800/40'
                        }`}
                      >
                        {evt.eventType === 'exam_paused' && <Pause className="w-3 h-3 text-amber-400" />}
                        {evt.eventType === 'exam_resumed' && <Play className="w-3 h-3 text-emerald-400" />}
                        {evt.eventType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">{evt.details}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          evt.severity === 'high'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : evt.severity === 'medium'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {evt.severity === 'high' ? (language === 'ka' ? 'მაღალი' : 'high') : evt.severity === 'medium' ? (language === 'ka' ? 'საშუალო' : 'medium') : (language === 'ka' ? 'დაბალი' : 'low')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Send Warning to Student Modal */}
      {warningTarget && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-400 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-base text-slate-100">{t.liveModalSendWarningTitle}</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              {language === 'ka' ? (
                <>ეს შეტყობინება დაუყოვნებლივ გამოჩნდება <strong>{warningTarget.studentName}</strong>-ის საგამოცდო ეკრანზე WebSocket კავშირით.</>
              ) : (
                <>This message will immediately pop up over <strong>{warningTarget.studentName}</strong>'s exam screen via real-time WebSocket connection.</>
              )}
            </p>

            <textarea
              value={customWarningText}
              onChange={(e) => setCustomWarningText(e.target.value)}
              rows={4}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500/50 mb-4"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setWarningTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                {t.btnCancel || 'Cancel'}
              </button>
              <button
                onClick={() => sendWarningToStudent(warningTarget.studentEmail)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/30 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                {t.liveModalSendBtn || 'Dispatch Real-Time Warning'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
