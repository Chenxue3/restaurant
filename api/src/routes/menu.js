import express from 'express';
import multer from 'multer';
import path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Ensure upload directory exists
const ensureUploadDir = async () => {
  // Use __dirname to ensure uploads folder is created under API server directory
  const uploadDir = path.join(__dirname, '../../uploads');
  console.log('=== File Upload Directory Check ===');
  console.log('Target directory:', uploadDir);
  
  try {
    await fs.mkdir(uploadDir, { recursive: true });
    console.log('Upload directory created successfully');
    return uploadDir;
  } catch (error) {
    console.error('Failed to create upload directory:', error);
    throw error;
  }
};

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    try {
      console.log('\n=== File Upload Target Settings ===');
      console.log('Original filename:', file.originalname);
      console.log('File type:', file.mimetype);
      console.log('File size:', file.size);
      
      const uploadDir = await ensureUploadDir();
      console.log('Using upload directory:', uploadDir);
      cb(null, uploadDir);
    } catch (error) {
      console.error('Failed to set upload target:', error);
      cb(error, null);
    }
  },
  filename: function (req, file, cb) {
    console.log('\n=== Generating Filename ===');
    const restaurantId = req.body.restaurantId;
    console.log('Restaurant ID:', restaurantId);
    
    if (!restaurantId) {
      console.error('Missing restaurant ID');
      return cb(new Error('Restaurant ID is required'), null);
    }
    
    const timestamp = Date.now();
    const safeFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const finalFilename = `${restaurantId}_${timestamp}_${safeFilename}`;
    console.log('Generated filename:', finalFilename);
    cb(null, finalFilename);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Menu analysis endpoint
router.post('/analyze', upload.single('menuImage'), async (req, res) => {
  try {
    console.log('\n=== Menu Analysis API Request ===');
    console.log('Request body:', req.body);
    console.log('Uploaded file:', req.file);

    if (!req.file || !req.body.restaurantId) {
      console.error('Missing required fields:', {
        hasFile: !!req.file,
        hasRestaurantId: !!req.body.restaurantId
      });
      return res.status(400).json({
        success: false,
        message: 'Menu image and restaurant ID are required'
      });
    }

    // Verify file was saved successfully
    try {
      console.log('\n=== Verifying File Save ===');
      console.log('Checking file path:', req.file.path);
      await fs.access(req.file.path);
      console.log('File exists and is accessible');
    } catch (error) {
      console.error('File verification failed:', error);
      throw new Error('File was not saved successfully');
    }

    // TODO: Implement actual menu analysis logic here
    // For now, just return a success response
    const response = {
      success: true,
      message: 'Menu image received and saved successfully',
      filePath: req.file.path,
      restaurantId: req.body.restaurantId
    };

    console.log('\n=== Processing Complete ===');
    console.log('Response:', response);
    res.json(response);
  } catch (error) {
    console.error('\n=== Processing Error ===');
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      message: 'Error processing menu image',
      error: error.message
    });
  }
});

export default router; 