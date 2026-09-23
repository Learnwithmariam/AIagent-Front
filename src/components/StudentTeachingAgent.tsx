import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { apiFetch } from '../lib/api';
import { Sparkles, Send, RotateCcw, Bot, Lightbulb, ShieldCheck, Cpu, ChevronDown, Check, BookOpen } from 'lucide-react';
import { ChatMessage, Student } from '../types';
import { Language, translations } from '../i18n';
import { TiltCard } from './ui/TiltCard';
import { Markdown } from './ui/Markdown';

interface StudentTeachingAgentProps {
  activeStudent: Student | null;
  language?: Language;
}

interface ModelOption {
  id: string;
  label: string;
  free: boolean;
}

type UiMessage = ChatMessage & { model?: string };

const MODEL_KEY = 'gkbtu_chat_model';
const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const StudentTeachingAgent: React.FC<StudentTeachingAgentProps> = ({ activeStudent, language = 'ka' }) => {
  const t = translations[language];
  const ka = language === 'ka';
  const firstName = activeStudent ? activeStudent.name.split(' ')[0] : ka ? 'სტუდენტო' : 'there';

  const welcome = (): UiMessage => ({
    id: 'm-welcome',
    role: 'assistant',
    content: ka
      ? `გამარჯობა, ${firstName}! მე ვარ კურსის AI მენტორი სტარტაპებისა და ინოვაციური მეწარმეობის მიმართულებით. რით დაგეხმარო — იდეის ვალიდაციით, MVP-ით თუ ინვესტიციების მოზიდვით?`
      : `Hi ${firstName}! I'm the course's AI mentor for startups and innovative entrepreneurship. Want help validating an idea, scoping an MVP or preparing for investors?`,
    timestamp: now(),
  });

  const [messages, setMessages] = useState<UiMessage[]>([welcome()]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [models, setModels] = useState<ModelOption[]>([]);
  const [aiConfigured, setAiConfigured] = useState(true);
  const [model, setModel] = useState<string>(() => {
    try {
      return localStorage.getItem(MODEL_KEY) || '';
    } catch {
      return '';
    }
  });
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Keep the welcome message in the current language until the conversation starts
  useEffect(() => {
    setMessages((prev) => (prev.length === 1 && prev[0].id === 'm-welcome' ? [welcome()] : prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  useEffect(() => {
    apiFetch('/api/ai/models')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        setModels(data.models || []);
        setAiConfigured(data.configured !== false);
        setModel((current) => (data.models?.some((m: ModelOption) => m.id === current) ? current : data.default));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const pickModel = (id: string) => {
    setModel(id);
    setModelMenuOpen(false);
    try {
      localStorage.setItem(MODEL_KEY, id);
    } catch {
      /* storage unavailable */
    }
  };

  const modelLabel = (id?: string) => models.find((m) => m.id === id)?.label || id?.split('/').pop()?.replace(/:free$/, '') || '';

  const suggestedPrompts = ka
    ? [
        { title: 'Product-Market Fit', prompt: 'როგორ განვსაზღვროთ და გავზომოთ Product-Market Fit Sean Ellis-ის 40%-იანი ტესტით?' },
        { title: 'SAFE vs Convertible Note', prompt: 'რა განსხვავებაა Y Combinator Post-Money SAFE-სა და Convertible Note-ს შორის?' },
        { title: 'Unit Economics', prompt: 'როგორ გამოვთვალოთ CAC და LTV და რა არის ოპტიმალური LTV:CAC თანაფარდობა?' },
        { title: 'Lean Startup', prompt: 'ამიხსენი Build-Measure-Learn ციკლი და როდის უნდა გააკეთოს სტარტაპმა Pivot?' },
      ]
    : [
        { title: 'Product-Market Fit', prompt: 'How do we measure Product-Market Fit using the Sean Ellis 40% test?' },
        { title: 'SAFE vs Convertible Note', prompt: 'What are the core differences between a YC Post-Money SAFE and a Convertible Note?' },
        { title: 'Unit Economics', prompt: 'How do I calculate CAC and LTV, and what LTV:CAC ratio should a venture target?' },
        { title: 'Lean Startup', prompt: 'Explain the Build-Measure-Learn loop and when a startup should pivot vs persevere.' },
      ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const userMsg: UiMessage = { id: `usr-${Date.now()}`, role: 'user', content: text, timestamp: now() };
    const history = messages
      .filter((m) => m.id !== 'm-welcome' && !m.id.startsWith('err-'))
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await apiFetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, language, model: model || undefined, history }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'request failed');
      setMessages((prev) => [
        ...prev,
        { id: `ai-${Date.now()}`, role: 'assistant', content: data.reply, timestamp: now(), model: data.model, citations: data.citations },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: ka
            ? 'ბოდიში, AI ახლა ვერ პასუხობს (უფასო მოდელები ზოგჯერ გადატვირთულია). სცადე ხელახლა ან აირჩიე სხვა მოდელი.'
            : 'Sorry, the AI couldn’t answer right now (free models are sometimes busy). Try again or pick another model.',
          timestamp: now(),
        },
      ]);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const onlyWelcome = messages.length === 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        {/* Sidebar */}
        <aside className="space-y-4 order-2 lg:order-1">
          <TiltCard intensity={4} className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 text-sm font-bold text-white mb-2">
              <ShieldCheck className="w-4 h-4 text-brand-400" />
              {ka ? 'სილაბუსზე დაფუძნებული' : 'Grounded in the syllabus'}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {ka
                ? 'AI პასუხობს კურსის მასალებზე დაყრდნობით (RAG). თავად მასალები დაცულია და სტუდენტებს პირდაპირ არ უჩანთ.'
                : 'Answers draw on the course materials (RAG). The materials themselves stay private to the lecturer.'}
            </p>
            <div className="mt-4 flex items-center gap-2 text-[11px] font-medium">
              <span className={`w-2 h-2 rounded-full ${aiConfigured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className={aiConfigured ? 'text-emerald-300' : 'text-amber-300'}>
                {aiConfigured ? `OpenRouter • ${models.length || '—'} ${ka ? 'უფასო მოდელი' : 'free models'}` : ka ? 'AI არ არის კონფიგურირებული' : 'AI not configured'}
              </span>
            </div>
          </TiltCard>

          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-amber-300" />
              <h3 className="font-bold text-xs text-slate-200 uppercase tracking-wider">{t.agentPromptSuggestions}</h3>
            </div>
            <div className="space-y-2">
              {suggestedPrompts.map((p) => (
                <button
                  key={p.title}
                  onClick={() => handleSendMessage(p.prompt)}
                  disabled={loading}
                  className="group w-full text-left p-3 rounded-xl bg-white/[0.02] hover:bg-brand-500/[0.08] border border-white/[0.05] hover:border-brand-500/30 hover:-translate-y-0.5"
                >
                  <div className="text-xs font-semibold text-brand-200 group-hover:text-brand-100">{p.title}</div>
                  <div className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{p.prompt}</div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Chat window */}
        <section className="order-1 lg:order-2 glass rounded-3xl flex flex-col h-[calc(100dvh-11rem)] min-h-[560px] overflow-hidden">
          {/* Header */}
          <div className="px-4 sm:px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-10 h-10 rounded-xl grid place-items-center bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-[0_8px_20px_-8px_rgba(226,0,116,0.8)]">
                <Bot className="w-5 h-5" />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-white truncate">{ka ? 'AI მენტორი' : 'AI Mentor'}</h3>
                <p className="text-[11px] text-slate-400 truncate">{ka ? 'სტარტაპები • MVP • ინვესტიციები' : 'Startups • MVP • Fundraising'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Model picker */}
              {models.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setModelMenuOpen((o) => !o)}
                    className="flex items-center gap-2 pl-2.5 pr-2 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-slate-200 max-w-[190px]"
                    aria-haspopup="listbox"
                    aria-expanded={modelMenuOpen}
                  >
                    <Cpu className="w-3.5 h-3.5 text-brand-300 shrink-0" />
                    <span className="truncate">{modelLabel(model)}</span>
                    <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${modelMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {modelMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-20" onClick={() => setModelMenuOpen(false)} />
                        <motion.ul
                          role="listbox"
                          initial={{ opacity: 0, y: -6, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.97 }}
                          transition={{ duration: 0.16 }}
                          className="absolute right-0 mt-2 w-72 z-30 glass-strong rounded-2xl p-1.5 origin-top-right"
                        >
                          <li className="px-3 pt-2 pb-1.5 text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                            {ka ? 'უფასო მოდელები · OpenRouter' : 'Free models · OpenRouter'}
                          </li>
                          {models.map((m) => (
                            <li key={m.id}>
                              <button
                                role="option"
                                aria-selected={m.id === model}
                                onClick={() => pickModel(m.id)}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left text-xs ${
                                  m.id === model ? 'bg-brand-500/15 text-white' : 'text-slate-300 hover:bg-white/[0.05]'
                                }`}
                              >
                                <span className="flex-1 min-w-0">
                                  <span className="block font-semibold truncate">{m.label}</span>
                                  <span className="block text-[10px] text-slate-500 truncate font-mono">{m.id}</span>
                                </span>
                                {m.free && <span className="text-[9px] font-bold uppercase text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 px-1.5 py-0.5 rounded">free</span>}
                                {m.id === model && <Check className="w-3.5 h-3.5 text-brand-300" />}
                              </button>
                            </li>
                          ))}
                          <li className="px-3 py-2 text-[10px] text-slate-500 leading-relaxed">
                            {ka ? 'თუ არჩეული მოდელი დაკავებულია, პასუხს შემდეგი გასცემს.' : 'If the chosen model is busy, the next one answers.'}
                          </li>
                        </motion.ul>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              )}
              <button
                onClick={() => setMessages([welcome()])}
                title={t.agentClearChat}
                aria-label={t.agentClearChat}
                className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-400 hover:text-white"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-5">
            <AnimatePresence initial={false}>
              {messages.map((msg) => {
                const isAi = msg.role === 'assistant';
                return (
                  <motion.div
                    key={msg.id}
                    layout="position"
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
                    className={`flex items-end gap-2.5 ${isAi ? 'justify-start' : 'justify-end'}`}
                  >
                    {isAi && (
                      <div className="w-8 h-8 rounded-xl grid place-items-center shrink-0 bg-gradient-to-br from-brand-500/30 to-violet-600/20 border border-brand-500/30 text-brand-200">
                        <Sparkles className="w-4 h-4" />
                      </div>
                    )}
                    <div className={`max-w-[85%] sm:max-w-[75%] ${isAi ? '' : 'items-end'} flex flex-col`}>
                      <div
                        className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          isAi
                            ? msg.id.startsWith('err-')
                              ? 'bg-rose-500/10 border border-rose-500/25 text-rose-100 rounded-bl-md'
                              : 'bg-white/[0.04] border border-white/[0.07] text-slate-100 rounded-bl-md'
                            : 'bg-gradient-to-br from-brand-500 to-brand-700 text-white rounded-br-md shadow-[0_10px_24px_-12px_rgba(226,0,116,0.9)]'
                        }`}
                      >
                        {isAi ? <Markdown text={msg.content} /> : <div className="whitespace-pre-wrap">{msg.content}</div>}
                        {isAi && msg.citations && msg.citations.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex flex-wrap gap-1.5">
                            {msg.citations.map((c) => (
                              <span
                                key={c.docId}
                                title={c.snippet}
                                className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-brand-500/10 border border-brand-500/20 text-brand-200 max-w-[220px]"
                              >
                                <BookOpen className="w-3 h-3 shrink-0" />
                                <span className="truncate">{c.title}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className={`mt-1 px-1 text-[10px] text-slate-500 flex items-center gap-1.5 ${isAi ? '' : 'justify-end'}`}>
                        <span>{msg.timestamp}</span>
                        {msg.model && (
                          <>
                            <span>·</span>
                            <span className="font-mono">{modelLabel(msg.model)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {loading && (
              <div className="flex items-end gap-2.5">
                <div className="w-8 h-8 rounded-xl grid place-items-center shrink-0 bg-gradient-to-br from-brand-500/30 to-violet-600/20 border border-brand-500/30 text-brand-200">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                </div>
                <div className="rounded-2xl rounded-bl-md px-4 py-3 bg-white/[0.04] border border-white/[0.07] flex items-center gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className="typing-dot w-1.5 h-1.5 rounded-full bg-brand-300" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                  <span className="text-xs text-slate-400 ml-1.5">{t.agentThinking}</span>
                </div>
              </div>
            )}

            {onlyWelcome && (
              <div className="grid sm:grid-cols-2 gap-2.5 pt-2 lg:hidden">
                {suggestedPrompts.slice(0, 2).map((p) => (
                  <button
                    key={p.title}
                    onClick={() => handleSendMessage(p.prompt)}
                    className="text-left p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-brand-500/30 text-xs text-slate-300"
                  >
                    <span className="font-semibold text-brand-200">{p.title}</span>
                    <span className="block text-slate-400 line-clamp-2 mt-0.5">{p.prompt}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="p-3 sm:p-4 border-t border-white/[0.06]">
            <div className="relative flex items-end gap-2 rounded-2xl bg-black/25 border border-white/[0.08] focus-within:border-brand-500/50 focus-within:shadow-[0_0_0_4px_rgba(226,0,116,0.12)] transition-all p-2">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t.agentAskPlaceholder}
                rows={1}
                className="flex-1 bg-transparent border-0 px-2 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:shadow-none resize-none max-h-40 [field-sizing:content]"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || loading}
                className="shrink-0 h-10 px-4 rounded-xl bg-indigo-600 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-40 disabled:shadow-none"
              >
                <span className="hidden sm:inline">{t.agentSend}</span>
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="mt-2 px-1 text-[10px] text-slate-500">
              {ka ? 'Enter — გაგზავნა · Shift+Enter — ახალი ხაზი · AI-მ შეიძლება შეცდეს.' : 'Enter to send · Shift+Enter for a new line · AI can make mistakes.'}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};
