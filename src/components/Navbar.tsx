import React from 'react';
import { motion } from 'motion/react';
import { GraduationCap, Radio, User, Sparkles, Layers, KeyRound, LogOut, AlertTriangle, Newspaper } from 'lucide-react';
import { Role, Student, UserAccount } from '../types';
import { Language, translations } from '../i18n';
import { BrandMark } from './ui/BrandMark';

interface NavbarProps {
  currentRole: Role;
  activeStudent: Student | null;
  onLogout: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  wsConnected: boolean;
  activeExamTitle?: string | null;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  currentUser?: UserAccount | null;
  onOpenPasswordModal?: () => void;
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onLogout,
  activeTab,
  onTabChange,
  wsConnected,
  activeExamTitle,
  language,
  onLanguageChange,
  currentUser,
  onOpenPasswordModal,
}) => {
  const t = translations[language];

  const studentTabs = [
    { id: 'agent', label: t.tabAiAgent, icon: Sparkles },
    { id: 'exams', label: t.tabExams, icon: GraduationCap },
    { id: 'results', label: t.tabSubmissions, icon: Layers },
    { id: 'digests', label: t.tabDigests, icon: Newspaper },
  ];

  const adminTabs = [
    { id: 'live-monitor', label: t.tabLiveMonitor, icon: Radio },
    { id: 'test-manager', label: t.tabTestManager, icon: GraduationCap },
    { id: 'knowledge-base', label: t.tabKnowledgeBase, icon: Layers },
    { id: 'students-dir', label: t.tabStudents, icon: User },
    { id: 'cron-digest', label: t.tabCronDigest, icon: Sparkles },
  ];

  const tabs = currentRole === 'student' ? studentTabs : adminTabs;
  const roleLabel = currentRole === 'admin' ? (language === 'ka' ? 'ლექტორი' : 'Lecturer') : language === 'ka' ? 'სტუდენტი' : 'Student';

  return (
    <header className="sticky top-0 z-40 px-3 sm:px-4 pt-3">
      <div className="glass-strong max-w-7xl mx-auto rounded-2xl px-3 sm:px-5">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand */}
          <div className="flex items-center gap-3 min-w-0">
            <BrandMark size={40} className="transition-transform duration-500 hover:rotate-[-8deg] hover:scale-105" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-[15px] sm:text-base tracking-tight text-white truncate">{t.appTitle}</span>
                <span className="hidden sm:inline-flex text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/25">
                  {t.appBadge}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden md:block truncate">{t.appSubtitle}</p>
            </div>
          </div>

          {/* Live status */}
          <div className="hidden lg:flex items-center">
            {activeExamTitle ? (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
                <span className="relative flex w-2 h-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                </span>
                {t.activeProctoring}: {activeExamTitle}
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.06] text-slate-400 text-xs">
                <span className="relative flex w-2 h-2">
                  {wsConnected && <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${wsConnected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                </span>
                {wsConnected ? t.wsConnected : t.wsConnecting}
              </div>
            )}
          </div>

          {/* Right cluster */}
          <div className="flex items-center gap-2">
            <div className="relative flex items-center p-1 rounded-xl bg-black/30 border border-white/[0.06] text-[11px] font-semibold">
              {(['ka', 'en'] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => onLanguageChange(lang)}
                  className={`relative z-10 px-2.5 py-1 rounded-lg ${language === lang ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
                  title={lang === 'ka' ? 'ქართული' : 'English'}
                >
                  {language === lang && (
                    <motion.span
                      layoutId="lang-pill"
                      className="absolute inset-0 -z-10 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 shadow-[0_6px_16px_-6px_rgba(226,0,116,0.8)]"
                      transition={{ type: 'spring', stiffness: 500, damping: 34 }}
                    />
                  )}
                  {lang === 'ka' ? 'ქარ' : 'ENG'}
                </button>
              ))}
            </div>

            {currentUser && (
              <>
                {currentUser.isTemporaryPassword && (
                  <button
                    type="button"
                    onClick={onOpenPasswordModal}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-bold"
                    title={language === 'ka' ? 'შეცვალეთ დროებითი პაროლი' : 'Change your temporary password'}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{language === 'ka' ? 'დროებითი პაროლი' : 'Temp password'}</span>
                  </button>
                )}

                <div
                  className="hidden sm:flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                  title={currentUser.email}
                >
                  <span className="w-7 h-7 rounded-lg grid place-items-center text-[11px] font-bold text-white bg-gradient-to-br from-violet-500 to-brand-600">
                    {initials(currentUser.name) || <User className="w-3.5 h-3.5" />}
                  </span>
                  <div className="leading-tight">
                    <div className="text-xs font-semibold text-slate-100 max-w-[140px] truncate">{currentUser.name}</div>
                    <div className="text-[10px] uppercase tracking-wider text-brand-300/80">{roleLabel}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onOpenPasswordModal}
                  className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.06]"
                  title={language === 'ka' ? 'პაროლის შეცვლა' : 'Change password'}
                  aria-label={language === 'ka' ? 'პაროლის შეცვლა' : 'Change password'}
                >
                  <KeyRound className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  className="p-2 rounded-xl bg-white/[0.03] hover:bg-rose-500/20 text-slate-300 hover:text-rose-200 border border-white/[0.06] hover:border-rose-500/30"
                  title={language === 'ka' ? 'გასვლა' : 'Log out'}
                  aria-label={language === 'ka' ? 'გასვლა' : 'Log out'}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tabs with a sliding active indicator */}
        {!activeExamTitle && (
          <nav className="flex items-center gap-1 overflow-x-auto pb-2.5 -mx-1 px-1 [scrollbar-width:none]">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap ${
                    isActive ? 'text-white' : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04]'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-xl bg-gradient-to-br from-brand-500/25 to-violet-600/15 border border-brand-500/35 shadow-[0_8px_24px_-12px_rgba(226,0,116,0.9)]"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                  <Icon className={`relative w-4 h-4 ${isActive ? 'text-brand-300' : ''}`} />
                  <span className="relative">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
};
