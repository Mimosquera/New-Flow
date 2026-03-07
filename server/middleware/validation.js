export function requireEmployee(req, res, next) {
  if (!req.user.isEmployee) {
    return res.status(403).json({ message: 'Employee access only' });
  }
  next();
}

export function validateRequired(fields) {
  return (req, res, next) => {
    const missing = [];
    for (const field of fields) {
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

export function sanitizeString(str) {
  if (!str || typeof str !== 'string') return str;
  return str.trim().replace(/[<>]/g, '');
}
