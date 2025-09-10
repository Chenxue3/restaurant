import express from 'express';
import { restaurantUpload } from '../middlewares/upload.js';
import { analyzeMenuImage } from '../controllers/scanMenuController.js';

const router = express.Router();

// scan menu route
router.route('/analyze-menu')
  .post(restaurantUpload.single('menuImage'), analyzeMenuImage);

export default router; 