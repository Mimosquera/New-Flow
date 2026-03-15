const TRANSLATION_API_URL = 'https://api.mymemory.translated.net/get';
const DEFAULT_SOURCE_LANG = 'en';
const SUCCESS_STATUS = 200;
const RATE_LIMIT_STATUS = 429;
const ADMIN_AUTHOR = 'Admin';
const REQUEST_DELAY_MS = 350;
const STORAGE_KEY = 'nf_translation_cache';
const RL_KEY = 'nf_rl_until';
const CACHE_TTL_MS = 48 * 60 * 60 * 1000;
const RL_TTL_MS = 24 * 60 * 60 * 1000;

const translationCache = new Map();
const pendingPromises = new Map();

const isRateLimitActive = () => {
  try {
    const until = parseInt(localStorage.getItem(RL_KEY) || '0', 10);
    return Date.now() < until;
  } catch { return false; }
};

const setRateLimited = () => {
  try { localStorage.setItem(RL_KEY, String(Date.now() + RL_TTL_MS)); } catch {}
};

const clearRateLimit = () => {
  rateLimited = false;
  try { localStorage.removeItem(RL_KEY); } catch {}
};

let rateLimited = isRateLimitActive();

const loadCache = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const { entries, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) { localStorage.removeItem(STORAGE_KEY); return; }
    for (const [k, v] of Object.entries(entries)) translationCache.set(k, v);
  } catch {}
};

const saveCache = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      entries: Object.fromEntries(translationCache),
      ts: Date.now(),
    }));
  } catch {}
};

loadCache();

// Single serial queue shared across the entire app
let globalQueue = Promise.resolve();

export const translateText = async (text, targetLang, sourceLang = DEFAULT_SOURCE_LANG) => {
  if (!text || typeof text !== 'string' || text.trim() === '') return text || '';
  if (!targetLang || typeof targetLang !== 'string') return text;
  if (targetLang === sourceLang) return text;

  const cacheKey = `${sourceLang}|${targetLang}|${text}`;

  if (translationCache.has(cacheKey)) return translationCache.get(cacheKey);
  if (rateLimited) return text;
  if (pendingPromises.has(cacheKey)) return pendingPromises.get(cacheKey);

  const promise = new Promise((resolve) => {
    globalQueue = globalQueue.then(async () => {
      if (translationCache.has(cacheKey)) { resolve(translationCache.get(cacheKey)); return; }
      if (rateLimited) { resolve(text); return; }

      let result = text;
      try {
        const response = await fetch(
          `${TRANSLATION_API_URL}?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.responseStatus === RATE_LIMIT_STATUS) {
            rateLimited = true;
            setRateLimited();
          } else if (data.responseStatus === SUCCESS_STATUS && data?.responseData?.translatedText) {
            if (rateLimited) clearRateLimit();
            result = data.responseData.translatedText;
            translationCache.set(cacheKey, result);
            saveCache();
          }
        } else if (response.status === RATE_LIMIT_STATUS) {
          rateLimited = true;
          setRateLimited();
        }
      } catch {}

      if (!rateLimited) await new Promise(r => setTimeout(r, REQUEST_DELAY_MS));
      resolve(result);
    });
  });

  pendingPromises.set(cacheKey, promise);
  promise.finally(() => pendingPromises.delete(cacheKey));
  return promise;
};

export const translateObject = async (obj, fields, targetLang, sourceLang = DEFAULT_SOURCE_LANG) => {
  if (!obj || typeof obj !== 'object') return obj || {};
  if (!Array.isArray(fields) || fields.length === 0) return obj;
  if (!targetLang || typeof targetLang !== 'string') return obj;
  if (targetLang === sourceLang) return obj;

  const translatedObj = { ...obj };
  for (const field of fields) {
    if (field === 'author' && obj[field] !== ADMIN_AUTHOR) continue;
    if (!Object.prototype.hasOwnProperty.call(obj, field)) continue;
    translatedObj[field] = await translateText(obj[field], targetLang, sourceLang);
  }
  return translatedObj;
};

export const clearTranslationCache = () => {
  translationCache.clear();
  clearRateLimit();
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
};
