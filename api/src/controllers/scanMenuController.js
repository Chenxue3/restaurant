import storage from '../services/azureStorage.js';
import { translateMenuImageFromOpenAI } from '../services/openai.js';

/**
 * @desc    Analyze menu image and return structured data without restaurant ID
 * @route   POST /api/scan-menu/analyze-menu
 * @access  Public
 */
export const analyzeMenuImage = async (req, res) => {
    try {
        const { language = 'en' } = req.body;

        // Check if image was uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload a menu image'
            });
        }

        // Upload image to Azure Storage
        const imageUrl = await storage.uploadImage(req.file, 'menus');

        // Translate the menu with OpenAI
        const menuData = await translateMenuImageFromOpenAI(imageUrl, language);

        // Return the translated menu data
        res.status(200).json({
            success: true,
            data: menuData
        });

    } catch (error) {
        console.error('Error translating menu image:', error);
        res.status(500).json({
            success: false,
            message: 'Error translating menu image',
            error: error.message
        });
    }
}; 