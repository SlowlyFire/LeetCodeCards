import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { analyzeQuestionSchema } from '../schemas/ai.schema.js';
import { analyzeQuestionController } from '../controllers/ai.controller.js';

const router = Router();

// Validate the body, then hand off to the controller.
router.post(
  '/analyze-question',
  validate(analyzeQuestionSchema),
  analyzeQuestionController,
);

export default router;
