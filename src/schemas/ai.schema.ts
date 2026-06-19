import { z } from 'zod';

// Validates the body of POST /api/ai/analyze-question.
// The frontend sends the raw problem text; title is optional (user may pre-fill it).
export const analyzeQuestionSchema = z.object({
  problemStatement: z.string().min(1, 'problemStatement is required'),
  title: z.string().optional(),
});

export type AnalyzeQuestionInput = z.infer<typeof analyzeQuestionSchema>;
