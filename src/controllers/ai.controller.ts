import type { Request, Response } from 'express';
import { asyncHandler } from '../lib/asyncHandler.js';
import { analyzeQuestion } from '../services/ai.service.js';

// POST /api/ai/analyze-question
// Body is already validated by the analyzeQuestionSchema middleware, so req.body
// is a clean { problemStatement, title? }.
export const analyzeQuestionController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await analyzeQuestion(req.body);
    res.json(result);
  },
);
