import type { Request, Response } from 'express';
import { Pattern } from '../models/Pattern.js';
import { Question } from '../models/Question.js';
import { AppError } from '../lib/AppError.js';
import { asyncHandler } from '../lib/asyncHandler.js';

// GET /api/patterns?search=term
export const listPatterns = asyncHandler(async (req: Request, res: Response) => {
  const { search } = req.query;

  const filter = search
    ? {
        $or: [
          { name: { $regex: String(search), $options: 'i' } },
          // MongoDB checks each element of the signalWords array against the regex
          { signalWords: { $regex: String(search), $options: 'i' } },
        ],
      }
    : {};

  // lean() returns plain JS objects (no Mongoose overhead) — faster for read-only responses
  const patterns = await Pattern.find(filter).lean();
  res.json(patterns);
});

// GET /api/patterns/:id
export const getPattern = asyncHandler(async (req: Request, res: Response) => {
  const pattern = await Pattern.findById(req.params.id).lean();
  if (!pattern) throw new AppError(404, 'Pattern not found');
  res.json(pattern);
});

// POST /api/patterns
export const createPattern = asyncHandler(async (req: Request, res: Response) => {
  const pattern = await Pattern.create(req.body);
  res.status(201).json(pattern);
});

// PUT /api/patterns/:id  (update all mutable fields)
export const updatePattern = asyncHandler(async (req: Request, res: Response) => {
  const pattern = await Pattern.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true }, // new: true returns the updated doc
  ).lean();
  if (!pattern) throw new AppError(404, 'Pattern not found');
  res.json(pattern);
});

// PATCH /api/patterns/:id  (partial update — same implementation, different Zod schema upstream)
export const patchPattern = asyncHandler(async (req: Request, res: Response) => {
  const pattern = await Pattern.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true },
  ).lean();
  if (!pattern) throw new AppError(404, 'Pattern not found');
  res.json(pattern);
});

// DELETE /api/patterns/:id
export const deletePattern = asyncHandler(async (req: Request, res: Response) => {
  // Block delete if any Question still references this pattern
  const refCount = await Question.countDocuments({ patternId: req.params.id });
  if (refCount > 0) {
    throw new AppError(
      409,
      `Cannot delete: ${refCount} question(s) still reference this pattern`,
    );
  }

  const pattern = await Pattern.findByIdAndDelete(req.params.id).lean();
  if (!pattern) throw new AppError(404, 'Pattern not found');
  res.json({ message: 'Pattern deleted' });
});
