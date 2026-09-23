import React, { useState } from 'react';
import { apiFetch } from '../lib/api';
import {
  GraduationCap,
  Plus,
  Clock,
  Calendar,
  CheckCircle2,
  XCircle,
  Award,
  Layers,
  FileCheck,
  Edit,
  Trash2,
  ShieldAlert,
  Save,
} from 'lucide-react';
import { Test, TestSubmission, Question } from '../types';
import { Language, translations } from '../i18n';
import { AdminGradingModal } from './AdminGradingModal';

interface AdminTestManagerProps {
  tests: Test[];
  submissions: TestSubmission[];
  onRefreshTests: () => void;
  onUpdateSubmission: (updated: TestSubmission) => void;
  language?: Language;
}

export const AdminTestManager: React.FC<AdminTestManagerProps> = ({
  tests,
  submissions,
  onRefreshTests,
  onUpdateSubmission,
  language = 'ka',
}) => {
  const t = translations[language];
  const [activeTab, setActiveTab] = useState<'submissions' | 'tests'>('submissions');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [gradingSubmission, setGradingSubmission] = useState<TestSubmission | null>(null);

  // New Test Form State
  const [newTestTitle, setNewTestTitle] = useState('');
  const [newTestSubject, setNewTestSubject] = useState(
    language === 'ka' ? 'სტარტაპები და ინოვაციური მეწარმეობა' : 'Startups & Innovative Entrepreneurship'
  );
  const [newTestDesc, setNewTestDesc] = useState('');
  const [newTestDuration, setNewTestDuration] = useState(30);
  const [newTestPassingScore, setNewTestPassingScore] = useState(60);
  const [newTestStartTime, setNewTestStartTime] = useState(new Date().toISOString().slice(0, 16));
  const [newTestEndTime, setNewTestEndTime] = useState(
    new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 16)
  );
  const [newTestInstructions, setNewTestInstructions] = useState(
    'Anti-cheat proctoring is enabled. Any tab switch, window blur, or clipboard operation will trigger an infraction strike.'
  );

  // Form Questions list with manual points
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: 'q-demo-1',
      prompt: 'რომელი ინდიკატორი განსაზღვრავს სტარტაპის Product-Market Fit-ს (PMF) შონ ელისის (Sean Ellis) ტესტის მიხედვით?',
      type: 'mcq',
      options: [
        'მომხმარებელთა 40%+ ძალიან იმედგაცრუებული იქნება პროდუქტის გაუქმების შემთხვევაში',
        'თვიური აქტიური მომხმარებლების (MAU) 10%-იანი ზრდა',
        'მომხმარებლის მოზიდვის ხარჯი (CAC) აღემატება მომხმარებლის სასიცოცხლო ღირებულებას (LTV)',
        'პირველ კვარტალში $10,000-იანი შემოსავლის მიღწევა'
      ],
      correctAnswer: 0,
      points: 25,
    },
    {
      id: 'q-demo-2',
      prompt: 'აღწერეთ რა განსხვავებაა Post-Money SAFE-სა და Pre-Money SAFE-ს შორის სტარტაპის საწყის ეტაპზე ინვესტიციის მოზიდვისას.',
      type: 'short_answer',
      gradingCriteria: 'უნდა ახსნას დამფუძნებლების წილის განზავება (dilution), კაპიტალიზაციის ცხრილის (Cap Table) გამჭვირვალობა და საკონვერტაციო ზღვარი (Valuation Cap).',
      points: 35,
    },
    {
      id: 'q-demo-3',
      prompt: 'განმარტეთ Lean Startup მეთოდოლოგიის Build-Measure-Learn ციკლი და MVP-ს (Minimum Viable Product) როლი ჰიპოთეზების ვალიდაციაში.',
      type: 'short_answer',
      gradingCriteria: 'უნდა ახსნას ექსპერიმენტები, რაოდენობრივი/თვისებრივი უკუკავშირი, Pivot ან Persevere გადაწყვეტილების მიღება.',
      points: 40,
    }
  ]);

  const totalAllocatedPoints = questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0);
  const isOver100Points = totalAllocatedPoints > 100;
  const isUnder100Points = totalAllocatedPoints < 100;

  const [isCreating, setIsCreating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleUpdateQuestionPoints = (id: string, points: number) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, points: Math.max(1, points || 0) } : q))
    );
    setValidationError(null);
  };

  const handleUpdateQuestionPrompt = (id: string, prompt: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, prompt } : q))
    );
  };

  const handleUpdateQuestionCorrectAnswer = (id: string, correctAnswer: number) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, correctAnswer } : q))
    );
  };

  const handleCreateTest = async () => {
    setValidationError(null);
    if (!newTestTitle.trim()) {
      setValidationError(language === 'ka' ? 'გთხოვთ მიუთითოთ გამოცდის სათაური.' : 'Please provide a test title.');
      return;
    }

    if (questions.length === 0) {
      setValidationError(language === 'ka' ? 'გამოცდა უნდა შეიცავდეს მინიმუმ 1 კითხვას.' : 'Test must contain at least 1 question.');
      return;
    }

    if (totalAllocatedPoints > 100) {
      setValidationError(
        language === 'ka'
          ? `ჯამური ქულა ვერ გადააჭარბებს 100-ს! მიმდინარე ჯამი: ${totalAllocatedPoints} ქულა. გთხოვთ შეამციროთ კითხვების ქულები.`
          : `Total points cannot exceed 100! Current total: ${totalAllocatedPoints} pts. Please adjust question points.`
      );
      return;
    }

    if (totalAllocatedPoints === 0) {
      setValidationError(language === 'ka' ? 'ჯამური ქულა უნდა აღემატებოდეს 0-ს.' : 'Total points must be greater than 0.');
      return;
    }

    setIsCreating(true);
    try {
      const res = await apiFetch('/api/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTestTitle,
          subject: newTestSubject,
          description: newTestDesc,
          durationMinutes: Number(newTestDuration),
          passingScore: Number(newTestPassingScore),
          startTime: new Date(newTestStartTime).toISOString(),
          endTime: new Date(newTestEndTime).toISOString(),
          instructions: newTestInstructions,
          questions,
          status: 'active',
        }),
      });

      if (res.ok) {
        onRefreshTests();
        setShowCreateModal(false);
        setActiveTab('tests');
        // Reset
        setNewTestTitle('');
        setNewTestDesc('');
        setValidationError(null);
      } else {
        const errData = await res.json();
        setValidationError(errData.error || 'Failed creating test');
      }
    } catch (err) {
      setValidationError(language === 'ka' ? 'ტესტის შექმნის შეცდომა' : 'Network error creating test');
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddQuestion = (type: 'mcq' | 'short_answer' | 'essay_code') => {
    // Determine suggested default points so it does not immediately breach 100 if possible
    const remaining = Math.max(5, 100 - totalAllocatedPoints);
    const suggestedPoints = Math.min(type === 'mcq' ? 10 : 20, remaining);

    const newQ: Question = {
      id: `q-${Date.now()}`,
      prompt:
        type === 'mcq'
          ? (language === 'ka' ? 'ახალი სავარიანტო კითხვა (MCQ) სტარტაპებზე ან მეწარმეობაზე:' : 'New Multiple Choice Question on Startups or Entrepreneurship:')
          : type === 'short_answer'
          ? (language === 'ka' ? 'ახალი თეორიული ან პრაქტიკული ანალიზის კითხვა:' : 'New Analytical or Business Model Question:')
          : (language === 'ka' ? 'საქმის ანალიზი (Case Study) ან ვენჩურული სტრატეგია:' : 'Startup Case Study or Venture Strategy Essay:'),
      type,
      options: type === 'mcq'
        ? (language === 'ka' ? ['ვარიანტი A', 'ვარიანტი B', 'ვარიანტი C', 'ვარიანტი D'] : ['Option A', 'Option B', 'Option C', 'Option D'])
        : undefined,
      correctAnswer: type === 'mcq' ? 0 : undefined,
      gradingCriteria:
        type !== 'mcq' ? (language === 'ka' ? 'საკვანძო მეწარმეობითი პრინციპები, ლოგიკური არგუმენტაცია და ბიზნეს მოდელის სიზუსტე.' : 'Core entrepreneurial concepts, logical argumentation, and business model precision.') : undefined,
      points: suggestedPoints,
    };
    setQuestions((prev) => [...prev, newQ]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-indigo-400" />
            {t.testManagerTitle}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t.testManagerSubtitle}
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{t.createTestBtn}</span>
        </button>
      </div>

      {/* Sub tabs */}
      <div className="flex border-b border-slate-800 space-x-4">
        <button
          onClick={() => setActiveTab('submissions')}
          className={`pb-3 text-xs font-bold transition-all relative ${
            activeTab === 'submissions'
              ? 'text-indigo-400 border-b-2 border-indigo-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {t.tabSubmissionsList} ({submissions.length})
        </button>
        <button
          onClick={() => setActiveTab('tests')}
          className={`pb-3 text-xs font-bold transition-all relative ${
            activeTab === 'tests'
              ? 'text-indigo-400 border-b-2 border-indigo-500'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {t.tabTestsList} ({tests.length})
        </button>
      </div>

      {/* Tab: Submissions Review */}
      {activeTab === 'submissions' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              {t.tabSubmissionsList}
            </h2>
            <span className="text-xs text-slate-400">{t.testInspectHelp}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">{t.testColCandidate}</th>
                  <th className="py-3 px-4">{t.testColTitle}</th>
                  <th className="py-3 px-4">{t.testColSubmitted}</th>
                  <th className="py-3 px-4">{t.testColScore}</th>
                  <th className="py-3 px-4">{t.testColResult}</th>
                  <th className="py-3 px-4">{t.testColProctoring}</th>
                  <th className="py-3 px-4 text-right">{t.testColActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {submissions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      {t.testNoSubmissions}
                    </td>
                  </tr>
                ) : (
                  submissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-200">{sub.studentName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{sub.studentEmail}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-200 font-medium">{sub.testTitle}</td>
                      <td className="py-3 px-4 text-slate-400 font-mono">
                        {new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                          {sub.passed ? (language === 'ka' ? 'ჩაბარებულია' : 'PASSED') : (language === 'ka' ? 'ვერ ჩააბარა' : 'FAILED')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              sub.proctorSummary.integrityStatus === 'clean'
                                ? 'text-emerald-400 bg-emerald-500/10'
                                : 'text-rose-400 bg-rose-500/10'
                            }`}
                          >
                            {sub.proctorSummary.infractionsCount} {language === 'ka' ? 'დარღვევა' : 'strikes'}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            ({sub.proctorSummary.awayTimeSeconds}{language === 'ka' ? 'წმ გასვლა' : 's away'})
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setGradingSubmission(sub)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-all"
                        >
                          {t.manualGradeBtn || t.testGradeReviewBtn}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Published Tests */}
      {activeTab === 'tests' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tests.map((test) => (
            <div
              key={test.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                      {test.subject}
                    </span>
                    <h3 className="font-bold text-base text-slate-100">{test.title}</h3>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {test.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 mb-4">{test.description}</p>

                <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-800 text-xs text-slate-300 mb-4">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">{t.testFieldDuration}</span>
                    <span className="font-bold">{test.durationMinutes} {language === 'ka' ? 'წუთი' : 'mins'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">{t.testQuestionsCount}</span>
                    <span className="font-bold">{test.questions.length}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">{t.testFieldPassScore}</span>
                    <span className="font-bold">{test.passingScore}%</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 space-y-1">
                  <div>
                    {t.testFieldStart}: <span className="font-mono text-slate-300">{test.startTime}</span>
                  </div>
                  <div>
                    {t.testFieldEnd}: <span className="font-mono text-slate-300">{test.endTime}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Test Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h2 className="font-bold text-lg text-slate-100">{t.newTestModalTitle}</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">{t.testTitleLabel}</label>
                  <input
                    type="text"
                    value={newTestTitle}
                    onChange={(e) => setNewTestTitle(e.target.value)}
                    placeholder={language === 'ka' ? 'მაგ: განაწილებული სისტემები და მონაცემთა ბაზები' : 'e.g. Distributed Consensus & Cloud Storage Midterm'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">{t.testSubjectLabel}</label>
                  <select
                    value={newTestSubject}
                    onChange={(e) => setNewTestSubject(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option>{language === 'ka' ? 'სტარტაპები და ინოვაციური მეწარმეობა' : 'Startups & Innovative Entrepreneurship'}</option>
                    <option>{language === 'ka' ? 'ვენჩურული კაპიტალი და MVP ვალიდაცია' : 'Venture Capital & MVP Validation'}</option>
                    <option>{language === 'ka' ? 'ინოვაციური ბიზნეს მოდელები & Unit Economics' : 'Innovative Business Models & Unit Economics'}</option>
                    <option>{language === 'ka' ? 'ტექნოლოგიური მეწარმეობა & IP Strategy' : 'Tech Entrepreneurship & IP Strategy'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">{t.testFieldDesc}</label>
                <textarea
                  value={newTestDesc}
                  onChange={(e) => setNewTestDesc(e.target.value)}
                  rows={2}
                  placeholder={language === 'ka' ? 'გამოცდის თემების შეჯამება და სტუდენტებისთვის მოლოდინები...' : 'Summary of topics covered and examination expectations...'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">{t.testDurationLabel}</label>
                  <input
                    type="number"
                    value={newTestDuration}
                    onChange={(e) => setNewTestDuration(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">{t.testPassingScoreLabel}</label>
                  <input
                    type="number"
                    value={newTestPassingScore}
                    onChange={(e) => setNewTestPassingScore(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">{t.testFieldStart}</label>
                  <input
                    type="datetime-local"
                    value={newTestStartTime}
                    onChange={(e) => setNewTestStartTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">{t.testFieldEnd}</label>
                  <input
                    type="datetime-local"
                    value={newTestEndTime}
                    onChange={(e) => setNewTestEndTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Point Allocation & 100-Point Limit Validation Bar */}
              <div className={`p-4 rounded-xl border transition-all ${
                isOver100Points
                  ? 'bg-rose-950/40 border-rose-500/50 text-rose-200 shadow-lg shadow-rose-950/30'
                  : totalAllocatedPoints === 100
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                  : 'bg-indigo-950/30 border-indigo-500/30 text-indigo-200'
              }`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm tracking-wide">
                      {language === 'ka' ? 'ტესტის ქულების განაწილება:' : 'Score Allocation & 100-Pt Limit:'}
                    </span>
                    <span className={`text-base font-black px-2.5 py-0.5 rounded-lg font-mono ${
                      isOver100Points
                        ? 'bg-rose-600 text-white animate-pulse'
                        : totalAllocatedPoints === 100
                        ? 'bg-emerald-600 text-white'
                        : 'bg-indigo-600 text-white'
                    }`}>
                      {totalAllocatedPoints} / 100 {language === 'ka' ? 'ქულა' : 'pts'}
                    </span>
                  </div>

                  <div>
                    {isOver100Points ? (
                      <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
                        <XCircle className="w-4 h-4" />
                        {language === 'ka'
                          ? `ლიმიტი გადაჭარბებულია ${totalAllocatedPoints - 100} ქულით! (მაქს: 100)`
                          : `Exceeds 100-point limit by +${totalAllocatedPoints - 100} pts!`}
                      </span>
                    ) : totalAllocatedPoints === 100 ? (
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        {language === 'ka' ? 'იდეალური ბალანსი: ზუსტად 100 ქულა' : 'Perfect Allocation: Exactly 100 Points'}
                      </span>
                    ) : (
                      <span className="text-xs text-indigo-300 font-medium">
                        {language === 'ka'
                          ? `დარჩენილია გასანაწილებელი: ${100 - totalAllocatedPoints} ქულა`
                          : `Remaining to allocate: ${100 - totalAllocatedPoints} pts`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-950/80 rounded-full h-2.5 overflow-hidden border border-slate-800">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isOver100Points
                        ? 'bg-rose-500'
                        : totalAllocatedPoints === 100
                        ? 'bg-emerald-500'
                        : 'bg-indigo-500'
                    }`}
                    style={{ width: `${Math.min(100, totalAllocatedPoints)}%` }}
                  />
                </div>
              </div>

              {validationError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Questions List */}
              <div className="border-t border-slate-800 pt-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <span className="font-bold text-slate-200 uppercase tracking-wider text-xs block">
                      {t.testQuestionsCount} ({questions.length})
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {language === 'ka'
                        ? 'თითოეულ კითხვას შეგიძლიათ ინდივიდუალურად მიანიჭოთ სასურველი ქულა (ჯამი ≤ 100)'
                        : 'Manually adjust the points assigned to each question individually (Total ≤ 100)'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('mcq')}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-semibold transition-colors"
                    >
                      {t.testAddMcqBtn}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('short_answer')}
                      className="px-2.5 py-1 rounded-lg bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 font-semibold transition-colors"
                    >
                      {t.testAddShortBtn}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddQuestion('essay_code')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-semibold transition-colors"
                    >
                      {t.testAddEssayBtn}
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  {questions.map((q, idx) => (
                    <div
                      key={q.id}
                      className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 transition-colors hover:border-slate-700"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-indigo-400 text-sm">#{idx + 1}</span>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {q.type === 'mcq'
                              ? (language === 'ka' ? 'ტესტური (MCQ)' : 'MCQ')
                              : q.type === 'short_answer'
                              ? (language === 'ka' ? 'ღია კითხვა' : 'Short Answer')
                              : (language === 'ka' ? 'ესე / ქეისი' : 'Essay / Case')}
                          </span>
                        </div>

                        {/* Manual Point Assignment Input */}
                        <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700">
                          <label className="text-[11px] font-bold text-indigo-300">
                            {language === 'ka' ? 'ქულა:' : 'Points:'}
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={q.points}
                            onChange={(e) => handleUpdateQuestionPoints(q.id, Number(e.target.value))}
                            className="w-16 bg-slate-950 border border-slate-600 rounded-lg px-2 py-1 text-xs text-white font-mono font-bold text-center focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                          <span className="text-[11px] text-slate-400">{language === 'ka' ? 'ქ.' : 'pts'}</span>
                          <button
                            type="button"
                            onClick={() => setQuestions((prev) => prev.filter((item) => item.id !== q.id))}
                            className="text-slate-500 hover:text-rose-400 ml-2 p-1 rounded"
                            title="Remove Question"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Editable Prompt */}
                      <div>
                        <input
                          type="text"
                          value={q.prompt}
                          onChange={(e) => handleUpdateQuestionPrompt(q.id, e.target.value)}
                          placeholder="Question prompt..."
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      {/* Options or Grading Criteria */}
                      {q.options && (
                        <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
                          <span className="text-[10px] uppercase font-bold text-slate-400">
                            {language === 'ka' ? 'სავარაუდო პასუხები (აირჩიეთ სწორი):' : 'Options (Select correct index):'}
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {q.options.map((opt, oIdx) => (
                              <button
                                key={oIdx}
                                type="button"
                                onClick={() => handleUpdateQuestionCorrectAnswer(q.id, oIdx)}
                                className={`text-left p-2 rounded-lg text-[11px] border transition-all flex items-center gap-2 ${
                                  Number(q.correctAnswer) === oIdx
                                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 font-semibold'
                                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                                }`}
                              >
                                <span className="w-4 h-4 rounded-full border flex items-center justify-center text-[9px]">
                                  {Number(q.correctAnswer) === oIdx ? '✓' : String.fromCharCode(65 + oIdx)}
                                </span>
                                <span className="truncate">{opt}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {q.gradingCriteria && (
                        <div className="text-[11px] text-slate-400 bg-slate-900/30 p-2 rounded-lg border border-slate-800/50">
                          <span className="font-semibold text-slate-300">{language === 'ka' ? 'შეფასების კრიტერიუმი: ' : 'Grading Rubric: '}</span>
                          {q.gradingCriteria}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/60">
              <div className="text-xs">
                {isOver100Points ? (
                  <span className="text-rose-400 font-bold">
                    ⚠️ {language === 'ka' ? 'შენახვა დაბლოკილია: ქულები აჭარბებს 100-ს' : 'Publish blocked: Total points exceed 100'}
                  </span>
                ) : (
                  <span className="text-slate-400">
                    {language === 'ka' ? 'ჯამი:' : 'Total:'} <strong className="text-white font-mono">{totalAllocatedPoints}</strong>/100 {language === 'ka' ? 'ქულა' : 'pts'}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  {t.btnCancel || 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleCreateTest}
                  disabled={isCreating || isOver100Points || totalAllocatedPoints === 0}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isCreating ? t.testPublishing : t.testSaveBtn}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grading Modal */}
      {gradingSubmission && (
        <AdminGradingModal
          submission={gradingSubmission}
          test={tests.find((t) => t.id === gradingSubmission.testId)}
          onClose={() => setGradingSubmission(null)}
          onUpdateSubmission={(updated) => {
            onUpdateSubmission(updated);
            setGradingSubmission(null);
          }}
          language={language}
        />
      )}
    </div>
  );
};
