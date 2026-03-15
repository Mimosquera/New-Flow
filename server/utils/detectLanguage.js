export const detectLanguage = (text) => {
  if (/[áéíóúñü¿¡]/i.test(text) || /\b(el|la|de|que|y|en|un|una|por|con|para|es)\b/i.test(text)) {
    return 'es';
  }
  return 'en';
};
