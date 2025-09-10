import express from 'express';
import {
  getDish,
  updateDish,
  deleteDish
} from '../controllers/dishController.js';
import { protect } from '../middlewares/auth.js';
import { restaurantUpload } from '../middlewares/upload.js';

const router = express.Router();

router.route('/:id')
  .get(getDish)
  .put(protect, restaurantUpload.array('images', 5), updateDish)
  .delete(protect, deleteDish);

export default router; 