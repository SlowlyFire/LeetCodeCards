import type { Request, Response } from 'express';
import { Question } from '../models/Question.js';
import { Pattern } from '../models/Pattern.js';
import { asyncHandler } from '../lib/asyncHandler.js';

type AggResult = { _id: string; count: number }[];

// Converts [{_id: 'Solved', count: 3}, ...] to {Solved: 3, ...}
// and fills in any missing keys with 0 so the shape is always predictable.
function toMap(results: AggResult, keys: string[]): Record<string, number> {
  const map: Record<string, number> = Object.fromEntries(keys.map((k) => [k, 0]));
  for (const { _id, count } of results) {
    if (_id) map[_id] = count;
  }
  return map;
}

// GET /api/stats
export const getStats = asyncHandler(async (_req: Request, res: Response) => {
  // Run all DB queries in parallel — no sequential dependency between them
  const [
    totalQuestions,
    totalPatterns,
    byStatusRaw,
    byDifficultyRaw,
    bySrBucketRaw,
    questionsWithoutPattern,
  ] = await Promise.all([
    Question.countDocuments(),
    Pattern.countDocuments(),
    Question.aggregate<{ _id: string; count: number }>([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Question.aggregate<{ _id: string; count: number }>([
      { $group: { _id: '$difficulty', count: { $sum: 1 } } },
    ]),
    Question.aggregate<{ _id: string; count: number }>([
      { $group: { _id: '$srBucket', count: { $sum: 1 } } },
    ]),
    // Questions with no pattern assigned (field absent or null)
    Question.countDocuments({ $or: [{ patternId: { $exists: false } }, { patternId: null }] }),
  ]);

  res.json({
    totalQuestions,
    totalPatterns,
    questionsWithoutPattern,
    byStatus: toMap(byStatusRaw, ['Solved', 'Review', 'Skipped', 'Not Started']),
    byDifficulty: toMap(byDifficultyRaw, ['Easy', 'Medium', 'Hard']),
    bySrBucket: toMap(bySrBucketRaw, ['Hot', 'Warm', 'Mastered']),
  });
});
