import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language } from '../i18n';
import { translations } from '../utils/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
  isGeorgian: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('cognitest_lang') as Language;
      return saved === 'en' || saved === 'ka' ? saved : 'ka'; // default to Georgian as requested
    } catch {
      return 'ka';
    }
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('cognitest_lang', lang);
    } catch (e) {
      console.warn('Could not persist language to localStorage', e);
    }
  };

  useEffect(() => {
    // Update HTML lang attribute
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string, fallback?: string): string => {
    const entry = translations[key];
    if (entry && entry[language]) {
      return entry[language];
    }
    return fallback || entry?.en || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        isGeorgian: language === 'ka',
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
