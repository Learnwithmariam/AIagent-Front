import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import {
  BookOpen,
  Plus,
  Search,
  FileText,
  Trash2,
  Sparkles,
  Tag,
  Save,
  Upload,
} from 'lucide-react';
import { KnowledgeDoc } from '../types';
import { Language, translations } from '../i18n';

interface AdminKnowledgeBaseProps {
  language?: Language;
}

export const AdminKnowledgeBase: React.FC<AdminKnowledgeBaseProps> = ({ language = 'ka' }) => {
  const t = translations[language];
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeDoc | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState(
    language === 'ka' ? 'სტარტაპები და ინოვაციური მეწარმეობა' : 'Startups & Innovative Entrepreneurship'
  );
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  /** Upload a PDF / DOCX / TXT: the server extracts the text, the lecturer reviews it before saving. */
  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await apiFetch('/api/knowledge/extract', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || (language === 'ka' ? 'ფაილის წაკითხვა ვერ მოხერხდა.' : 'Could not read the file.'));
        return;
      }
      setContent((prev) => (prev ? `${prev}\n\n${data.text}` : data.text));
      if (!title) setTitle(file.name.replace(/\.[^.]+$/, ''));
    } catch (err) {
      alert(language === 'ka' ? 'ატვირთვის შეცდომა.' : 'Upload error.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    try {
      const res = await apiFetch('/api/knowledge');
      if (res.ok) {
        const data = await res.json();
        setDocs(data);
      }
    } catch (err) {
      console.error('Failed fetching knowledge docs', err);
    }
  };

  const handleCreateDoc = async () => {
    if (!title.trim() || !content.trim()) {
      alert(language === 'ka' ? 'სათაური და შინაარსი სავალდებულოა.' : 'Title and Content are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const tags = tagsInput
        .split(',')
        .map((tg) => tg.trim())
        .filter(Boolean);

      const res = await apiFetch('/api/knowledge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          subject,
          summary: summary || title,
          content,
          tags: tags.length ? tags : ['curriculum', 'startups'],
        }),
      });

      if (res.ok) {
        fetchDocs();
        setShowAddModal(false);
        setTitle('');
        setSummary('');
        setContent('');
        setTagsInput('');
      }
    } catch (err) {
      alert(language === 'ka' ? 'დოკუმენტის შენახვა ვერ მოხერხდა' : 'Failed saving document');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredDocs = docs.filter((d) => {
    if (selectedSubject !== 'All' && selectedSubject !== 'ყველა' && d.subject !== selectedSubject) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        d.title.toLowerCase().includes(q) ||
        d.summary.toLowerCase().includes(q) ||
        d.tags.some((tg) => tg.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-400" />
            {t.kbTitle}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t.kbSubtitle}
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{t.kbAddDocBtn}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder={t.kbSearchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">{t.filter}:</span>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="All">{t.allSubjects}</option>
            {[...new Set(docs.map((d) => d.subject))].map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Knowledge Docs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDocs.map((doc) => (
          <div
            key={doc.id}
            onClick={() => setSelectedDoc(doc)}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:border-slate-700 cursor-pointer transition-all group"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                  {doc.subject}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(doc.updatedAt || doc.createdAt).toLocaleDateString()}
                </span>
              </div>

              <h3 className="font-bold text-base text-slate-100 group-hover:text-indigo-200 transition-colors mb-2">
                {doc.title}
              </h3>

              <p className="text-xs text-slate-400 line-clamp-3 mb-4 leading-relaxed">
                {doc.summary}
              </p>
            </div>

            <div>
              <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-800/80">
                {doc.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800/60 text-slate-400 font-mono"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View Document Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                  {selectedDoc.subject}
                </span>
                <h2 className="font-bold text-lg text-slate-100 mt-0.5">{selectedDoc.title}</h2>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-300">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <strong className="text-indigo-300 block mb-1 text-xs">{language === 'ka' ? 'რეზიუმე:' : 'Summary:'}</strong>
                <p className="text-slate-300 leading-relaxed">{selectedDoc.summary}</p>
              </div>

              <div>
                <strong className="text-slate-400 block mb-1 text-xs">{language === 'ka' ? 'სილაბუსის დოკუმენტის შინაარსი:' : 'Curriculum Document Content:'}</strong>
                <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {selectedDoc.content}
                </pre>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                {t.close}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Document Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h2 className="font-bold text-lg text-slate-100">{t.kbModalTitle}</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">{t.kbDocTitleLabel}</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={language === 'ka' ? 'მაგ. ლექცია 3: Business Model Canvas' : 'e.g. Lecture 3: Business Model Canvas'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">{t.kbSubjectLabel}</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option>{language === 'ka' ? 'სტარტაპები და ინოვაციური მეწარმეობა' : 'Startups & Innovative Entrepreneurship'}</option>
                    <option>{language === 'ka' ? 'სილაბუსი და კურსის გეგმა' : 'Syllabus & Course Plan'}</option>
                    <option>{language === 'ka' ? 'ლექციის მასალა' : 'Lecture Material'}</option>
                    <option>{language === 'ka' ? 'ქეისები და მაგალითები' : 'Cases & Examples'}</option>
                    <option>{language === 'ka' ? 'დავალებები და შეფასება' : 'Assignments & Grading'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">{t.kbTagsLabel}</label>
                  <input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="lean startup, mvp, pmf, unit economics"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">{t.kbSummaryLabel}</label>
                <input
                  type="text"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder={language === 'ka' ? 'თეორემების, მტკიცებულებების ან ალგორითმების მოკლე მიმოხილვა...' : 'Concise overview of theorems, proofs, or algorithm guarantees...'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-400 font-medium">{t.kbContentLabel}</label>
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx,.txt,.md"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFileUpload(f);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-semibold text-slate-200 disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>
                        {isUploading
                          ? language === 'ka'
                            ? 'იკითხება…'
                            : 'Reading…'
                          : language === 'ka'
                          ? 'ფაილის ატვირთვა (PDF / DOCX / TXT)'
                          : 'Upload file (PDF / DOCX / TXT)'}
                      </span>
                    </button>
                  </div>
                </div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={8}
                  placeholder={language === 'ka' ? 'ჩასვით სილაბუსი, ლექციის კონსპექტი, ქეისი... ან ატვირთეთ ფაილი ზემოთ.' : 'Paste the syllabus, lecture notes, a case study… or upload a file above.'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-mono placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 flex justify-end gap-2 bg-slate-950/60">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleCreateDoc}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSubmitting ? (language === 'ka' ? 'ინდექსირება...' : 'Indexing...') : t.kbSaveBtn}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

