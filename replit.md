# ChatMe

A WhatsApp-like real-time chat app with 1-1 and group messaging, typing indicators, emoji reactions, read receipts, and online presence.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `SESSION_SECRET` — secret string for express-session

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite + Tailwind CSS (artifacts/chatme)
- API: Express 5 + Socket.IO
- DB: PostgreSQL + Drizzle ORM
- Auth: session-based (express-session + connect-pg-simple)
- Validation: Zod (zod/v4), drizzle-zod
- API codegen: Orval (from OpenAPI spec in lib/api-spec/openapi.yaml)
- Build: esbuild (CJS bundle for api-server)

## Where things live

- `artifacts/chatme/` — React frontend (WhatsApp-like UI)
- `artifacts/api-server/` — Express 5 + Socket.IO backend
- `lib/db/src/schema/` — Drizzle DB schema (users, conversations, messages, reactions, reads)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all API contracts)
- `lib/api-client-react/src/generated/` — auto-generated React Query hooks (do not edit manually)

## Architecture decisions

- Session-cookie auth (no JWT): sessions stored in Postgres via connect-pg-simple; `SESSION_SECRET` required.
- `credentials: "include"` set globally in custom-fetch so session cookies are sent cross-origin.
- Login flow: after `POST /auth/login`, `useGetMe` query is explicitly invalidated + refetched before navigating to `/`, preventing the AuthContext redirect loop.
- Socket.IO uses the same express-session middleware so socket connections are authenticated automatically.
- Frontend deployed as a static Vite build on Vercel; backend runs separately (requires Postgres + SESSION_SECRET).

## Product

- Login with just a username (no password) — auto-creates account on first login
- Real-time 1-1 and group chat via Socket.IO
- Message reactions (emoji), reply-to, soft delete
- Typing indicators, online/offline presence, read receipts
- Profile management (display name, avatar, status text)
- File/image upload

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After any schema change, run `pnpm --filter @workspace/db run push` in dev.
- The api-server `app.ts` must mount `sessionMiddleware` before any routes; do not remove it or login will break.
- CORS must stay `{ origin: true, credentials: true }` — removing `credentials: true` breaks cookie auth cross-origin.
- `DATABASE_URL` and `SESSION_SECRET` are both required at startup; missing either throws immediately.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- Vercel project: https://vercel.com/ghostie174-8590s-projects/chatme
- GitHub: https://github.com/Ghostwav/ChatMe
