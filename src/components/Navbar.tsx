import React from 'react';
import {
  GraduationCap,
  ShieldCheck,
  Radio,
  User,
  Sparkles,
  Layers,
  Languages,
  KeyRound,
  LogOut,
  AlertTriangle,
} from 'lucide-react';
import { Role, Student, UserAccount } from '../types';
import { Language, translations } from '../i18n';

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

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  activeStudent,
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
    { id: 'digests', label: t.tabDigests, icon: Radio },
  ];

  const adminTabs = [
    { id: 'live-monitor', label: t.tabLiveMonitor, icon: Radio, alertBadge: true },
    { id: 'test-manager', label: t.tabTestManager, icon: GraduationCap },
    { id: 'knowledge-base', label: t.tabKnowledgeBase, icon: Layers },
    { id: 'students-dir', label: t.tabStudents, icon: User },
    { id: 'cron-digest', label: t.tabCronDigest, icon: Sparkles },
  ];

  const tabs = currentRole === 'student' ? studentTabs : adminTabs;

  return (
    <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/10">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white tracking-tight">{t.appTitle}</span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {t.appBadge}
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Center: Live Exam Notice or WebSocket Status */}
          <div className="flex items-center gap-3">
            {activeExamTitle ? (
              <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium animate-pulse">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                {t.activeProctoring}: {activeExamTitle}
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-800/60 border border-slate-700/50 text-slate-400 text-xs">
                <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                {wsConnected ? t.wsConnected : t.wsConnecting}
              </div>
            )}
          </div>

          {/* Right: Language Switcher, Role Switcher & Student Account Selector */}
          <div className="flex items-center gap-3">
            {/* Language Switcher Pill */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center text-xs font-medium">
              <button
                type="button"
                onClick={() => onLanguageChange('ka')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                  language === 'ka'
                    ? 'bg-rose-600/90 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="ქართული ენა (Georgian)"
              >
                <span>GEO</span>
                <span className="text-[10px] opacity-80">ქარ</span>
              </button>
              <button
                type="button"
                onClick={() => onLanguageChange('en')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                  language === 'en'
                    ? 'bg-slate-700 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="English Language"
              >
                <span>ENG</span>
              </button>
            </div>

            {/* User Account & Password Controls */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                {currentUser.isTemporaryPassword && (
                  <button
                    type="button"
                    onClick={onOpenPasswordModal}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold animate-pulse transition-all"
                    title="Action Required: Change temporary password"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">
                      {language === 'ka' ? 'დროებითი პაროლი' : 'Temp Password'}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onOpenPasswordModal}
                  className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                  title={language === 'ka' ? 'პაროლის შეცვლა' : 'Change Password'}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                </button>

                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 text-xs font-medium border border-slate-700 text-slate-200"
                  title={currentUser.email}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="max-w-[140px] truncate hidden md:inline">{currentUser.name}</span>
                  <span className="text-[10px] uppercase tracking-wide text-slate-400">
                    {currentRole === 'admin' ? (language === 'ka' ? 'ლექტორი' : 'Lecturer') : language === 'ka' ? 'სტუდენტი' : 'Student'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={onLogout}
                  className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-600/30 text-slate-300 hover:text-rose-200 border border-slate-700 transition-colors"
                  title={language === 'ka' ? 'გასვლა' : 'Log out'}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        {!activeExamTitle && (
          <div className="flex items-center space-x-1 overflow-x-auto py-2 border-t border-slate-800/60 scrollbar-none">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-slate-800 text-indigo-300 border border-indigo-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};
