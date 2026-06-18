# LeetCodeCards — Session Notes

## Session 1 — Backend Scaffold (2026-06-19)

### Built
- Express 4 + TypeScript (strict mode, ES modules) project from scratch
- `tsx watch` hot reload dev server on port 3000
- MongoDB Atlas connection via Mongoose (`src/config/db.ts`)
- Mongoose models with TypeScript interfaces:
  - `Pattern` — algorithm patterns with signal words, template, insights
  - `Question` — LeetCode-style problems with spaced repetition fields (`srBucket`, `lastReviewedAt`)
- `GET /health` → `{"status":"ok","db":"connected"}`
- `.env` for secrets (gitignored), `.env.example` committed as template
- `README.md` with setup instructions

### Decisions made
- `tsx` over `ts-node-dev` — simpler, faster, no extra config
- `"moduleResolution": "bundler"` in tsconfig — works cleanly with tsx + ESNext modules
- Server waits for DB connection before listening — avoids serving traffic with no DB

### Pending (Session 2+)
- **Session 2:** REST routes — CRUD for Patterns and Questions (`src/routes/`) ✅ Done
- **Session 3:** Seed script — populate DB with real patterns and questions
- **Session 4:** Spaced repetition logic — bucket promotion/demotion based on review results
- **Session 5:** Anthropic API integration — generate card content from problem statements
- **Session 6:** Auth (if needed) + middleware layer
- **Session 7:** Frontend — React + Vite + Tailwind
- **Session 8:** Deploy — Railway (backend) + Vercel (frontend)

---

## Session 2 — REST CRUD Endpoints (2026-06-19)

### Built
- `AppError` class (`src/lib/AppError.ts`) — typed errors with HTTP status codes; controllers throw, never call `res.status()` directly
- `asyncHandler` wrapper (`src/lib/asyncHandler.ts`) — forwards async throws to Express error middleware; no try/catch in controllers
- Central `errorHandler` middleware — handles Zod errors (400), AppError, Mongoose CastError (404), duplicate key (409), and unknown 500s
- `validate()` middleware factory — parses `req.body` against a Zod schema before the controller runs
- Zod schemas for Pattern and Question (create / update / patch variants)
- Full CRUD for `/api/patterns` (6 endpoints) — including `?search=` filter on name + signalWords, 409 block on delete if questions reference the pattern
- Full CRUD for `/api/questions` (6 endpoints) — filters: `?status=`, `?difficulty=`, `?pattern=`, `?search=`; GET responses populate patternId and rename field to `pattern`
- `GET /api/stats` — parallel aggregation returning counts by status, difficulty, srBucket; all buckets always present even if count is 0

### Decisions made
- `asyncHandler` wrapper over `express-async-errors` package — explicit, no magic, visible to the reader
- PUT uses `$set` (not true document replace) — avoids accidental field erasure; `name` still required by Zod
- `patternId` renamed to `pattern` in Question responses via object destructure — cleaner API surface for the frontend
- Stats uses `Promise.all` for all DB queries in parallel — single round-trip cost regardless of query count
- Zod v4 validation message for missing required field says "Invalid input: expected string, received undefined" (v4 default) rather than custom "name is required" — message is clear, can be tuned later

### Pending
- **Session 3:** Seed script — populate DB with real patterns and questions
- **Session 4:** Spaced repetition logic — bucket promotion/demotion (`PATCH /api/questions/:id` with srBucket)
- **Session 5:** Anthropic API integration — generate card content from problem statements
- **Session 6:** Auth (if needed) + middleware layer
- **Session 7:** Frontend — React + Vite + Tailwind
- **Session 8:** Deploy — Railway (backend) + Vercel (frontend)
