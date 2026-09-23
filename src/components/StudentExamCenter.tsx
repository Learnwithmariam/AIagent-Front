import React, { useState } from 'react';
import {
  GraduationCap,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ShieldCheck,
  Award,
  ChevronRight,
  BookOpen,
  Calendar,
  Layers,
  FileCheck,
} from 'lucide-react';
import { Test, Student, TestSubmission } from '../types';
import { Language, translations } from '../i18n';

interface StudentExamCenterProps {
  tests: Test[];
  submissions: TestSubmission[];
  activeStudent: Student;
  onStartExam: (test: Test) => void;
  onViewSubmission: (submission: TestSubmission) => void;
  language?: Language;
}

export const StudentExamCenter: React.FC<StudentExamCenterProps> = ({
  tests,
  submissions,
  activeStudent,
  onStartExam,
  onViewSubmission,
  language = 'ka',
}) => {
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const t = translations[language];

  const studentSubmissions = submissions.filter(
    (s) => s.studentEmail.toLowerCase() === activeStudent.email.toLowerCase()
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            {t.examCenterTitle}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {t.examCenterTitle}
          </h1>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            {language === 'ka' ? (
              <>მოგესალმებით, <strong className="text-white">{activeStudent.name}</strong>. {t.examCenterSubtitle}</>
            ) : (
              <>Welcome, <strong className="text-white">{activeStudent.name}</strong>. {t.examCenterSubtitle}</>
            )}
          </p>
        </div>
      </div>

      {/* Grid of Published Tests */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-400" />
            {t.examCenterActiveTests} ({tests.length})
          </h2>
          <span className="text-xs text-slate-400">Timezone: UTC Local Time</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tests.map((test) => {
            const alreadySubmitted = studentSubmissions.find((s) => s.testId === test.id);

            return (
              <div
                key={test.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                        {test.subject}
                      </span>
                      <h3 className="text-lg font-bold text-slate-100 mt-0.5 group-hover:text-indigo-200 transition-colors">
                        {test.title}
                      </h3>
                    </div>

                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                        alreadySubmitted
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : test.status === 'active'
                          ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {alreadySubmitted ? t.completed : test.status === 'active' ? t.active : test.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                    {test.description}
                  </p>

                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-800/80 mb-5 text-xs text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{test.durationMinutes} {t.mins}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-violet-400" />
                      <span>{test.questions.length} {t.questions}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      <span>{t.examPassScore}: {test.passingScore}%</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {alreadySubmitted ? (
                    <button
                      onClick={() => onViewSubmission(alreadySubmitted)}
                      className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all"
                    >
                      <FileCheck className="w-4 h-4 text-emerald-400" />
                      <span>{t.examViewResult} ({alreadySubmitted.percentage}%)</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => setSelectedTest(test)}
                        className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                      >
                        {t.examInstructions}
                      </button>
                      <button
                        onClick={() => onStartExam(test)}
                        className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all"
                      >
                        <span>{t.examStartTest}</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Previous Submissions Table */}
      {studentSubmissions.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-amber-400" />
            {t.examPastResults}
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">{t.testTitleLabel}</th>
                  <th className="py-3 px-4">{t.reviewSubmittedAt}</th>
                  <th className="py-3 px-4">{t.score}</th>
                  <th className="py-3 px-4">{t.reviewResult}</th>
                  <th className="py-3 px-4">{t.reviewIntegrityStatus}</th>
                  <th className="py-3 px-4 text-right">{t.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {studentSubmissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-200">{sub.testTitle}</td>
                    <td className="py-3 px-4 text-slate-400 font-mono">
                      {new Date(sub.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold">
                      {sub.totalScore}/{sub.maxScore} ({sub.percentage}%)
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold ${
                          sub.passed
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {sub.passed ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {sub.passed ? t.passed : t.failed}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          sub.proctorSummary.integrityStatus === 'clean'
                            ? 'text-emerald-400 bg-emerald-500/10'
                            : sub.proctorSummary.integrityStatus === 'minor_warnings'
                            ? 'text-amber-400 bg-amber-500/10'
                            : 'text-rose-400 bg-rose-500/10'
                        }`}
                      >
                        {sub.proctorSummary.infractionsCount} {t.examStrikes} (
                        {sub.proctorSummary.integrityStatus === 'clean'
                          ? t.reviewClean
                          : sub.proctorSummary.integrityStatus === 'minor_warnings'
                          ? t.reviewMinor
                          : t.reviewSuspicious})
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onViewSubmission(sub)}
                        className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 font-medium text-xs transition-colors"
                      >
                        {t.reviewModalTitle}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Instructions Modal */}
      {selectedTest && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="font-bold text-base text-slate-100">{selectedTest.title}</h3>
              <button
                onClick={() => setSelectedTest(null)}
                className="text-slate-400 hover:text-slate-200 p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300">
              <div>
                <strong className="text-slate-200 block mb-1">{t.examInstructions}:</strong>
                <p className="bg-slate-950 p-3 rounded-xl border border-slate-800 leading-relaxed text-slate-400">
                  {selectedTest.instructions}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-1">
                <strong className="block font-bold">{t.examSecurityRulesTitle}:</strong>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-rose-200/80">
                  <li>{t.examRule1}</li>
                  <li>{t.examRule2}</li>
                  <li>{t.examRule3}</li>
                  <li>{t.examRule4}</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setSelectedTest(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                {t.cancel}
              </button>
              <button
                onClick={() => {
                  const target = selectedTest;
                  setSelectedTest(null);
                  onStartExam(target);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30"
              >
                {t.examModalStart}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
