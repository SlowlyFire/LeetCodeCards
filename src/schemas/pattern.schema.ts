import { z } from 'zod';

// Base shape — all optional except name (used by both POST and PUT)
const patternBase = z.object({
  name: z.string().min(1, 'name is required'),
  globalCategory: z.string().optional(),
  whenToUse: z.string().optional(),
  keyInsight: z.string().optional(),
  template: z.string().optional(),
  pitfalls: z.string().optional(),
  signalWords: z.array(z.string()).optional(),
});

// POST + PUT: name is required
export const createPatternSchema = patternBase;

// PUT: same as POST for this app (see SESSION_NOTES for decision rationale)
export const updatePatternSchema = patternBase;

// PATCH: every field is optional — only send what changed
export const patchPatternSchema = patternBase.partial();
