import { useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext.jsx';
import { translations } from '../translations/translations.js';

const DEFAULT_LANGUAGE = 'en';

export const useTranslation = () => {
  const languageContext = useLanguage();
  const lang = languageContext?.language || DEFAULT_LANGUAGE;

  if (!languageContext) {
    console.error('useTranslation must be used within a LanguageProvider');
  }

  const t = useCallback((key) => {
    if (!key) return '';
    return translations[lang]?.[key] ?? key;
  }, [lang]);

  return { t, language: lang };
};
