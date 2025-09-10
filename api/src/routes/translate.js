import express from 'express';
import { translateMenu } from '../controllers/translateMenuController.js';

const router = express.Router();

// Menu translation route
router.post('/translateMenu', translateMenu);

export default router; 