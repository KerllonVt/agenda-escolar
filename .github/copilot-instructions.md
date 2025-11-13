## Quick orientation for AI agents

This repository is a small React + Vite frontend with a Node/Express backend in `backend/`.
Focus first on these files: `backend/index.js`, `backend/db.js`, `backend/authMiddleware.js`, 
any route under `backend/routes/*.js` (e.g. `auth.js`, `aulas.js`), and `src/contexts/AuthContext.tsx`.

Commands (local dev)
- Install: `npm i` (root). Note: root `postinstall` runs `cd backend && npm install`.
- Start frontend dev: `npm run dev` (runs Vite on port 3000 by default).
- Start backend dev (separate terminal): `cd backend; npm run dev` (uses nodemon, default port 5000).

Environment and deployment notes
- Backend expects POSTGRES_URL and JWT_SECRET in `backend/.env` (see `backend/db.js` and `auth.js`).
- `backend/db.js` enables `ssl.rejectUnauthorized = false` for Neon/Vercel-style hosted Postgres — keep that when deploying to Vercel.

API & auth patterns
- Public endpoints: GET `/api`, GET `/api/test-db`.
- Auth: POST `/api/auth/login` (see `backend/routes/auth.js`). The login response returns `{ token, usuario }`.
- Protected routes use Authorization header: `Authorization: Bearer <token>` (middleware in `backend/authMiddleware.js`).
- Token payload fields: `{ id_usuario, email, tipo }` plus `id_turma` when the user is an aluno. Many server-side checks rely on these exact fields.
- Admin-only routes: protected by `isAdmin` (example: `/api/users`). Professor-only routes use `isProfessor`.

Frontend patterns and conventions
- Auth state: `src/contexts/AuthContext.tsx` stores `usuario` and `token` in React state (Login component performs the API call). Do not assume token is persisted to localStorage — components read `token` from context.
- Several components hardcode the API base URL: `const API_URL = 'http://localhost:5000/api'` (search `const API_URL =`). Consider updating to an env-based value if you change dev/production URL.
- Example of client usage: fetch(`${API_URL}/aulas?data_inicio=...`, { headers: { 'Authorization': `Bearer ${token}` } }). See `src/components/AgendaSemanal.tsx`.

Repo-specific conventions
- Field and variable names are in Portuguese (e.g., `tipo_usuario`, `id_turma`, `id_usuario`). Match these when calling the API or modifying DB queries.
- Routes follow REST-ish naming under `/api/*` and are grouped in `backend/routes/`.

Where to look for changes and tests
- No test suite is present (backend `package.json` has a placeholder `test` script). Start by running the backend and calling `/api/test-db` to verify DB connectivity.

If you modify auth or DB:
- Update `backend/db.js` and `backend/authMiddleware.js` together. Token format and required fields are relied on across frontend components.

When in doubt
- Open `backend/routes/auth.js` for examples of user creation and login flow.
- Search for `Authorization` and `API_URL` in `src/` to find frontend integration points.

Ask the maintainers for missing secrets (POSTGRES_URL, JWT_SECRET) and desired API base URL for production.

-- End --