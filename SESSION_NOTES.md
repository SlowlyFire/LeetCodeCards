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
- **Session 2:** REST routes — CRUD for Patterns and Questions (`src/routes/`)
- **Session 3:** Seed script — populate DB with real patterns and questions
- **Session 4:** Spaced repetition logic — bucket promotion/demotion based on review results
- **Session 5:** Anthropic API integration — generate card content from problem statements
- **Session 6:** Auth (if needed) + middleware layer
- **Session 7:** Frontend — React + Vite + Tailwind
- **Session 8:** Deploy — Railway (backend) + Vercel (frontend)
