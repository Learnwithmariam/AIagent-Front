import React, { useState } from 'react';
import { apiFetch } from '../lib/api';
import { User, Plus, Mail, CheckCircle2, XCircle, Search, Shield } from 'lucide-react';
import { Student } from '../types';
import { Language, translations } from '../i18n';

interface AdminStudentDirectoryProps {
  students: Student[];
  onRefreshStudents: () => void;
  language?: Language;
}

export const AdminStudentDirectory: React.FC<AdminStudentDirectoryProps> = ({
  students,
  onRefreshStudents,
  language = 'ka',
}) => {
  const t = translations[language];
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState(
    language === 'ka' ? 'კომპიუტერული მეცნიერება' : 'Computer Science'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddStudent = async () => {
    if (!name.trim() || !email.trim()) {
      alert(language === 'ka' ? 'სახელი და ელფოსტა სავალდებულოა.' : 'Name and Email are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiFetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          department,
          digestSubscribed: true,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        const meta = created?._meta;
        if (meta?.temporaryPassword) {
          // SMTP not configured (or failed): show the one-time password so the lecturer can hand it over
          window.prompt(
            language === 'ka'
              ? 'ელ-ფოსტა არ გაიგზავნა. დააკოპირეთ დროებითი პაროლი და გადაეცით სტუდენტს (მეორედ აღარ გამოჩნდება):'
              : 'Email was not sent. Copy this temporary password and give it to the student (shown only once):',
            meta.temporaryPassword
          );
        } else if (meta && !meta.created) {
          alert(language === 'ka' ? 'ეს სტუდენტი უკვე რეგისტრირებულია.' : 'This student already exists.');
        }
        onRefreshStudents();
        setShowAddModal(false);
        setName('');
        setEmail('');
      } else {
        alert(language === 'ka' ? 'სტუდენტის დამატება ვერ მოხერხდა' : 'Failed adding student');
      }
    } catch (err) {
      alert(language === 'ka' ? 'შეცდომა სტუდენტის რეგისტრაციისას' : 'Error creating student');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleSubscription = async (student: Student) => {
    try {
      await apiFetch(`/api/students/${encodeURIComponent(student.email)}/subscription`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ digestSubscribed: !student.digestSubscribed }),
      });
      onRefreshStudents();
    } catch (err) {
      console.error('Failed toggling subscription', err);
    }
  };

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <User className="w-6 h-6 text-indigo-400" />
            {t.studentsTitle}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t.studentsSubtitle}
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{t.studentsAddBtn}</span>
        </button>
      </div>

      {/* Directory Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={t.studentsSearchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="text-xs text-slate-400">
            {t.studentsTotal}: <strong className="text-slate-200">{students.length}</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">{t.studentsColProfile}</th>
                <th className="py-3 px-4">{t.studentsColEmail}</th>
                <th className="py-3 px-4">{t.studentsColDepartment}</th>
                <th className="py-3 px-4">{t.studentsColDigest}</th>
                <th className="py-3 px-4 text-right">{t.studentsColActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-indigo-600/25 text-indigo-200 ring-1 ring-slate-700 flex items-center justify-center text-[11px] font-bold uppercase">
                        {s.name.trim().charAt(0)}
                      </div>
                      <span className="font-bold text-slate-200">{s.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">{s.email}</td>
                  <td className="py-3 px-4">{s.department}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleToggleSubscription(s)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all ${
                        s.digestSubscribed
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}
                    >
                      {s.digestSubscribed ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{t.studentsSubscribed}</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-slate-500" />
                          <span>{t.studentsUnsubscribed}</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-[11px] text-slate-500">{t.studentsActiveStatus}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h2 className="font-bold text-lg text-slate-100 mb-4">{t.studentsModalTitle}</h2>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">{t.studentsNameLabel}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="მაგ. გიორგი ბერიძე"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">{t.studentsEmailLabel}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu.ge"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">{t.studentsDeptLabel}</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option>{language === 'ka' ? 'კომპიუტერული მეცნიერება' : 'Computer Science'}</option>
                  <option>{language === 'ka' ? 'ელექტრო & კომპიუტერული ინჟინერია' : 'Electrical & Computer Engineering'}</option>
                  <option>{language === 'ka' ? 'ხელოვნური ინტელექტი' : 'Artificial Intelligence'}</option>
                  <option>{language === 'ka' ? 'რობოტოტექნიკა & სისტემები' : 'Robotics & Systems'}</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleAddStudent}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30"
              >
                {isSubmitting ? (language === 'ka' ? 'რეგისტრაცია...' : 'Registering...') : t.studentsRegisterBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

