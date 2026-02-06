const TRANSLATION_API_URL = 'https://api.mymemory.translated.net/get';
const DEFAULT_SOURCE_LANG = 'en';
const SUCCESS_STATUS = 200;
const RATE_LIMIT_STATUS = 429;
const ADMIN_AUTHOR = 'Admin';

const translationCache = new Map();

export const translateText = async (text, targetLang, sourceLang = DEFAULT_SOURCE_LANG) => {
  try {
    if (!text || typeof text !== 'string') {
      return text || '';
    }

    if (!targetLang || typeof targetLang !== 'string') {
      return text;
    }

    if (targetLang === sourceLang) {
      return text;
    }

    if (text.trim() === '') {
      return text;
    }

    const cacheKey = `${sourceLang}-${targetLang}-${text}`;
    
    if (translationCache.has(cacheKey)) {
      return translationCache.get(cacheKey);
    }

    const apiUrl = `${TRANSLATION_API_URL}?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;
    
    const response = await fetch(apiUrl);

    if (!response.ok) {
      return text;
    }

    const data = await response.json();

    if (data.responseStatus === RATE_LIMIT_STATUS) {
      console.warn('Translation API rate limit reached');
      return text;
    }

    if (data.responseStatus === SUCCESS_STATUS && data?.responseData?.translatedText) {
      const translated = data.responseData.translatedText;
      translationCache.set(cacheKey, translated);
      return translated;
    } else {
      return text;
    }
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
};

export const translateObject = async (obj, fields, targetLang, sourceLang = DEFAULT_SOURCE_LANG) => {
  try {
    if (!obj || typeof obj !== 'object') {
      return obj || {};
    }

    if (!Array.isArray(fields) || fields.length === 0) {
      return obj;
    }

    if (!targetLang || typeof targetLang !== 'string') {
      return obj;
    }

    if (targetLang === sourceLang) {
      return obj;
    }

    const translations = await Promise.all(
      fields.map(field => {
        try {
          if (field === 'author' && obj[field] !== ADMIN_AUTHOR) {
            return Promise.resolve(obj[field]);
          }
          
          if (!Object.prototype.hasOwnProperty.call(obj, field)) {
            return Promise.resolve('');
          }

          return translateText(obj[field], targetLang, sourceLang);
        } catch (error) {
          console.error(`Error translating field '${field}':`, error);
          return Promise.resolve(obj[field]);
        }
      })
    );

    const translatedObj = { ...obj };
    fields.forEach((field, index) => {
      translatedObj[field] = translations[index];
    });

    return translatedObj;
  } catch (error) {
    console.error('Error translating object:', error);
    return obj;
  }
};

export const clearTranslationCache = () => {
  try {
    translationCache.clear();
    return true;
  } catch (error) {
    console.error('Error clearing translation cache:', error);
    return false;
  }
};

export const getCacheSize = () => {
  try {
    return translationCache.size;
  } catch (error) {
    return 0;
  }
};

export const isCached = (text, targetLang, sourceLang = DEFAULT_SOURCE_LANG) => {
  try {
    if (!text || !targetLang) {
      return false;
    }
    const cacheKey = `${sourceLang}-${targetLang}-${text}`;
    return translationCache.has(cacheKey);
  } catch (error) {
    return false;
  }
};
