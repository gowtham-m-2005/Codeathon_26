## Purpose
Provide concise, actionable guidance so coding agents can be immediately productive in this React + Vite frontend.

## Big picture
- Frontend: a Vite-powered React SPA in `src/` (entry: `src/main.jsx`).
- Routes are declared in `src/App.jsx` and map pages under `src/pages/` (examples: `Login`, `SubmitPackage`, `AdminDashboard`).
- Backend integration: the frontend calls a backend at `/api` (example: `src/pages/SubmitPackage.jsx` posts to `/api/ethos`). Vite's dev server proxies `/api` to the backend using `VITE_BACKEND_URL` (see `vite.config.js`).

## Key workflows / commands
- Start dev server: `npm run dev` (runs `vite`).
- Build production: `npm run build`.
- Preview build: `npm run preview`.
- Lint: `npm run lint` (ESLint config in root). See `package.json` for exact script names.

## Project-specific patterns and conventions
- File-per-page CSS: pages under `src/pages/` typically have co-located CSS files (e.g., `SubmitPackage.jsx` + `SubmitPackage.css`). Keep styling local when adding new pages.
- Functional components + hooks: prefer function components and `useState`/`useEffect` patterns (examples throughout `src/pages`).
- Routing: central `Routes` in `src/App.jsx`. Add a new route by importing the page and registering a `Route`.
- API calls: call relative `/api` paths (let Vite proxy handle dev URL). Do not hardcode backend host in code—use `VITE_BACKEND_URL` in environment for local dev.

## Integration points & environment
- Vite proxy: `vite.config.js` proxies `/api` to `process.env.VITE_BACKEND_URL`. Ensure `VITE_BACKEND_URL` is set in your environment or `.env` when running `npm run dev`.
- Third-party libs: `react-router-dom`, `lucide-react` are used. Check `package.json` for versions and add new deps with `npm i --save`.

## Pull request / change guidance for agents
- Small changes only: keep edits focused to a single feature or page.
- Follow the existing pattern: co-locate CSS with page, use existing component patterns and hooks.
- When adding API calls, mirror the `/api` path and update any mock or test harness if present.

## Concrete examples (where to look)
- Routing and pages: `src/App.jsx` and `src/pages/`
- Backend call example: `src/pages/SubmitPackage.jsx` (POST to `/api/ethos`).
- Dev proxy: `vite.config.js` (reads `VITE_BACKEND_URL`).
- Scripts: `package.json` (dev/build/lint/preview).

## Ask the user if unclear
If you need missing context (backend schema, environment variables, or auth flows), ask for the backend repo link, `.env` values, or API spec before making non-trivial changes.

---
If you want I can expand this with example PR templates, common TODOs, or automated test guidance.
