import { z } from 'zod';

const questionBase = z.object({
  number: z.number().optional(),
  title: z.string().min(1, 'title is required'),
  section: z.string().optional(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).optional(),
  // patternId arrives as a string (Mongo ObjectId hex) — Mongoose casts it automatically
  patternId: z.string().optional(),
  timeComplexity: z.string().optional(),
  spaceComplexity: z.string().optional(),
  myDifficulty: z.number().min(1).max(5).optional(),
  status: z.enum(['Solved', 'Review', 'Skipped', 'Not Started']).optional(),
  problemStatement: z.string().optional(),
  mySolution: z.string().optional(),
  notes: z.string().optional(),
  srBucket: z.enum(['Hot', 'Warm', 'Mastered']).optional(),
  lastReviewedAt: z.string().datetime().nullable().optional(),
});

// POST + PUT: title is required
export const createQuestionSchema = questionBase;

// PUT: same as POST
export const updateQuestionSchema = questionBase;

// PATCH: only the fields being changed
export const patchQuestionSchema = questionBase.partial();
