// Resolves backend API URL with fallback and ensures no trailing slashes
export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || 'https://auth-monorepo-p05t.onrender.com'
).replace(/\/+$/, '');
