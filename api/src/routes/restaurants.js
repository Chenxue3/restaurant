import express from 'express';
import { protect, optionalAuth } from '../middlewares/auth.js';
import { restaurantUpload } from '../middlewares/upload.js';
import {
  getRestaurants,
  getMyRestaurants,
  getRestaurant,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  uploadRestaurantImages,
  deleteRestaurantImage
} from '../controllers/restaurantController.js';
import {
  getDishes,
  createDish,
  getCategories,
  createCategory
} from '../controllers/dishController.js';
import {
  analyzeMenuImage,
  createDishesFromAnalysis
} from '../controllers/menuAnalysisController.js';

const router = express.Router();

// Restaurant routes
router.route('/')
  .get(optionalAuth, getRestaurants)
  .post(protect, restaurantUpload.array('images', 10), createRestaurant);

// Get my restaurants route - protected
router.get('/my', protect, getMyRestaurants);

router.route('/:id')
  .get(optionalAuth, getRestaurant)
  .put(protect, restaurantUpload.array('images', 10), updateRestaurant)
  .delete(protect, deleteRestaurant);

// Restaurant images routes
router.route('/:id/images')
  .post(protect, restaurantUpload.array('images', 10), uploadRestaurantImages)
  .delete(protect, deleteRestaurantImage);

// Dish routes for a specific restaurant
router.route('/:restaurantId/dishes')
  .get(getDishes)
  .post(protect, restaurantUpload.array('images', 5), createDish);

// Category routes for a specific restaurant
router.route('/:restaurantId/categories')
  .get(getCategories)
  .post(protect, createCategory);

// Menu analysis routes
router.route('/:restaurantId/analyze-menu')
  .post(protect, restaurantUpload.single('menuImage'), analyzeMenuImage);

router.route('/:restaurantId/create-from-analysis')
  .post(protect, createDishesFromAnalysis);

export default router;