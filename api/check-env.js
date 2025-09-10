/**
 * Script to verify environment variables are loaded correctly
 * Run this with: node check-env.js
 */

// Load dotenv
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

// Get __dirname equivalent in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Checking environment variables:');
console.log('--------------------------------');
console.log('MONGODB_URI:', process.env.MONGODB_URI || 'Not set');
console.log('PORT:', process.env.PORT || 'Not set');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set (hidden for security)' : 'Not set');
console.log('NODE_ENV:', process.env.NODE_ENV || 'Not set');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Set (hidden for security)' : 'Not set');
console.log('--------------------------------');

if (!process.env.MONGODB_URI || !process.env.PORT || !process.env.JWT_SECRET) {
  console.error('\n⚠️ Some required environment variables are missing!');
  console.log('\nPlease make sure your .env file exists in the api directory and contains:');
  console.log('PORT=3001');
  console.log('MONGODB_URI=your_mongodb_connection_string');
  console.log('JWT_SECRET=your_jwt_secret');
  console.log('NODE_ENV=development');

  console.log('\nThe .env file should be located at:', path.resolve(__dirname, '.env'));
} else {
  console.log('\n✅ All required environment variables are set!');
}

// Check for menu analysis variables
if (!process.env.OPENAI_API_KEY) {
  console.warn('\n⚠️ OPENAI_API_KEY: Required for menu image analysis');
}