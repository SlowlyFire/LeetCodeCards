import 'dotenv/config'; // Must be first — loads .env before anything else reads process.env
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';

const app = express();
const PORT = process.env.PORT ?? 3000;

// Allow requests from any origin during development.
// In production (Session 7) we'll restrict this to the Vercel frontend URL.
app.use(cors());

// Parse incoming JSON request bodies
app.use(express.json());

// Health check — returns DB connection state so you can verify both server + DB in one curl
app.get('/health', (_req, res) => {
  const dbState = mongoose.connection.readyState;
  // readyState: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
  const dbStatus = dbState === 1 ? 'connected' : 'disconnected';

  res.json({ status: 'ok', db: dbStatus });
});

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
