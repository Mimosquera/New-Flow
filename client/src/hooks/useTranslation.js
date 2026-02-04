/**
 * useTranslation Hook Module
 * Custom React hook for internationalization (i18n) support
 * 
 * Features:
 * - Access current language context
 * - Translate keys to localized strings
 * - Automatic fallback to key if translation missing
 * - Integration with LanguageContext
 */

import { useLanguage } from '../contexts/LanguageContext.jsx';
import { translations } from '../translations/translations.js';

// Constants
const DEFAULT_LANGUAGE = 'en';

/**
 * Custom hook for translating strings based on current language
 * @returns {Object} Translation utilities
 * @property {Function} t - Translation function that accepts a key and returns translated string
 * @property {string} language - Current language code ('en', 'es', etc.)
 */
export const useTranslation = () => {
  try {
    const languageContext = useLanguage();
    
    // Defensive check for context availability
    if (!languageContext) {
      console.error('useTranslation must be used within a LanguageProvider');
      return {
        t: (key) => key,
        language: DEFAULT_LANGUAGE
      };
    }

    const { language } = languageContext;
    const currentLanguage = language || DEFAULT_LANGUAGE;

    /**
     * Translate a key to the current language
     * @param {string} key - Translation key to look up
     * @returns {string} Translated string or key if not found
     */
    const t = (key) => {
      try {
        // Validate key parameter
        if (!key || typeof key !== 'string') {
          console.error('Translation key must be a non-empty string');
          return key || '';
        }

        // Check if translations exist for current language
        if (!translations || !translations[currentLanguage]) {
          console.warn(`No translations found for language: ${currentLanguage}`);
          return key;
        }

        // Return translation or fallback to key
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
    // Return safe fallback
    return {
      t: (key) => key || '',
      language: DEFAULT_LANGUAGE
    };
  }
};
