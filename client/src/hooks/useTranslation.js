import { useLanguage } from '../contexts/LanguageContext.jsx';
import { translations } from '../translations/translations.js';

const DEFAULT_LANGUAGE = 'en';

export const useTranslation = () => {
  const languageContext = useLanguage();

  if (!languageContext) {
    console.error('useTranslation must be used within a LanguageProvider');
    return { t: (key) => key, language: DEFAULT_LANGUAGE };
  }

  const currentLanguage = languageContext.language || DEFAULT_LANGUAGE;

  const t = (key) => {
    if (!key) return '';
    return translations[currentLanguage]?.[key] ?? key;
  };

  return { t, language: currentLanguage };
};
