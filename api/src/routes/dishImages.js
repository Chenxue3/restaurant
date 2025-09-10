import express from 'express';
import { generateDishImage } from '../controllers/dishImageController.js';

const router = express.Router();

// Generate dish image route
router.post('/generate', generateDishImage);

export default router; 