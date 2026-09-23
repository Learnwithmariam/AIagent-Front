import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../lib/api';
import {
  Sparkles,
  Send,
  HelpCircle,
  RotateCcw,
  Bot,
  User,
  Lightbulb,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { ChatMessage, Student } from '../types';
import { Language, translations } from '../i18n';

interface StudentTeachingAgentProps {
  activeStudent: Student | null;
  language?: Language;
}

export const StudentTeachingAgent: React.FC<StudentTeachingAgentProps> = ({
  activeStudent,
  language = 'ka',
}) => {
  const t = translations[language];
  const [subject, setSubject] = useState(
    language === 'ka' ? 'სტარტაპები და ინოვაციური მეწარმეობა' : 'Startups & Innovative Entrepreneurship'
  );

  const studentFirstName = activeStudent ? activeStudent.name.split(' ')[0] : (language === 'ka' ? 'სტუდენტო' : 'there');

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-welcome',
      role: 'assistant',
      content: language === 'ka'
        ? `გამარჯობა, ${studentFirstName}! მე ვარ BTU-ს AI პედაგოგიური ასისტენტი სტარტაპებისა და ინოვაციური მეწარმეობის მიმართულებით. როგორ შემიძლია დაგეხმაროთ იდეის ვალიდაციაში, MVP-ს შექმნაში ან ვენჩურული ინვესტიციების მოზიდვაში?`
        : `Hello, ${studentFirstName}! I am the BTU AI Teaching Assistant specialized exclusively in Startups, Innovative Entrepreneurship, and Venture Building. How can I help you validate your MVP, build financial models, or prepare for investors?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // When language changes, update welcome message if it was the initial message
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'm-welcome') {
        return [
          {
            id: 'm-welcome',
            role: 'assistant',
            content: language === 'ka'
              ? `გამარჯობა, ${studentFirstName}! მე ვარ BTU-ს AI პედაგოგიური ასისტენტი სტარტაპებისა და ინოვაციური მეწარმეობის მიმართულებით. როგორ შემიძლია დაგეხმაროთ იდეის ვალიდაციაში, MVP-ს შექმნაში ან ვენჩურული ინვესტიციების მოზიდვაში?`
              : `Hello, ${studentFirstName}! I am the BTU AI Teaching Assistant specialized exclusively in Startups, Innovative Entrepreneurship, and Venture Building. How can I help you validate your MVP, build financial models, or prepare for investors?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ];
      }
      return prev;
    });
  }, [language]);

  const subjects = language === 'ka'
    ? [
        'სტარტაპები და ინოვაციური მეწარმეობა',
        'ვენჩურული კაპიტალი & ინვესტიციები',
        'MVP ვალიდაცია & Product-Market Fit',
        'ინოვაციური ბიზნეს მოდელები & Unit Economics',
      ]
    : [
        'Startups & Innovative Entrepreneurship',
        'Venture Capital & Early-stage Funding',
        'MVP Validation & Product-Market Fit',
        'Innovative Business Models & Unit Economics',
      ];

  const suggestedPrompts = language === 'ka'
    ? [
        {
          title: 'Product-Market Fit (PMF)',
          prompt: 'როგორ განვსაზღვროთ და გავზომოთ Product-Market Fit Sean Ellis-ის 40%-იანი ტესტით?',
        },
        {
          title: 'SAFE vs Convertible Note',
          prompt: 'რა არსებითი განსხვავებაა Y Combinator Post-Money SAFE-სა და ტრადიციულ Convertible Note-ს შორის?',
        },
        {
          title: 'Unit Economics (CAC & LTV)',
          prompt: 'როგორ გამოვთვალოთ CAC (Customer Acquisition Cost) და LTV (Lifetime Value) და რა არის ოპტიმალური LTV:CAC თანაფარდობა?',
        },
        {
          title: 'Lean Startup ციკლი',
          prompt: 'ამიხსენით Build-Measure-Learn ციკლი და როდის უნდა გააკეთოს სტარტაპმა Pivot?',
        },
      ]
    : [
        {
          title: 'Product-Market Fit (PMF)',
          prompt: 'How do we measure Product-Market Fit using Sean Ellis 40% rule?',
        },
        {
          title: 'SAFE vs Convertible Note',
          prompt: 'What are the core differences between Y Combinator Post-Money SAFE and a Convertible Note?',
        },
        {
          title: 'Unit Economics (CAC & LTV)',
          prompt: 'How to calculate CAC and LTV, and what is the target LTV:CAC ratio for venture scalability?',
        },
        {
          title: 'Lean Startup Loop',
          prompt: 'Explain the Build-Measure-Learn loop and when a startup should pivot vs persevere.',
        },
      ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await apiFetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          subject,
          language,
          history: messages
            .filter((m) => m.id !== 'm-welcome' && !m.id.startsWith('err-'))
            .slice(-10)
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        throw new Error('API request failed');
      }

      const data = await res.json();
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: language === 'ka'
          ? 'ბოდიში, კავშირის შეფერხებაა. AI აგენტი მომართულია ექსკლუზიურად სტარტაპებისა და ინოვაციური მეწარმეობის საკითხებზე. გთხოვთ სცადოთ ხელახლა.'
          : 'Sorry, communication error. The AI teaching agent is strictly restricted to Startups and Innovative Entrepreneurship topics. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'm-welcome',
        role: 'assistant',
        content: language === 'ka'
          ? `დიალოგის ისტორია გასუფთავდა. რით შემიძლია დაგეხმაროთ სტარტაპებსა და ინოვაციურ მეწარმეობაში?`
          : `Chat history cleared. How can I assist you with your startup and entrepreneurial journey?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Info: Domain Specialization & RAG Context Guarantee */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h2 className="font-semibold text-sm text-slate-200">{t.agentSubjectFilter}</h2>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              {language === 'ka'
                ? 'AI აგენტი ექსკლუზიურად სპეციალიზებულია სტარტაპებსა და ინოვაციურ მეწარმეობაზე:'
                : 'AI Teaching Agent is strictly restricted to Startups & Innovative Entrepreneurship:'}
            </p>
            <div className="space-y-1.5">
              {subjects.map((sub) => (
                <button
                  key={sub}
                  onClick={() => setSubject(sub)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    subject === sub
                      ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                      : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>

          {/* Confidential RAG Context Engine Notice */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{language === 'ka' ? 'კონფიდენციალური RAG ბაზა' : 'Confidential RAG Context'}</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {language === 'ka'
                ? 'სასწავლო მასალები და დოკუმენტები გამოიყენება ექსკლუზიურად AI ჩატბოტის კონტექსტის გასამდიდრებლად (RAG). მასალები დაცულია და არ ექვემდებარება სტუდენტების მიერ პირდაპირ ჩამოტვირთვას ან დათვალიერებას.'
                : 'Knowledge base materials are strictly utilized for background retrieval-augmented generation (RAG). Uploaded curriculum files remain confidential and are not directly exposed to students.'}
            </p>
            <div className="flex items-center gap-1.5 pt-1 text-[10px] text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>RAG Engine Active • Gemini 3.8 Flash</span>
            </div>
          </div>

          {/* Startup Entrepreneurship Prompt Suggestions */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-amber-400" />
              <h3 className="font-semibold text-xs text-slate-200 uppercase tracking-wider">
                {t.agentPromptSuggestions}
              </h3>
            </div>
            <div className="space-y-2">
              {suggestedPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(p.prompt)}
                  className="w-full text-left p-2 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 text-xs text-slate-300 transition-colors group"
                >
                  <div className="font-medium text-indigo-300 group-hover:text-indigo-200">{p.title}</div>
                  <div className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{p.prompt}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center/Right: Interactive Chat Window */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col h-[700px] overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-slate-100">
                    {language === 'ka' ? 'BTU AI სასწავლო აგენტი' : 'BTU AI Teaching Agent'}
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    {language === 'ka' ? 'ონლაინ' : 'Online'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {language === 'ka'
                    ? 'სტარტაპები, ინოვაციური მეწარმეობა, MVP ვალიდაცია & VC დაფინანსება'
                    : 'Startups, Innovative Entrepreneurship, MVP Validation & VC Funding'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleClearChat}
                title={t.agentClearChat}
                className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.map((msg) => {
              const isAi = msg.role === 'assistant';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${isAi ? 'justify-start' : 'justify-end'}`}
                >
                  {isAi && (
                    <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0 text-indigo-300">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-xl rounded-2xl p-4 text-sm leading-relaxed ${
                      isAi
                        ? 'bg-slate-800/80 border border-slate-700/60 text-slate-200 rounded-tl-sm shadow-md'
                        : 'bg-indigo-600 text-white rounded-tr-sm shadow-md shadow-indigo-600/20'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    <div
                      className={`text-[10px] mt-2 ${
                        isAi ? 'text-slate-400' : 'text-indigo-200'
                      } text-right`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>

                  {!isAi && (
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0 text-indigo-300">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0 text-indigo-300 animate-pulse">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl rounded-tl-sm p-4 text-sm text-slate-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"></span>
                  <span
                    className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
                    style={{ animationDelay: '0.15s' }}
                  ></span>
                  <span
                    className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
                    style={{ animationDelay: '0.3s' }}
                  ></span>
                  <span className="text-xs text-slate-400 ml-1">
                    {t.agentThinking}
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/60">
            <div className="relative flex items-center">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t.agentAskPlaceholder}
                rows={2}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 pr-24 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || loading}
                className="absolute right-3 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all"
              >
                <span>{t.agentSend}</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-1">
              <span>{language === 'ka' ? 'Enter გაგზავნა, Shift+Enter ახალი ხაზი' : 'Press Enter to send, Shift+Enter for new line'}</span>
              <span>Gemini 3.8 Flash RAG • Startups & Entrepreneurship</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
