import express from 'express';
import { protect } from '../middlewares/auth.js';
import { profileUpload } from '../middlewares/upload.js';
import {
  sendVerificationCode,
  verifyCode,
  getMe,
  updateProfile
} from '../controllers/authController.js';

const router = express.Router();

// Public routes
router.post('/send-code', sendVerificationCode);
router.post('/verify', verifyCode);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, profileUpload.single('profileImage'), updateProfile);

export default router;