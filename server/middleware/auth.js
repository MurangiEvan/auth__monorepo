const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = header.split(' ')[1];
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('Auth middleware failed: JWT_SECRET environment variable is missing.');
    return res.status(500).json({ error: 'Server configuration error: JWT_SECRET is missing' });
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    req.userId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = requireAuth;
