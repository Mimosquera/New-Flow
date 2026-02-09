import { useLanguage } from '../contexts/LanguageContext.jsx';
import { translations } from '../translations/translations.js';

const DEFAULT_LANGUAGE = 'en';

export const useTranslation = () => {
  try {
    const languageContext = useLanguage();

    if (!languageContext) {
      console.error('useTranslation must be used within a LanguageProvider');
      return {
        t: (key) => key,
        language: DEFAULT_LANGUAGE
      };
    }

    const { language } = languageContext;
    const currentLanguage = language || DEFAULT_LANGUAGE;

    const t = (key) => {
      try {
        if (!key || typeof key !== 'string') {
          console.error('Translation key must be a non-empty string');
          return key || '';
        }

        if (!translations || !translations[currentLanguage]) {
          console.warn(`No translations found for language: ${currentLanguage}`);
          return key;
        }

        const translation = translations[currentLanguage][key];

        if (translation === undefined || translation === null) {
          console.warn(`Translation missing for key: "${key}" in language: ${currentLanguage}`);
          return key;
        }

        return translation;
      } catch (error) {
        console.error('Error translating key:', key, error);
        return key;
      }
    };

    return {
      t,
      language: currentLanguage
    };
  } catch (error) {
    console.error('Error in useTranslation hook:', error);
    return {
      t: (key) => key || '',
      language: DEFAULT_LANGUAGE
    };
  }
};
