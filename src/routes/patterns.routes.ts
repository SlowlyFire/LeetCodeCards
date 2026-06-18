import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import {
  createPatternSchema,
  updatePatternSchema,
  patchPatternSchema,
} from '../schemas/pattern.schema.js';
import {
  listPatterns,
  getPattern,
  createPattern,
  updatePattern,
  patchPattern,
  deletePattern,
} from '../controllers/patterns.controller.js';

const router = Router();

router.get('/', listPatterns);
router.get('/:id', getPattern);
router.post('/', validate(createPatternSchema), createPattern);
router.put('/:id', validate(updatePatternSchema), updatePattern);
router.patch('/:id', validate(patchPatternSchema), patchPattern);
router.delete('/:id', deletePattern);

export default router;
