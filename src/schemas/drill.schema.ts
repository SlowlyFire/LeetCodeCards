import { z } from 'zod';

// Body of POST /api/drill/grade/:questionId
export const gradeSchema = z.object({
  grade: z.enum(['got_it', 'hmm', 'forgot']),
});

export type GradeInput = z.infer<typeof gradeSchema>;
