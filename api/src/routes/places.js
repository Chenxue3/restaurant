import express from 'express';
import { getPlaceAutocomplete, getPlaceDetails } from '../controllers/placesController.js';

const router = express.Router();

// Google Places API routes
router.get('/autocomplete', getPlaceAutocomplete);
router.get('/details', getPlaceDetails);

export default router; 