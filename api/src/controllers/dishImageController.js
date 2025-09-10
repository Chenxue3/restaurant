import { genDishImg } from '../services/openai.js';

/**
 * @desc    Generate an image for a dish based on name and description
 * @route   POST /api/dish-images/generate
 * @access  Public
 */
export const generateDishImage = async (req, res) => {
    try {
        const { dishName, dishDescription } = req.body;

        if (!dishName) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a dish name'
            });
        }

        const result = await genDishImg(dishName, dishDescription || '');

        if (!result.success) {
            return res.status(500).json(result);
        }

        res.status(200).json(result);
        
    } catch (error) {
        console.error('Error generating dish image:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating dish image',
            error: error.message
        });
    }
}; 