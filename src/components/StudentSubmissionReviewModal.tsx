import React from 'react';
import { Award, CheckCircle, XCircle, ShieldAlert, Clock, Layers } from 'lucide-react';
import { TestSubmission, Test, Question } from '../types';
import { Language, translations } from '../i18n';

interface StudentSubmissionReviewModalProps {
  submission: TestSubmission;
  test?: Test;
  onClose: () => void;
  language?: Language;
}

export const StudentSubmissionReviewModal: React.FC<StudentSubmissionReviewModalProps> = ({
  submission,
  test,
  onClose,
  language = 'ka',
}) => {
  const t = translations[language];
  const questions: Question[] = test?.questions || [];
  const pending = submission.status === 'pending_review';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-lg text-slate-100">{submission.testTitle}</h2>
              {pending ? (
                <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  {language === 'ka' ? 'ელოდება ლექტორის შეფასებას' : 'Awaiting lecturer grading'}
                </span>
              ) : (
              <span
                className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                  submission.passed
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                }`}
              >
                {submission.passed ? t.passed : t.failed} ({submission.percentage}%)
              </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {t.reviewCandidate} <strong className="text-slate-200">{submission.studentName}</strong> • {t.reviewSubmittedAt}{' '}
              {new Date(submission.submittedAt).toLocaleString()}
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-2 rounded-lg hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        {/* Score & Integrity Bar */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-500 block uppercase text-[10px] font-bold">{t.reviewTotalScore}</span>
            <span className="text-base font-bold text-indigo-400 font-mono">
              {pending ? '—' : submission.totalScore} / {submission.maxScore}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block uppercase text-[10px] font-bold">{t.reviewPercentage}</span>
            <span className="text-base font-bold text-slate-200 font-mono">{pending ? '—' : `${submission.percentage}%`}</span>
          </div>
          <div>
            <span className="text-slate-500 block uppercase text-[10px] font-bold">{t.reviewIntegrityStatus}</span>
            <span
              className={`font-semibold ${
                submission.proctorSummary.integrityStatus === 'clean'
                  ? 'text-emerald-400'
                  : 'text-rose-400'
              }`}
            >
              {submission.proctorSummary.infractionsCount} {t.examInfractions}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block uppercase text-[10px] font-bold">{t.reviewAutoGradedBy}</span>
            <span className="text-slate-300">
              {pending ? (language === 'ka' ? 'ჯერ არ არის შეფასებული' : 'Not graded yet') : language === 'ka' ? 'ლექტორი' : 'Lecturer'}
            </span>
          </div>
        </div>

        {/* Questions and Feedback List */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {questions.map((q, idx) => {
            const studentAns = submission.answers[q.id];
            const grading = submission.questionGradings?.[q.id];

            return (
              <div
                key={q.id}
                className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                      {t.examQuestion} {idx + 1} • {q.type.replace('_', ' ')}
                    </span>
                    <h3 className="font-semibold text-sm text-slate-200 mt-1">{q.prompt}</h3>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-xs text-indigo-300">
                      {pending || !grading ? '—' : grading.earnedPoints} / {q.points} {t.points}
                    </span>
                  </div>
                </div>

                {/* Candidate's Answer */}
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    {t.reviewYourAnswer}
                  </span>
                  {q.type === 'mcq' && q.options ? (
                    <div className="font-medium text-slate-200">
                      {typeof studentAns === 'number'
                        ? `${String.fromCharCode(65 + studentAns)}. ${q.options[studentAns]}`
                        : 'None'}
                    </div>
                  ) : (
                    <div className="font-mono text-slate-300 whitespace-pre-wrap">
                      {(studentAns as string) || <span className="text-slate-500">{t.examUnanswered}</span>}
                    </div>
                  )}
                </div>

                {/* Feedback */}
                {grading && grading.feedback && (
                  <div className="p-3 bg-indigo-950/30 rounded-lg border border-indigo-500/20 text-xs text-slate-300">
                    <strong className="text-indigo-300 block mb-1">{t.reviewFeedback}</strong>
                    {grading.feedback}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-end bg-slate-950/60">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};

