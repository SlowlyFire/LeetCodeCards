import 'dotenv/config'; // Must be first — loads .env before anything else reads process.env
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import patternsRouter from './routes/patterns.routes.js';
import questionsRouter from './routes/questions.routes.js';
import statsRouter from './routes/stats.routes.js';
import aiRouter from './routes/ai.routes.js';
import drillRouter from './routes/drill.routes.js';

const app = express();
const PORT = process.env.PORT ?? 3000;

// ── CORS allow-list ──────────────────────────────────────────────────────────
// Only the local dev frontend, the production Vercel URL (FRONTEND_URL, set in
// Railway), and this project's Vercel preview deployments may call the API from
// a browser. Everything else is rejected. CORS only restricts browser requests —
// requests with no Origin (curl, server-to-server, health checks) are allowed.
const allowedOrigins = [
  'http://localhost:5173', // Vite dev server
  'https://leetcodecards-frontend.vercel.app', // production Vercel URL (hardcoded so prod never depends on the env var)
  process.env.FRONTEND_URL, // optional override — e.g. a custom domain set in Railway
].filter(Boolean);

// Vercel preview deployments for THIS project look like
// https://leetcodecards-frontend-<hash>-<scope>.vercel.app — allow those too so
// PR previews can hit the backend, without opening up every *.vercel.app domain.
const VERCEL_PREVIEW = /^https:\/\/leetcodecards-frontend-[a-z0-9-]+\.vercel\.app$/;

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // No Origin header → not a browser cross-origin request (curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (VERCEL_PREVIEW.test(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};

app.use(cors(corsOptions));

// Parse incoming JSON request bodies
app.use(express.json());

// Health check — returns DB connection state so you can verify both server + DB in one curl
app.get('/health', (_req, res) => {
  const dbState = mongoose.connection.readyState;
  // readyState: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
  const dbStatus = dbState === 1 ? 'connected' : 'disconnected';
  res.json({ status: 'ok', db: dbStatus });
});

// API routes — all prefixed with /api
app.use('/api/patterns', patternsRouter);
app.use('/api/questions', questionsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/drill', drillRouter);

// Central error handler — must be registered AFTER all routes.
// Express knows this is an error handler because it takes 4 arguments (err, req, res, next).
app.use(errorHandler);

// Connect to MongoDB, then start the server.
// Keeping them sequential means the server won't accept traffic before the DB is ready.
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err: Error) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1); // Crash loudly on startup — better than silently serving a broken app
  });
