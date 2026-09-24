# G.K. BTU Students — Frontend

React 19 + Vite + Tailwind v4 interface for the BTU course **Innovative Entrepreneurship & Startups**. Deployed on **Cloudflare** (Worker + static assets); the API is a separate Cloudflare Worker (`AIagent-Back`).

## Local development

```bash
npm install
npm run dev          # http://localhost:5173
```

The dev server proxies `/api` and `/ws` to the API Worker on `http://localhost:8787`. Start it with `npm run dev` in the backend repo, so no `.env` is needed locally.

## Deploy to Cloudflare

The frontend is deployed as a **Cloudflare Worker with static assets** (`wrangler.toml` → `[assets] directory = "./dist"`, with `not_found_handling = "single-page-application"` for client-side routes). It needs **no secrets**: API keys live only in the backend Worker.

**CLI**

```bash
echo "VITE_API_URL=https://aiagent-back.<subdomain>.workers.dev" > .env.production   # your API Worker URL
npx wrangler login
npm run deploy       # vite build + wrangler deploy → https://aiagent-front.<subdomain>.workers.dev
```

**Workers Builds (dashboard, Git-connected)**: build command `npm run build`, deploy command `npx wrangler deploy`, and build variable `VITE_API_URL`.

**GitHub Actions**: `.github/workflows/deploy.yml` deploys on every push to `main`. It needs the repository secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`, and the repository variable `VITE_API_URL`.

Then put the frontend URL into the backend's `FRONTEND_URL` / `PUBLIC_APP_URL` (CORS and email links) and redeploy the API. `VITE_API_URL` is baked in at build time, so rebuild after changing it.

## Design system

The whole palette lives in `src/index.css`:

- **Brand**: BTU magenta `#E20074` (`brand-*`). Tailwind's `indigo-*` scale is remapped to it and `violet-*` to a berry accent, so existing components pick up the brand automatically. `slate-*` is remapped to a plum-tinted ink.
- **Glass**: cards (`bg-slate-900` + rounded) and modals render as frosted glass over an animated aurora background. `.glass` and `.glass-strong` are available for new markup.
- **Micro-interactions**: every button presses in on click. Primary buttons (`bg-indigo-600`) get a magenta gradient, a glow and a sheen on hover. Cards use `.lift`.
- **3D**: `components/ui/TiltCard.tsx`, a pointer-tracking tilt with a magenta glare. It's disabled on touch and for `prefers-reduced-motion`.
- **Motion**: page and tab transitions, the sliding nav indicator and the chat bubbles use `motion/react`.

## Structure

```
src/
  lib/api.ts            API client: token, WebSocket URL
  App.tsx               auth, landing page, routing, WebSocket
  index.css             design tokens, glass, motion
  components/
    ui/                 BrandMark, TiltCard, Aurora, Markdown
    Navbar, AuthLoginModal, PasswordChangeModal
    StudentTeachingAgent   AI chat (OpenRouter model picker)
    StudentExamCenter / ExamTakingScreen / CountdownTimer
    StudentDigests
    Admin*              tests, knowledge base, students, live monitor, digest
  context/LanguageContext, i18n.ts
```

## Notes

- The token is kept in `localStorage`. A 401 logs the user out automatically.
- Roles come from the server. What you see depends on your account.
- The exam timer runs on the server, so reloading the page doesn't reset it.
- Proctoring sees tab switches, focus loss, copy/paste, right-click, leaving fullscreen and disconnects. It can't see a second device or another person in the room, so it supports in-room supervision rather than replacing it.
