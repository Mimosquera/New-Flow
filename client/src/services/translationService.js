/**
 * Translation Service Module
 * Provides text translation using MyMemory Translation API (Free, No API Key)
 * API Limit: 10,000 words per day for free tier
 * Source: https://mymemory.translated.net/
 * 
 * Features:
 * - Automatic caching to reduce API calls
 * - Rate limit handling with graceful fallback
 * - Error resilience (returns original text on failure)
 * - Support for object field translation
 */

// Constants
const TRANSLATION_API_URL = 'https://api.mymemory.translated.net/get';
const DEFAULT_SOURCE_LANG = 'en';
const SUCCESS_STATUS = 200;
const RATE_LIMIT_STATUS = 429;
const ADMIN_AUTHOR = 'Admin';

// Cache for storing translations to reduce API calls
const translationCache = new Map();

/**
 * Translate text using MyMemory API
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language code ('es', 'en', etc.)
 * @param {string} sourceLang - Source language code (default: 'en')
 * @returns {Promise<string>} Translated text or original text if translation fails
 */
export const translateText = async (text, targetLang, sourceLang = DEFAULT_SOURCE_LANG) => {
  try {
    // Validate inputs
    if (!text || typeof text !== 'string') {
      console.error('Invalid text provided for translation');
      return text || '';
    }

    if (!targetLang || typeof targetLang !== 'string') {
      console.error('Invalid target language provided');
      return text;
    }

    // Don't translate if target is same as source
    if (targetLang === sourceLang) {
      return text;
    }

    // Return empty/whitespace strings as-is
    if (text.trim() === '') {
      return text;
    }

    // Create cache key
    const cacheKey = `${sourceLang}-${targetLang}-${text}`;
    
    // Check cache first
    if (translationCache.has(cacheKey)) {
      return translationCache.get(cacheKey);
    }

    // Build API URL with encoded parameters
    const apiUrl = `${TRANSLATION_API_URL}?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;
    
    const response = await fetch(apiUrl);

    if (!response.ok) {
      console.warn('Translation API request failed:', response.status);
      return text;
    }

    const data = await response.json();

    // Handle rate limiting
    if (data.responseStatus === RATE_LIMIT_STATUS) {
      console.warn('Translation API rate limit reached. Falling back to original text.');
      return text;
    }

    // Check for successful translation
    if (data.responseStatus === SUCCESS_STATUS && data?.responseData?.translatedText) {
      const translated = data.responseData.translatedText;
      
      // Cache the translation
      translationCache.set(cacheKey, translated);
      
      return translated;
    } else {
      console.warn('Translation API returned unexpected status:', data?.responseStatus);
      return text;
    }
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Return original text on error
  }
};

/**
 * Translate multiple text fields within an object
 * @param {Object} obj - Object containing text fields to translate
 * @param {string[]} fields - Array of field names to translate
 * @param {string} targetLang - Target language code ('es', 'en', etc.)
 * @param {string} sourceLang - Source language code (default: 'en')
 * @returns {Promise<Object>} New object with translated fields
 */
export const translateObject = async (obj, fields, targetLang, sourceLang = DEFAULT_SOURCE_LANG) => {
  try {
    // Validate inputs
    if (!obj || typeof obj !== 'object') {
      console.error('Invalid object provided for translation');
      return obj || {};
    }

    if (!Array.isArray(fields) || fields.length === 0) {
      console.error('Invalid fields array provided');
      return obj;
    }

    if (!targetLang || typeof targetLang !== 'string') {
      console.error('Invalid target language provided');
      return obj;
    }

    // Don't translate if target is same as source
    if (targetLang === sourceLang) {
      return obj;
    }

    // Translate all specified fields
    const translations = await Promise.all(
      fields.map(field => {
        try {
          // Skip translation for author names except "Admin"
          if (field === 'author' && obj[field] !== ADMIN_AUTHOR) {
            return Promise.resolve(obj[field]);
          }
          
          // Check if field exists in object
          if (!Object.prototype.hasOwnProperty.call(obj, field)) {
            console.warn(`Field '${field}' not found in object`);
            return Promise.resolve('');
          }

          return translateText(obj[field], targetLang, sourceLang);
        } catch (error) {
          console.error(`Error translating field '${field}':`, error);
          return Promise.resolve(obj[field]);
        }
      })
    );

    // Create new object with translated fields
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

/**
 * Clear translation cache (useful for memory management)
 * @returns {boolean} True if cache was cleared successfully
 */
export const clearTranslationCache = () => {
  try {
    translationCache.clear();
    return true;
  } catch (error) {
    console.error('Error clearing translation cache:', error);
    return false;
  }
};

/**
 * Get the current size of the translation cache
 * @returns {number} Number of cached translations
 */
export const getCacheSize = () => {
  try {
    return translationCache.size;
  } catch (error) {
    console.error('Error getting cache size:', error);
    return 0;
  }
};

/**
 * Check if translation is available for a specific text
 * @param {string} text - Text to check
 * @param {string} targetLang - Target language code
 * @param {string} sourceLang - Source language code
 * @returns {boolean} True if translation is cached
 */
export const isCached = (text, targetLang, sourceLang = DEFAULT_SOURCE_LANG) => {
  try {
    if (!text || !targetLang) {
      return false;
    }
    const cacheKey = `${sourceLang}-${targetLang}-${text}`;
    return translationCache.has(cacheKey);
  } catch (error) {
    console.error('Error checking cache:', error);
    return false;
  }
};
