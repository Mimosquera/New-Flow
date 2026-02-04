/**
 * Middleware to check if user is an employee
 */
export function requireEmployee(req, res, next) {
  if (!req.user.isEmployee) {
    return res.status(403).json({ message: 'Employee access only' });
  }
  next();
}

/**
 * Input validation helper
 */
export function validateRequired(fields) {
  return (req, res, next) => {
    const missing = [];
    for (const field of fields) {
      // Use hasOwnProperty and check for undefined/null to allow falsy values like 0
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
        missing.push(field);
      }
    }
    if (missing.length > 0) {
      return res.status(400).json({ 
        message: `Missing required fields: ${missing.join(', ')}` 
      });
    }
    next();
  };
}

/**
 * Sanitize string input
 */
export function sanitizeString(str) {
  if (!str || typeof str !== 'string') return str;
  return str.trim().replace(/[<>]/g, '');
}
