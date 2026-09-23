import React, { useState } from 'react';
import { apiFetch } from '../lib/api';
import {
  Sparkles,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Award,
  ShieldAlert,
  Save,
  RotateCcw,
} from 'lucide-react';
import { TestSubmission, Test, Question, QuestionGrading } from '../types';
import { Language, translations } from '../i18n';

interface AdminGradingModalProps {
  submission: TestSubmission;
  test?: Test;
  onClose: () => void;
  onUpdateSubmission: (updated: TestSubmission) => void;
  language?: Language;
}

export const AdminGradingModal: React.FC<AdminGradingModalProps> = ({
  submission,
  test,
  onClose,
  onUpdateSubmission,
  language = 'ka',
}) => {
  const t = translations[language];
  const [gradings, setGradings] = useState<Record<string, QuestionGrading>>(
    submission.questionGradings || {}
  );
  const [isAiGrading, setIsAiGrading] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const questions: Question[] = test?.questions || [];

  const handleScoreChange = (questionId: string, earnedPoints: number) => {
    setGradings((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        earnedPoints,
        isCorrect: earnedPoints > 0,
      },
    }));
  };

  const handleFeedbackChange = (questionId: string, feedback: string) => {
    setGradings((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        feedback,
      },
    }));
  };

  const handleRunAiGrading = async (q: Question) => {
    const studentAns = submission.answers[q.id];
    if (studentAns === undefined) return;

    setIsAiGrading(q.id);
    try {
      const res = await apiFetch('/api/ai/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          studentAnswer: studentAns,
          language,
        }),
      });

      if (res.ok) {
        const aiResult: QuestionGrading = await res.json();
        setGradings((prev) => ({
          ...prev,
          [q.id]: aiResult,
        }));
      }
    } catch (err) {
      alert(language === 'ka' ? 'კითხვის AI შეფასება ვერ მოხერხდა.' : 'Failed running AI grading on question.');
    } finally {
      setIsAiGrading(null);
    }
  };

  const handleSaveGrades = async () => {
    setIsSaving(true);
    let totalScore = 0;
    const maxScore = questions.reduce((sum, q) => sum + q.points, 0) || submission.maxScore;

    Object.values(gradings).forEach((g) => {
      totalScore += g.earnedPoints;
    });

    const percentage = Math.round((totalScore / maxScore) * 100);
    const passingScore = test?.passingScore || 70;
    const passed = percentage >= passingScore;

    try {
      const res = await apiFetch(`/api/submissions/${submission.id}/grade`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grading: gradings,
          questionGradings: gradings,
          totalScore,
          percentage,
          passed,
          gradedBy: 'ai_and_admin',
        }),
      });

      if (res.ok) {
        const updated: TestSubmission = await res.json();
        onUpdateSubmission(updated);
        onClose();
      }
    } catch (err) {
      alert(language === 'ka' ? 'ქულების შენახვა ვერ მოხერხდა.' : 'Error updating submission grades.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-lg text-slate-100">
                {t.gradingModalTitle}
              </h2>
              <span
                className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                  submission.passed
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                }`}
              >
                {submission.percentage}% ({submission.passed ? t.statusPassed : t.statusFailed})
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {language === 'ka' ? 'სტუდენტი:' : 'Candidate:'} <strong className="text-slate-200">{submission.studentName}</strong> ({submission.studentEmail}) • {t.exam}: {submission.testTitle}
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-2 rounded-lg hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        {/* Proctoring Integrity Summary Banner */}
        <div className="bg-slate-950 px-6 py-3 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-indigo-400" />
            <span className="text-slate-300 font-medium">{t.proctoringTelemetry}:</span>
            <span
              className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                submission.proctorSummary.integrityStatus === 'clean'
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-rose-500/10 text-rose-400'
              }`}
            >
              {submission.proctorSummary.infractionsCount} {t.infractions} (
              {submission.proctorSummary.integrityStatus.replace('_', ' ')})
            </span>
          </div>

          <div className="text-slate-400 font-mono">
            {t.awayTime}: {submission.proctorSummary.awayTimeSeconds}s • {t.tabSwitches}:{' '}
            {submission.proctorSummary.tabHiddenCount}
          </div>
        </div>

        {/* Questions and Answers Review List */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {questions.map((q, idx) => {
            const studentAnswer = submission.answers[q.id];
            const grading = gradings[q.id] || {
              questionId: q.id,
              earnedPoints: 0,
              maxPoints: q.points,
              isCorrect: false,
              feedback: language === 'ka' ? 'ჯერ არ არის შეფასებული' : 'Not graded yet',
            };

            return (
              <div
                key={q.id}
                className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-4"
              >
                {/* Question Info Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <span className="text-[10px] font-bold uppercase text-indigo-400 tracking-wider">
                      {t.question} {idx + 1} • {q.type.replace('_', ' ')}
                    </span>
                    <h3 className="font-semibold text-sm text-slate-200 mt-1">{q.prompt}</h3>
                    {q.codeSnippet && (
                      <pre className="mt-2 p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto">
                        {q.codeSnippet}
                      </pre>
                    )}
                  </div>

                  {/* Points Input & Controls */}
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="number"
                      min={0}
                      max={q.points}
                      value={grading.earnedPoints}
                      onChange={(e) => handleScoreChange(q.id, Number(e.target.value))}
                      className="w-14 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-center font-bold text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-slate-400">/ {q.points} {t.pts}</span>

                    {/* AI Re-grade button for subjective questions */}
                    {(q.type === 'short_answer' || q.type === 'essay_code') && (
                      <button
                        onClick={() => handleRunAiGrading(q)}
                        disabled={isAiGrading === q.id}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Sparkles className="w-3 h-3 text-indigo-400" />
                        <span>{isAiGrading === q.id ? (language === 'ka' ? 'აფასებს...' : 'Grading...') : t.regradeBtn}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Candidate's Submitted Answer */}
                <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-800">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    {t.candidateAnswer}:
                  </div>
                  {q.type === 'mcq' ? (
                    <div className="text-xs text-slate-200 font-medium">
                      {typeof studentAnswer === 'number' && q.options
                        ? `${String.fromCharCode(65 + studentAnswer)}. ${q.options[studentAnswer]}`
                        : (language === 'ka' ? 'პასუხი არ არის არჩეული' : 'No answer selected')}
                      <span className="ml-2 text-slate-500">
                        ({language === 'ka' ? 'სწორი პასუხი იყო:' : 'Correct was:'}{' '}
                        {typeof q.correctAnswer === 'number' && q.options
                          ? `${String.fromCharCode(65 + q.correctAnswer)}. ${q.options[q.correctAnswer]}`
                          : 'N/A'}
                        )
                      </span>
                    </div>
                  ) : (
                    <div className="text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {(studentAnswer as string) || <span className="text-slate-500 italic">{language === 'ka' ? 'უპასუხო' : 'Unanswered'}</span>}
                    </div>
                  )}
                </div>

                {/* Feedback / Evaluation Note */}
                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    <span>{t.evaluationFeedback}:</span>
                  </div>
                  <textarea
                    value={grading.feedback || ''}
                    onChange={(e) => handleFeedbackChange(q.id, e.target.value)}
                    rows={2}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer with Save */}
        <div className="p-5 border-t border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="text-xs text-slate-400">
            {t.totalScoreCalculated}:{' '}
            <strong className="text-indigo-300 font-mono text-sm">
              {Object.values(gradings).reduce((sum, g) => sum + g.earnedPoints, 0)} / {submission.maxScore}
            </strong>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
            >
              {t.cancel}
            </button>
            <button
              onClick={handleSaveGrades}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? (language === 'ka' ? 'შენახვა...' : 'Updating...') : t.savePublishGrade}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

