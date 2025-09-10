import express from 'express';
import { protect, optionalAuth } from '../middlewares/auth.js';
import { postUpload } from '../middlewares/upload.js';
import {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  likePost,
  addComment
} from '../controllers/postController.js';

const router = express.Router();

router.route('/')
  .get(optionalAuth, getPosts)
  .post(protect, postUpload.array('images', 10), createPost);

router.route('/:id')
  .get(optionalAuth, getPost)
  .put(protect, postUpload.array('images', 10), updatePost)
  .delete(protect, deletePost);

router.route('/:id/like')
  .put(protect, likePost);

router.route('/:id/comments')
  .post(protect, addComment);

export default router; 