import type { Request, Response } from 'express';
import { Question } from '../models/Question.js';
import { AppError } from '../lib/AppError.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { renamePatternField } from '../lib/renamePattern.js';
import {
  nextBucket,
  isDue,
  BUCKET_PRIORITY,
  type SrBucket,
} from '../services/sr.service.js';
import type { GradeInput } from '../schemas/drill.schema.js';

const VALID_BUCKETS: SrBucket[] = ['Hot', 'Warm', 'Mastered'];
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

// Minimal shape we read off the lean docs for due-filtering and ordering.
interface DrillCard {
  status: string;
  srBucket: SrBucket;
  lastReviewedAt: Date | null;
  number?: number;
}

// Drill ordering (spec):
//   1. Review-status cards first
//   2. then bucket priority (Hot > Warm > Mastered)
//   3. then oldest lastReviewedAt first (null = never seen = oldest)
//   4. then ascending number (stable tiebreak)
function compareDrillCards(a: DrillCard, b: DrillCard): number {
  const aReview = a.status === 'Review' ? 0 : 1;
  const bReview = b.status === 'Review' ? 0 : 1;
  if (aReview !== bReview) return aReview - bReview;

  const aPrio = BUCKET_PRIORITY[a.srBucket];
  const bPrio = BUCKET_PRIORITY[b.srBucket];
  if (aPrio !== bPrio) return aPrio - bPrio;

  const aTime = a.lastReviewedAt ? a.lastReviewedAt.getTime() : 0;
  const bTime = b.lastReviewedAt ? b.lastReviewedAt.getTime() : 0;
  if (aTime !== bTime) return aTime - bTime;

  return (a.number ?? 0) - (b.number ?? 0);
}

// GET /api/drill/queue?limit=20&bucket=Hot&pattern=<id>
export const getDrillQueue = asyncHandler(async (req: Request, res: Response) => {
  const { limit: limitRaw, bucket, pattern } = req.query;

  // Clamp limit to 1..50, default 20.
  const parsed = Number(limitRaw);
  const limit = Number.isFinite(parsed)
    ? Math.min(Math.max(Math.trunc(parsed), 1), MAX_LIMIT)
    : DEFAULT_LIMIT;

  // Narrow the candidate set in the DB query where we can.
  const filter: Record<string, unknown> = {};
  if (typeof bucket === 'string' && VALID_BUCKETS.includes(bucket as SrBucket)) {
    filter.srBucket = bucket;
  }
  if (typeof pattern === 'string' && pattern) {
    filter.patternId = pattern;
  }

  const candidates = await Question.find(filter).populate('patternId').lean();

  // Due-filter + order in JS (dataset is small; keeps the logic pure & obvious).
  const now = new Date();
  const due = candidates
    .filter((q) => isDue(q.srBucket, q.lastReviewedAt, now))
    .sort(compareDrillCards as (a: unknown, b: unknown) => number)
    .slice(0, limit);

  res.json(due.map((q) => renamePatternField(q as Record<string, unknown>)));
});

// POST /api/drill/grade/:questionId  body: { grade }
export const gradeQuestion = asyncHandler(async (req: Request, res: Response) => {
  const { grade } = req.body as GradeInput;

  // Need the current bucket to compute the transition, so fetch first.
  const existing = await Question.findById(req.params.questionId).lean();
  if (!existing) throw new AppError(404, 'Question not found');

  const updatedBucket = nextBucket(existing.srBucket, grade);

  const updated = await Question.findByIdAndUpdate(
    req.params.questionId,
    { $set: { srBucket: updatedBucket, lastReviewedAt: new Date() } },
    { new: true },
  )
    .populate('patternId')
    .lean();

  if (!updated) throw new AppError(404, 'Question not found');
  res.json(renamePatternField(updated as Record<string, unknown>));
});
