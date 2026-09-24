import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import {
  Radio,
  CheckCircle2,
  Calendar,
  ExternalLink,
  HelpCircle,
  Sparkles,
  BookOpen,
  Bell,
  BellOff,
} from 'lucide-react';
import { DailyDigest, Student } from '../types';
import { Language, translations } from '../i18n';

interface StudentDigestsProps {
  activeStudent: Student;
  onUpdateSubscription: (subscribed: boolean) => void;
  language?: Language;
}

export const StudentDigests: React.FC<StudentDigestsProps> = ({
  activeStudent,
  onUpdateSubscription,
  language = 'ka',
}) => {
  const t = translations[language];
  const [digests, setDigests] = useState<DailyDigest[]>([]);
  const [selectedDigest, setSelectedDigest] = useState<DailyDigest | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    fetchDigests();
  }, []);

  const fetchDigests = async () => {
    try {
      const res = await apiFetch('/api/cron/digests');
      if (res.ok) {
        const data: DailyDigest[] = await res.json();
        setDigests(data);
        if (data.length > 0) setSelectedDigest(data[0]);
      }
    } catch (err) {
      console.error('Failed fetching digests', err);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner with Subscription Preference */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Radio className="w-5 h-5 text-indigo-400" />
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
              {t.tabDigests}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {t.digestTitle}
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            {t.digestSubtitle}
          </p>
        </div>

        <span className="px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] text-slate-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {language === 'ka' ? 'ახალი დაიჯესტი ყოველ დილით 08:00-ზე, აქვე' : 'A new digest here every morning at 08:00'}
        </span>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: List of Past Daily Briefings */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" />
            {t.digestArchives} ({digests.length})
          </h2>

          <div className="space-y-3">
            {digests.map((d) => {
              const isSelected = selectedDigest?.id === d.id;
              return (
                <div
                  key={d.id}
                  onClick={() => {
                    setSelectedDigest(d);
                    setSelectedAnswer(null);
                    setShowExplanation(false);
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500 shadow-md'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span className="font-mono">{d.date}</span>
                    <span className="font-semibold text-indigo-400">{d.subjectFocus}</span>
                  </div>
                  <h3 className="font-bold text-sm text-slate-100 line-clamp-2">{d.headline}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">{d.summary}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Full Digest Reader View */}
        <div className="lg:col-span-2">
          {selectedDigest ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
              {/* Digest Header */}
              <div className="border-b border-slate-800 pb-5">
                <div className="flex items-center gap-2 text-xs text-indigo-400 font-semibold uppercase tracking-wider mb-2">
                  <Calendar className="w-4 h-4" />
                  <span>{t.date}: {selectedDigest.date}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-100 leading-tight">
                  {selectedDigest.headline}
                </h2>
                <p className="text-sm text-slate-300 mt-2 leading-relaxed">
                  {selectedDigest.summary}
                </p>
              </div>

              {/* Key Articles & Pedagogical Takeaways */}
              <div>
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  {t.digestKeyArticles}
                </h3>

                <div className="space-y-4">
                  {selectedDigest.keyArticles.map((article, idx) => (
                    <div
                      key={idx}
                      className="lift bg-slate-950/60 border border-slate-800 rounded-xl p-5"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h4 className="font-bold text-sm text-slate-100">{article.title}</h4>
                        <span className="text-[11px] font-mono text-slate-400 shrink-0 bg-slate-800 px-2 py-0.5 rounded">
                          {article.source}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed mb-3">
                        {article.summary}
                      </p>

                      <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-lg p-3 text-xs">
                        <div className="font-semibold text-indigo-300 flex items-center gap-1.5 mb-1">
                          <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                          {language === 'ka' ? 'სასწავლო კავშირი და დასკვნა:' : 'Curriculum Connection & Takeaway:'}
                        </div>
                        <p className="text-slate-300">{article.pedagogicalTakeaway}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Challenge Question of the Day */}
              {selectedDigest.challengeQuestion && (
                <div className="bg-gradient-to-br from-indigo-950/40 to-slate-950 border border-indigo-500/30 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <HelpCircle className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      {t.digestChallengeQuestion}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-100 mb-4">
                    {selectedDigest.challengeQuestion.question}
                  </h4>

                  <div className="space-y-2 mb-4">
                    {selectedDigest.challengeQuestion.options.map((opt, oIdx) => {
                      const isSelected = selectedAnswer === oIdx;
                      return (
                        <button
                          key={oIdx}
                          onClick={() => {
                            setSelectedAnswer(oIdx);
                            setShowExplanation(true);
                          }}
                          className={`w-full text-left p-3 rounded-lg border text-xs font-medium transition-all ${
                            isSelected
                              ? 'bg-indigo-600/30 border-indigo-400 text-white'
                              : 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {showExplanation && (
                    <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 text-xs text-slate-300 leading-relaxed">
                      <strong className="text-emerald-400 block mb-1">{t.digestExplanation}</strong>
                      {selectedDigest.challengeQuestion.explanation}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
              {language === 'ka' ? 'დაიჯესტი არ არის არჩეული.' : 'No daily digest selected.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

