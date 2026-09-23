import React, { useState } from 'react';
import { apiFetch, setToken } from '../lib/api';
import { Mail, Lock, AlertCircle, ArrowRight, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { UserAccount } from '../types';
import { Language } from '../i18n';
import { APP_NAME, BrandMark } from './ui/BrandMark';

interface AuthLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserAccount, student: any | null, requiresPasswordChange: boolean) => void;
  language?: Language;
  /** Render as a panel inside the page (landing) instead of a modal overlay */
  inline?: boolean;
}

export const AuthLoginModal: React.FC<AuthLoginModalProps> = ({ isOpen, onClose, onLoginSuccess, language = 'ka', inline = false }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  if (!isOpen) return null;
  const ka = language === 'ka';

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
        setError(data.error || (ka ? 'ავტორიზაცია ვერ მოხერხდა' : 'Authentication failed'));
        return;
      }
      setToken(data.token);
      onLoginSuccess(data.user, data.student || null, Boolean(data.requiresPasswordChange));
      onClose();
    } catch (err: any) {
      setError(ka ? 'სერვერთან კავშირი ვერ დამყარდა.' : 'Could not reach the server.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    'w-full bg-black/30 border border-white/[0.08] rounded-xl pl-10 pr-3 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none';

  const panel = (
    <div className={`${inline ? 'glass-strong ring-gradient' : 'bg-slate-900 border'} rounded-3xl w-full max-w-md overflow-hidden`}>
      <div className="p-7 sm:p-8">
        <div className="flex items-center justify-between mb-7">
          <div className="flex items-center gap-3">
            <BrandMark size={44} />
            <div>
              <h2 className="font-extrabold text-lg text-white tracking-tight">{ka ? 'შესვლა' : 'Sign in'}</h2>
              <p className="text-xs text-slate-400">{APP_NAME}</p>
            </div>
          </div>
          {!inline && (
            <button onClick={onClose} className="text-slate-400 hover:text-white w-8 h-8 rounded-lg hover:bg-white/5" aria-label="Close">
              ✕
            </button>
          )}
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2 animate-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <label className="block">
            <span className="block text-xs font-semibold text-slate-300 mb-1.5">{ka ? 'ელ-ფოსტა' : 'Email'}</span>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@btu.edu.ge"
                className={inputCls}
              />
            </div>
          </label>

          <label className="block">
            <span className="block text-xs font-semibold text-slate-300 mb-1.5">{ka ? 'პაროლი' : 'Password'}</span>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder={ka ? 'დროებითი ან მუდმივი პაროლი' : 'Temporary or permanent password'}
                className={`${inputCls} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="group w-full mt-2 py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            <span>{loading ? (ka ? 'მოწმდება…' : 'Verifying…') : ka ? 'შესვლა' : 'Sign in'}</span>
            {!loading && <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
          </button>
        </form>

        <div className="mt-6 flex items-start gap-2.5 text-[11px] text-slate-400 leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
          <p>
            {ka
              ? 'ანგარიშს ლექტორი ქმნის. დროებითი პაროლი მოგივათ ელ-ფოსტით — პირველი შესვლისას სისტემა მოგთხოვთ მის შეცვლას.'
              : 'Accounts are created by your lecturer. Your temporary password arrives by email, and you’ll be asked to change it on first sign-in.'}
          </p>
        </div>
      </div>
    </div>
  );

  if (inline) return panel;

  return <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4">{panel}</div>;
};
