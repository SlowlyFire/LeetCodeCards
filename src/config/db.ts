import mongoose from 'mongoose';

// Reads MONGODB_URI from .env and opens a persistent connection.
// Called once at server startup — Mongoose manages the connection pool internally.
export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  await mongoose.connect(uri);
  console.log('MongoDB connected:', mongoose.connection.host);
}
