import type { Request, Response } from 'express';
import { Question } from '../models/Question.js';
import { AppError } from '../lib/AppError.js';
import { asyncHandler } from '../lib/asyncHandler.js';
import { renamePatternField } from '../lib/renamePattern.js';

// GET /api/questions?status=Solved&difficulty=Medium&pattern=<id>&search=term
export const listQuestions = asyncHandler(async (req: Request, res: Response) => {
  const { status, difficulty, pattern, search } = req.query;
  const filter: Record<string, unknown> = {};

  if (status) filter.status = status;
  if (difficulty) filter.difficulty = difficulty;
  if (pattern) filter.patternId = pattern;
  if (search) {
    filter.$or = [
      { title: { $regex: String(search), $options: 'i' } },
      { problemStatement: { $regex: String(search), $options: 'i' } },
    ];
  }

  const questions = await Question.find(filter)
    .populate('patternId') // replaces the ObjectId with the full Pattern document
    .lean();

  res.json(questions.map((q) => renamePatternField(q as Record<string, unknown>)));
});

// GET /api/questions/:id
export const getQuestion = asyncHandler(async (req: Request, res: Response) => {
  const question = await Question.findById(req.params.id)
    .populate('patternId')
    .lean();

  if (!question) throw new AppError(404, 'Question not found');
  res.json(renamePatternField(question as Record<string, unknown>));
});

// POST /api/questions
export const createQuestion = asyncHandler(async (req: Request, res: Response) => {
  const question = await Question.create(req.body);
  res.status(201).json(question);
});

// PUT /api/questions/:id
export const updateQuestion = asyncHandler(async (req: Request, res: Response) => {
  const question = await Question.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true },
  ).lean();
  if (!question) throw new AppError(404, 'Question not found');
  res.json(question);
});

// PATCH /api/questions/:id  — primary use: status changes, srBucket updates, saving mySolution
export const patchQuestion = asyncHandler(async (req: Request, res: Response) => {
  const question = await Question.findByIdAndUpdate(
    req.params.id,
    { $set: req.body },
    { new: true, runValidators: true },
  ).lean();
  if (!question) throw new AppError(404, 'Question not found');
  res.json(question);
});

// DELETE /api/questions/:id
export const deleteQuestion = asyncHandler(async (req: Request, res: Response) => {
  const question = await Question.findByIdAndDelete(req.params.id).lean();
  if (!question) throw new AppError(404, 'Question not found');
  res.json({ message: 'Question deleted' });
});
