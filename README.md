# Auth Monorepo — Next.js + Express + Neon + JWT

Two apps, one folder:

```
auth-monorepo/
├── server/     Express API (deploy to Render)
└── client/     Next.js app (deploy to Vercel)
```

They stay two separate deployable apps — the "monorepo" part just means one
folder/one Git repo to manage during the learning session. Each has its own
`package.json` and its own `node_modules`.

## Run locally

### 1. Database (Neon)
1. Create a free project at https://neon.tech
2. Copy the connection string
3. Run this in the Neon SQL editor:
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Backend
```bash
cd server
npm install
cp .env.example .env
# edit .env — paste your Neon connection string and set a JWT_SECRET
npm run dev
```
Runs on http://localhost:5000

### 3. Frontend
```bash
cd client
npm install
cp .env.local.example .env.local
# edit .env.local if your API isn't on localhost:5000
npm run dev
```
Runs on http://localhost:3000

### 4. Test
Visit http://localhost:3000/register, create an account, then
http://localhost:3000/login with the same credentials.

## Deploy later
- **server/** → Render (Web Service, root directory = `server`)
- **client/** → Vercel (root directory = `client`)

Set the same env vars in each platform's dashboard — never commit `.env` files.
