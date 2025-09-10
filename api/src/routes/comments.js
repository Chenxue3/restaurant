import express from 'express';
import { protect } from '../middlewares/auth.js';
import { deleteComment } from '../controllers/postController.js';

const router = express.Router();

router.route('/:id')
  .delete(protect, deleteComment);

export default router; 