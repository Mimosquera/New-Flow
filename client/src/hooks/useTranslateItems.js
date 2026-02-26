import { useState, useEffect } from 'react';
import { translateObject } from '../services/translationService.js';
import { detectLang } from '../utils/languageDetection.js';

export const useTranslateItems = (items, fields, language) => {
  const [translated, setTranslated] = useState(items);
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      setTranslated([]);
      return;
    }

    const targetLang = language === 'es' ? 'es' : 'en';
    let cancelled = false;

    const run = async () => {
      setTranslating(true);
      try {
        const result = await Promise.all(
          items.map(item => {
            const sourceLang = item.language || detectLang(fields.map(f => item[f] || '').join(' '));
            if (sourceLang !== targetLang) {
              return translateObject(item, fields, targetLang, sourceLang);
            }
            return item;
          })
        );
        if (!cancelled) setTranslated(result);
      } catch {
        if (!cancelled) setTranslated(items);
      } finally {
        if (!cancelled) setTranslating(false);
      }
    };

    run();
    return () => { cancelled = true; };
    // fields is effectively static at each call site
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, language]);

  return [translated, translating];
};
