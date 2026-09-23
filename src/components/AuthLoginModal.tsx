import React, { useState } from 'react';
import { apiFetch, setToken } from '../lib/api';
import { Mail, Lock, Shield, UserCheck, AlertCircle, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { UserAccount } from '../types';
import { Language } from '../i18n';

interface AuthLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserAccount, student: any | null, requiresPasswordChange: boolean) => void;
  language?: Language;
}

export const AuthLoginModal: React.FC<AuthLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  language = 'ka',
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Authentication failed');
        return;
      }

      setToken(data.token);
      onLoginSuccess(data.user, data.student || null, Boolean(data.requiresPasswordChange));
      onClose();
    } catch (err: any) {
      setError(err.message || 'Network error during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">
                {language === 'ka' ? 'ავტორიზაცია • CogniTest' : 'Authentication • CogniTest'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {language === 'ka' ? 'BTU უსაფრთხო საგამოცდო სისტემა' : 'BTU Secure Proctoring System'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-sm p-1 rounded-lg">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3.5 pt-2">
            <div>
              <label className="block text-slate-400 font-medium mb-1">
                {language === 'ka' ? 'ელფოსტა / Email' : 'Email Address'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@btu.edu.ge"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1 flex items-center justify-between">
                <span>{language === 'ka' ? 'პაროლი (დროებითი ან მუდმივი)' : 'Password (Temporary or Permanent)'}</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder={language === 'ka' ? 'შეიყვანეთ პაროლი' : 'Enter password'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <UserCheck className="w-4 h-4" />
              <span>{loading ? (language === 'ka' ? 'მოწმდება...' : 'Verifying...') : (language === 'ka' ? 'სისტემაში შესვლა' : 'Sign In')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Email Notification Audit Notice */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-indigo-400 font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{language === 'ka' ? 'Nodemailer იმეილ შეტყობინებები' : 'Nodemailer Email System'}</span>
            </div>
            <p className="leading-relaxed">
              {language === 'ka'
                ? 'ანგარიშის შექმნისას ავტო-გენერირებული დროებითი პაროლი გაიგზავნა ადმინისა და სტუდენტების ელფოსტაზე. პირველივე შესვლისას სისტემა სავალდებულოდ მოითხოვს მის შეცვლას.'
                : 'Auto-generated temporary passwords were sent via Nodemailer to the admin and student emails upon creation. Users are forced to change temporary passwords on their first login.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
