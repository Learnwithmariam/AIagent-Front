import React, { useState } from 'react';
import { apiFetch, setToken } from '../lib/api';
import { ShieldCheck, Lock, AlertTriangle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { UserAccount } from '../types';
import { Language } from '../i18n';

interface PasswordChangeModalProps {
  user?: UserAccount;
  currentUser?: UserAccount;
  isMandatoryFirstLogin?: boolean;
  forced?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onPasswordChanged?: (updatedUser: UserAccount) => void;
  onSuccess?: (updatedUser: UserAccount) => void;
  language?: Language;
}

export const PasswordChangeModal: React.FC<PasswordChangeModalProps> = ({
  user,
  currentUser,
  isMandatoryFirstLogin,
  forced,
  isOpen,
  onClose,
  onPasswordChanged,
  onSuccess,
  language = 'ka',
}) => {
  const activeUser = currentUser || user;
  const isMandatory = Boolean(forced ?? isMandatoryFirstLogin);
  const notifySuccess = onSuccess || onPasswordChanged;

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !activeUser) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!newPassword || newPassword.length < 8) {
      setError(
        language === 'ka'
          ? 'ახალი პაროლი უნდა შეიცავდეს მინიმუმ 8 სიმბოლოს'
          : 'New password must be at least 8 characters long'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(
        language === 'ka'
          ? 'პაროლები ერთმანეთს არ ემთხვევა'
          : 'Passwords do not match'
      );
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: currentPassword.trim() || undefined,
          newPassword: newPassword.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to update password');
        return;
      }

      if (data.token) setToken(data.token);
      setSuccessMsg(
        language === 'ka'
          ? 'პაროლი წარმატებით განახლდა! ანგარიში აქტივირებულია.'
          : 'Password changed successfully! Your account is permanently active.'
      );

      setTimeout(() => {
        if (notifySuccess) {
          notifySuccess(data.user);
        }
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Network error updating password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className={`p-6 border-b border-slate-800 ${isMandatory ? 'bg-amber-950/40' : 'bg-slate-800/40'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isMandatory ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
            }`}>
              {isMandatory ? <AlertTriangle className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="font-bold text-base text-white">
                {isMandatory
                  ? (language === 'ka' ? 'სავალდებულო: დროებითი პაროლის შეცვლა' : 'Action Required: Change Temporary Password')
                  : (language === 'ka' ? 'პაროლის შეცვლა' : 'Change Password')}
              </h2>
              <p className="text-xs text-slate-400">
                {activeUser.email} ({activeUser.role === 'admin' ? 'Master Admin' : 'Student'})
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {isMandatory && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{language === 'ka' ? 'პირველი ავტორიზაციის უსაფრთხოების წესი' : 'First Login Security Requirement'}</span>
              </div>
              <p className="text-[11px] text-amber-300/80 leading-relaxed">
                {language === 'ka'
                  ? 'თქვენი ანგარიში შეიქმნა ავტო-გენერირებული დროებითი პაროლით (გამოგზავნილია ელფოსტაზე). სისტემაში მუშაობის გასაგრძელებლად სავალდებულოა მუდმივი უსაფრთხო პაროლის დაყენება.'
                  : 'Your account was initialized with an auto-generated temporary password sent via email. You must set a permanent secure password before accessing the system.'}
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                {language === 'ka' ? 'მიმდინარე დროებითი პაროლი' : 'Current Temporary Password'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={language === 'ka' ? 'შეიყვანეთ დროებითი პაროლი' : 'Enter temporary password'}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                {language === 'ka' ? 'ახალი მუდმივი პაროლი (მინ. 8 სიმბოლო)' : 'New Permanent Password (min 8 characters)'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={language === 'ka' ? 'მინიმუმ 8 სიმბოლო' : 'At least 8 characters'}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                {language === 'ka' ? 'გაიმეორეთ ახალი პაროლი' : 'Confirm New Password'}
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={language === 'ka' ? 'გაიმეორეთ ახალი პაროლი' : 'Re-enter new password'}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              {!isMandatory && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
                >
                  {language === 'ka' ? 'გაუქმება' : 'Cancel'}
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {loading
                    ? (language === 'ka' ? 'ინახება...' : 'Updating...')
                    : (language === 'ka' ? 'პაროლის დაყენება & გააქტიურება' : 'Set Password & Activate')}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
