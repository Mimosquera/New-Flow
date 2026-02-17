/**
 * Detects if text is in Spanish or English based on word patterns and special characters
 * @param {string} text - The text to analyze
 * @returns {string} 'es' for Spanish, 'en' for English
 */
export const detectLang = (text) => {
  if (!text) return 'en';

  const spanishWords = [
    'el', 'la', 'de', 'que', 'y', 'en', 'los', 'del', 'se', 'por', 'un', 'una',
    'con', 'para', 'es', 'al', 'lo', 'como', 'más', 'pero', 'sus', 'le', 'ya',
    'o', 'este', 'sí', 'porque', 'esta', 'entre', 'cuando', 'muy', 'sin', 'sobre',
    'también', 'me', 'hasta', 'hay', 'donde', 'quien', 'desde', 'todo', 'nos',
    'durante', 'todos', 'uno', 'les', 'ni', 'contra', 'otros', 'ese', 'eso', 'ante',
    'ellos', 'e', 'esto', 'mí', 'antes', 'algunos', 'qué', 'unos', 'yo', 'otro',
    'otras', 'otra', 'él', 'tanto', 'esa', 'estos', 'mucho', 'quienes', 'nada',
    'muchos', 'cual', 'sea', 'poco', 'ella', 'estar', 'estas', 'algunas', 'algo',
    'nosotros', 'mi', 'mis', 'tú', 'te', 'ti', 'tu', 'tus', 'ellas', 'nosotras',
    'vosotros', 'vosotras', 'os', 'mío', 'mía', 'míos', 'mías', 'tuyo', 'tuya',
    'tuyos', 'tuyas', 'suyo', 'suya', 'suyos', 'suyas', 'nuestro', 'nuestra',
    'nuestros', 'nuestras', 'vuestro', 'vuestra', 'vuestros', 'vuestras', 'esos',
    'esas', 'estoy', 'estás', 'está', 'estamos', 'estáis', 'están', 'esté', 'estés',
    'estemos', 'estéis', 'estén', 'estaré', 'estarás', 'estará', 'estaremos',
    'estaréis', 'estarán', 'estaría', 'estarías', 'estaríamos', 'estaríais',
    'estarían', 'estaba', 'estabas', 'estábamos', 'estabais', 'estaban', 'estuve',
    'estuviste', 'estuvo', 'estuvimos', 'estuvisteis', 'estuvieron', 'estuviera',
    'estuvieras', 'estuviéramos', 'estuvierais', 'estuvieran', 'estuviese',
    'estuvieses', 'estuviésemos', 'estuvieseis', 'estuviesen', 'estando', 'estado',
    'estada', 'estados', 'estadas', 'estad'
  ];

  const lower = text.toLowerCase();
  let score = 0;

  spanishWords.forEach(word => {
    if (lower.includes(word)) score++;
  });

  if (/[áéíóúñü¿¡]/.test(lower)) score += 2;

  return score > 2 ? 'es' : 'en';
};
