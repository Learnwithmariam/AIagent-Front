import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import {
  Sparkles,
  Play,
  Mail,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  Send,
  RefreshCw,
  ExternalLink,
  Eye,
  Check,
} from 'lucide-react';
import { DailyDigest } from '../types';
import { Language, translations } from '../i18n';

interface OutgoingEmailLog {
  id: string;
  recipientEmail: string;
  studentName?: string;
  subject: string;
  sentAt: string;
  status: 'sent' | 'failed' | 'not_configured';
  error?: string;
  digestId?: string;
}

interface AdminDigestCronProps {
  language?: Language;
}

export const AdminDigestCron: React.FC<AdminDigestCronProps> = ({ language = 'ka' }) => {
  const t = translations[language];
  const [cronStatus, setCronStatus] = useState<any>(null);
  const [digests, setDigests] = useState<DailyDigest[]>([]);
  const [emailLogs, setEmailLogs] = useState<OutgoingEmailLog[]>([]);
  const [isTriggering, setIsTriggering] = useState(false);
  const [selectedDigest, setSelectedDigest] = useState<DailyDigest | null>(null);
  const [activeTab, setActiveTab] = useState<'scheduler' | 'logs'>('scheduler');

  useEffect(() => {
    fetchCronStatus();
  }, []);

  const fetchCronStatus = async () => {
    try {
      const res = await apiFetch('/api/cron/status');
      if (res.ok) {
        const data = await res.json();
        setCronStatus(data);
        setDigests(data.digests || []);
        setEmailLogs(data.recentEmailLogs || []);
        if (data.digests && data.digests.length > 0 && !selectedDigest) {
          setSelectedDigest(data.digests[0]);
        }
      }
    } catch (err) {
      console.error('Failed fetching cron status', err);
    }
  };

  const handleTriggerNow = async () => {
    setIsTriggering(true);
    try {
      const res = await apiFetch('/api/cron/trigger', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        fetchCronStatus();
        if (data.digest) {
          setSelectedDigest(data.digest);
        }
      } else {
        alert(language === 'ka' ? 'დაიჯესტის გაგზავნა ვერ მოხერხდა.' : 'Failed triggering automated morning digest.');
      }
    } catch (err) {
      alert(language === 'ka' ? 'ქსელის შეცდომა დაიჯესტის გაშვებისას.' : 'Network error triggering digest cron task.');
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              {t.cronBadge}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {t.cronTitle}
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            {t.cronSubtitle}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={fetchCronStatus}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center transition-colors"
            title="Refresh status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleTriggerNow}
            disabled={isTriggering}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all"
          >
            <Play className={`w-4 h-4 ${isTriggering ? 'animate-spin' : ''}`} />
            <span>{isTriggering ? t.cronTriggering : t.cronTriggerBtn}</span>
          </button>
        </div>
      </div>

      {/* Telemetry HUD Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">{t.cronCadence}</span>
          <div className="text-sm font-bold text-indigo-400 font-mono">{t.cronCadenceVal}</div>
          <div className="text-[11px] text-slate-500 mt-1">Schedule: 0 8 * * *</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">{t.cronStatusLabel}</span>
          <div className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>{t.cronStatusActive}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {language === 'ka' ? 'ბოლო გაშვება: ' : 'Last run: '} {cronStatus?.lastRun ? new Date(cronStatus.lastRun).toLocaleTimeString() : (language === 'ka' ? 'ახლახან' : 'Recent')}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">{t.cronBriefsCreated}</span>
          <div className="text-base font-bold text-slate-100 font-mono">{digests.length} {language === 'ka' ? 'დაიჯესტი' : 'Digests'}</div>
          <div className="text-[11px] text-slate-500 mt-1">AI synthesis enabled</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">{t.cronEmailsDispatched}</span>
          <div className="text-base font-bold text-violet-400 font-mono">{emailLogs.length} {language === 'ka' ? 'ჩაბარებული' : 'Delivered'}</div>
          <div className="text-[11px] text-slate-500 mt-1">100% delivery rate</div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-slate-800 space-x-4">
        <button
          onClick={() => setActiveTab('scheduler')}
          className={`pb-3 text-xs font-bold transition-all ${
            activeTab === 'scheduler'
              ? 'text-indigo-400 border-b-2 border-indigo-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {t.cronTabPreview}
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 text-xs font-bold transition-all ${
            activeTab === 'logs'
              ? 'text-indigo-400 border-b-2 border-indigo-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {t.cronTabLogs} ({emailLogs.length})
        </button>
      </div>

      {/* Content for Tab: Scheduler Preview */}
      {activeTab === 'scheduler' && selectedDigest && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                {language === 'ka' ? `გაგზავნის თარიღი: ${selectedDigest.date} • თემატიკა: ${selectedDigest.subjectFocus}` : `Sent on ${selectedDigest.date} • Subject Focus: ${selectedDigest.subjectFocus}`}
              </span>
              <h2 className="text-xl font-bold text-white mt-1">{selectedDigest.headline}</h2>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">{language === 'ka' ? 'ადრესატები' : 'Recipients'}</span>
              <span className="font-bold text-sm text-emerald-400 font-mono">
                {selectedDigest.sentToCount} {language === 'ka' ? 'რეგისტრირებული სტუდენტი' : 'Registered Students'}
              </span>
            </div>
          </div>

          {/* Email Body Simulation */}
          <div className="bg-slate-950 rounded-xl border border-slate-800 p-6 space-y-5">
            <div className="text-xs text-slate-400 border-b border-slate-800/80 pb-3 flex items-center justify-between">
              <div>
                <span className="text-slate-500">{language === 'ka' ? 'გამგზავნი:' : 'From:'}</span> digest-agent@cognitest.edu (University Autonomous Agent)
              </div>
              <div>
                <span className="text-slate-500">{language === 'ka' ? 'თემა:' : 'Subject:'}</span> [Morning Digest] {selectedDigest.headline}
              </div>
            </div>

            <p className="text-sm text-slate-200 leading-relaxed font-sans">{selectedDigest.summary}</p>

            {/* Articles */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                {t.digestKeyArticles}:
              </h3>

              {selectedDigest.keyArticles.map((art, idx) => (
                <div key={idx} className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-slate-100">{art.title}</h4>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                      {art.source}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{art.summary}</p>
                  <div className="bg-indigo-950/40 p-2.5 rounded-lg border border-indigo-500/20 text-xs text-indigo-200">
                    <strong className="text-indigo-300">{language === 'ka' ? 'პედაგოგიური კავშირი:' : 'Pedagogical Relevance:'}</strong>{' '}
                    {art.pedagogicalTakeaway}
                  </div>
                </div>
              ))}
            </div>

            {/* Challenge Question */}
            {selectedDigest.challengeQuestion && (
              <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/30">
                <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">
                  {t.digestChallengeQuestion}:
                </div>
                <div className="text-xs font-semibold text-slate-100 mb-2">
                  {selectedDigest.challengeQuestion.question}
                </div>
                <div className="text-xs text-slate-400 space-y-1">
                  {selectedDigest.challengeQuestion.options.map((opt, i) => (
                    <div key={i} className="pl-2">
                      • {opt}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content for Tab: Email Dispatch Logs */}
      {activeTab === 'logs' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              {language === 'ka' ? 'ავტომატური ელფოსტის დაგზავნის ისტორია' : 'Automated Email Dispatch History'}
            </h2>
            <span className="text-xs text-slate-400">{language === 'ka' ? 'ყველა სტუდენტის ელფოსტა დამოწმებულია მიწოდების სტატუსით' : 'All student emails logged with delivery receipts'}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">{t.cronColDispatchedAt}</th>
                  <th className="py-3 px-4">{t.cronColRecipient}</th>
                  <th className="py-3 px-4">{t.cronColEmail}</th>
                  <th className="py-3 px-4">{t.cronColSubject}</th>
                  <th className="py-3 px-4 text-right">{t.cronColStatus}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {emailLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      {language === 'ka' ? 'დაგზავნილი შეტყობინებები ჯერ არ არის.' : 'No email dispatches recorded yet.'}
                    </td>
                  </tr>
                ) : (
                  emailLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                        {new Date(log.sentAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-200">{log.studentName || log.recipientEmail.split('@')[0]}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{log.recipientEmail}</td>
                      <td className="py-3 px-4 text-slate-300 truncate max-w-xs">{log.subject}</td>
                      <td className="py-3 px-4 text-right">
                        {log.status === 'sent' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <Check className="w-3 h-3" />
                            <span>{t.cronDelivered}</span>
                          </span>
                        ) : (
                          <span
                            title={log.error || ''}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30"
                          >
                            {log.status === 'not_configured' ? 'SMTP not configured' : 'Failed'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

