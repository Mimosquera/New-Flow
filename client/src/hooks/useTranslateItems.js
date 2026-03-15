import { useState, useEffect } from 'react';
import { translateObject } from '../services/translationService.js';

export const useTranslateItems = (items, fields, language) => {
  const [translated, setTranslated] = useState(items);
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      setTranslated([]);
      return;
    }

    // DB content is always English; only translate when switching to Spanish.
    if (language !== 'es') {
      setTranslated(items);
      return;
    }

    let cancelled = false;

    const run = async () => {
      setTranslating(true);
      try {
        const result = await Promise.all(
          items.map(item => translateObject(item, fields, 'es'))
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
