import express from 'express';
import { protect } from '../middlewares/auth.js';
import {
  updateCategory,
  deleteCategory
} from '../controllers/dishController.js';

const router = express.Router();

router.route('/:id')
  .put(protect, updateCategory)
  .delete(protect, deleteCategory);

export default router; 