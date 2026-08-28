const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./db');
const requireAuth = require('./middleware/auth');
require('dotenv').config();

const app = express();

// Startup environment checks
if (!process.env.DATABASE_URL) {
  console.warn('⚠️ WARNING: DATABASE_URL is not set in environment variables.');
}
if (!process.env.JWT_SECRET) {
  console.warn('⚠️ WARNING: JWT_SECRET is not set in environment variables.');
}

// Parse JSON bodies
app.use(express.json());

// Set allowed origins
const defaultOrigins = [
  'https://client-two-omega-44.vercel.app',
  'https://client-oho7ho3ma-murangievans-projects.vercel.app',
  'https://client-cv7nxfbv8-murangievans-projects.vercel.app',
  'https://auth-monorepo-p05t.onrender.com',
  'http://localhost:3000',
  'http://localhost:5000',
];

const customOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((o) => o.trim().replace(/\/+$/, ''))
  : [];

const allowedOrigins = [...new Set([...defaultOrigins, ...customOrigins])];

// Apply CORS middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or server-to-server)
      if (!origin) return callback(null, true);

      const isAllowed =
        allowedOrigins.includes(origin) ||
        /^https:\/\/.*\.vercel\.app$/.test(origin) ||
        /^http:\/\/localhost(:\d+)?$/.test(origin);

      if (isAllowed) {
        callback(null, true);
      } else {
        // Allow origin to avoid breaking preview deployments
        callback(null, true);
      }
    },
    credentials: true,
  })
);

// Health check — useful for confirming Render deploy is alive
app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

// Diagnostic health check
app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  let dbError = null;
  try {
    if (process.env.DATABASE_URL) {
      await pool.query('SELECT 1');
      dbStatus = 'connected';
    } else {
      dbError = 'DATABASE_URL is not configured';
    }
  } catch (err) {
    dbError = err.message;
  }

  res.json({
    status: 'ok',
    database: dbStatus,
    dbError,
    jwtConfigured: Boolean(process.env.JWT_SECRET),
    environment: process.env.NODE_ENV || 'production',
  });
});

// REGISTER
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('Registration failed: JWT_SECRET environment variable is missing.');
    return res.status(500).json({ error: 'Server configuration error: JWT_SECRET is missing.' });
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [email, hash]
    );

    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: '7d' });

    res.status(201).json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error('Registration error:', err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Email already registered' });
    }
    if (err.code === '42P01') {
      return res.status(500).json({
        error: "Database error: 'users' table does not exist. Please run the CREATE TABLE statement in Neon.",
      });
    }
    if (err.code === '42703') {
      return res.status(500).json({
        error: "Database schema error: Column mismatch. Ensure 'password_hash' column exists.",
      });
    }
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// LOGIN
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('Login failed: JWT_SECRET environment variable is missing.');
    return res.status(500).json({ error: 'Server configuration error: JWT_SECRET is missing.' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const passwordHash = user.password_hash || user.password;
    if (!passwordHash) {
      return res.status(500).json({ error: 'User record has no password hash.' });
    }

    const match = await bcrypt.compare(password, passwordHash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error('Login error:', err);
    if (err.code === '42P01') {
      return res.status(500).json({
        error: "Database error: 'users' table does not exist. Please run the CREATE TABLE statement in Neon.",
      });
    }
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ME — protected route, proves the token actually works
app.get('/api/me', requireAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, created_at FROM users WHERE id = $1', [req.userId]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    console.error('Me endpoint error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));