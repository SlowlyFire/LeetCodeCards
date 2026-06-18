import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import {
  createQuestionSchema,
  updateQuestionSchema,
  patchQuestionSchema,
} from '../schemas/question.schema.js';
import {
  listQuestions,
  getQuestion,
  createQuestion,
  updateQuestion,
  patchQuestion,
  deleteQuestion,
} from '../controllers/questions.controller.js';

const router = Router();

router.get('/', listQuestions);
router.get('/:id', getQuestion);
router.post('/', validate(createQuestionSchema), createQuestion);
router.put('/:id', validate(updateQuestionSchema), updateQuestion);
router.patch('/:id', validate(patchQuestionSchema), patchQuestion);
router.delete('/:id', deleteQuestion);

export default router;
