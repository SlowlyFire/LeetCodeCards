# LeetCodeCards — Backend

Express + TypeScript + MongoDB backend for the LeetCodeCards interview prep platform.

## Prerequisites

- Node.js 20+
- A MongoDB Atlas cluster (free tier works)

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Create your .env file from the template
cp .env.example .env
# Then fill in your MONGODB_URI in .env

# 3. Start the dev server with hot reload
npm run dev
```

## Verify it works

```bash
curl http://localhost:3000/health
# Expected: {"status":"ok","db":"connected"}
```

## Scripts

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start with hot reload via tsx |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled output (production) |

## Folder structure

```
src/
├── config/db.ts       MongoDB connection
├── models/
│   ├── Pattern.ts     Mongoose model + TS interface
│   └── Question.ts    Mongoose model + TS interface
├── routes/            REST routes (Session 2)
├── middleware/        Auth, error handling (later sessions)
└── index.ts           Express app entry point
```
