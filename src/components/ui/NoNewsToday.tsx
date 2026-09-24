import React from 'react';
import { Newspaper } from 'lucide-react';
import type { Language } from '../../i18n';

/** Today's date (YYYY-MM-DD) in Tbilisi, the same calendar the backend stamps digests with. */
export const todayInTbilisi = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Tbilisi' });

/** Shown when no digest exists for today: nothing new was published, so nothing was generated. */
export const NoNewsToday: React.FC<{ language?: Language; hint?: string }> = ({ language = 'ka', hint }) => (
  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 sm:p-12 text-center">
    <div className="w-12 h-12 mx-auto mb-4 rounded-2xl grid place-items-center bg-indigo-500/10 border border-indigo-500/25 text-indigo-300">
      <Newspaper className="w-6 h-6" />
    </div>
    <h2 className="text-lg font-bold text-slate-100">{language === 'ka' ? 'დღეს სიახლეები არ არის' : 'No news today'}</h2>
    <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
      {hint ||
        (language === 'ka'
          ? 'ბოლო დაიჯესტის შემდეგ ახალი ინფორმაცია არ გამოჩენილა. როგორც კი გამოჩნდება, აქ ნახავ.'
          : 'Nothing new has come up since the last digest. It will appear here as soon as there is.')}
    </p>
  </div>
);
