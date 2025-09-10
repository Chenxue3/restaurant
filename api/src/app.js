import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
dotenv.config();

// Import database connection
import connectDB from './config/database.js';

// Import route files
import authRoutes from './routes/auth.js';
import restaurantRoutes from './routes/restaurants.js';
import categoryRoutes from './routes/categories.js';
import postRoutes from './routes/posts.js';
import commentRoutes from './routes/comments.js';
import chatbotRoutes from './routes/chatbot.js';
import placesRoutes from './routes/places.js';
import menuRoutes from './routes/menu.js';
import scanMenuRoutes from './routes/scanMenu.js';
import translateRoutes from './routes/translate.js';
import dishRoutes from './routes/dishes.js';
import dishImagesRoutes from './routes/dishImages.js';
import { getAnswerUtility, checkTopicRelevanceUtility } from './util/chatbotLogic.js';

// Get __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize app
const app = express();
dotenv.config();
// Connect to database
connectDB();

// Debug environment variables
console.log('MONGODB_URI:', process.env.MONGODB_URI);
console.log('PORT:', process.env.PORT);

// Test Redis connection
const testRedisConnection = async () => {
  try {
    const { default: redisClient } = await import('./config/redis.js');
    console.log('Redis connection successful');
  } catch (error) {
    console.error('Redis connection failed:', error.message);
  }
};

// Test Azure Blob Storage connection
const testAzureStorageConnection = async () => {
  try {
    const { BlobServiceClient } = await import('@azure/storage-blob');
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
    if (!connectionString) {
      console.warn('Azure storage connection string is not configured');
      return;
    }
    
    // Validate connection string format
    if (!connectionString.startsWith('DefaultEndpointsProtocol=https')) {
      console.error('Invalid Azure storage connection string format. Expected format: DefaultEndpointsProtocol=https;AccountName=...;AccountKey=...;EndpointSuffix=core.windows.net');
      return;
    }
    
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    console.log('Azure Blob Storage connection successful');
  } catch (error) {
    console.error('Azure Blob Storage connection failed:', error.message);
  }
};

//test chatbot API connection
const testChatbotConnection = async () => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key is not configured');
      return;
    }
    
    // Test relevance check
    const relevanceTest = await checkTopicRelevanceUtility('Best food in New Zealand');
    console.log('Relevance check test:', relevanceTest);
    
    if (!relevanceTest.success) {
      console.warn('Chatbot API test failed:', relevanceTest.error);
      if (relevanceTest.error.includes('quota')) {
        console.warn('OpenAI API quota exceeded. Please check your billing details.');
      }
    } else {
      console.log('Chatbot API connection successful');
    }
  } catch (error) {
    console.error('Chatbot test failed:', error.message);
  }
};

// Test Google Places API connection
const testGooglePlacesConnection = async () => {
  try {
    if (!process.env.GOOGLE_PLACES_API_KEY) {
      console.error('Google Places API key is not configured');
      return;
    }

    console.log('Testing Google Places API connection...');
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/autocomplete/json', {
      params: {
        input: 'test',
        types: 'restaurant',
        components: 'country:nz',
        key: process.env.GOOGLE_PLACES_API_KEY
      }
    });

    console.log('Google Places API test response:', {
      status: response.data.status,
      error_message: response.data.error_message,
      predictions: response.data.predictions?.length || 0
    });
  } catch (error) {
    console.error('Google Places API test failed:', {
      message: error.message,
      response: error.response?.data
    });
  }
};

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/dishes', dishRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/places', placesRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/scan-menu', scanMenuRoutes);
app.use('/api/dish-images', dishImagesRoutes);
app.use('/api', translateRoutes);

// Route for testing the API
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to SmartSavor API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 middleware
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  
  // Run connection tests
  await testRedisConnection();
  await testAzureStorageConnection();
  await testChatbotConnection();
  await testGooglePlacesConnection();
});

export default app;