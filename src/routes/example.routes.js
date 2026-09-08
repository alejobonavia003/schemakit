import { Router } from 'express';
import {
  getExamples,
  getExampleById,
  createExample,
} from '../controllers/example.controller.js';

const router = Router();

router.get('/', getExamples);
router.get('/:id', getExampleById);
router.post('/', createExample);

export default router;
