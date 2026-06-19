import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { gradeSchema } from '../schemas/drill.schema.js';
import { getDrillQueue, gradeQuestion } from '../controllers/drill.controller.js';

const router = Router();

router.get('/queue', getDrillQueue);
router.post('/grade/:questionId', validate(gradeSchema), gradeQuestion);

export default router;
