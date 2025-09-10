import storage from '../services/azureStorage.js';
import { translateMenuImageFromOpenAI } from '../services/openai.js';
import Restaurant from '../models/Restaurant.js';
import DishCategory from '../models/DishCategory.js';
import Dish from '../models/Dish.js';

/**
 * @desc    Analyze menu image and return structured data
 * @route   POST /api/restaurants/:restaurantId/analyze-menu
 * @access  Private
 */
export const analyzeMenuImage = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const { language = 'en' } = req.body;

        // Verify restaurant ownership
        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }

        if (restaurant.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to analyze menu for this restaurant'
            });
        }

        // Check if image was uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload a menu image'
            });
        }

        // Upload image to Azure Storage
        const imageUrl = await storage.uploadImage(req.file, 'menus');

        // Analyze the menu with OpenAI
        const menuData = await translateMenuImageFromOpenAI(imageUrl, language);

        // Return the analyzed menu data
        res.status(200).json({
            success: true,
            data: menuData
        });

    } catch (error) {
        console.error('Error analyzing menu image:', error);
        res.status(500).json({
            success: false,
            message: 'Error analyzing menu image',
            error: error.message
        });
    }
};

/**
 * @desc    Create dish items from analyzed menu data
 * @route   POST /api/restaurants/:restaurantId/create-from-analysis
 * @access  Private
 */
export const createDishesFromAnalysis = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const { menuData } = req.body;

        // Verify restaurant ownership
        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).json({
                success: false,
                message: 'Restaurant not found'
            });
        }

        if (restaurant.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to add dish items to this restaurant'
            });
        }

        const results = {
            categoriesCreated: 0,
            dishItemsCreated: 0,
            categories: []
        };

        // Process each category and create dish items
        for (const category of menuData.categories) {
            // Create or find the category
            let dishCategory = await DishCategory.findOne({
                name: category.name,
                restaurant: restaurantId
            });

            if (!dishCategory) {
                dishCategory = await DishCategory.create({
                    name: category.name,
                    restaurant: restaurantId
                });
                results.categoriesCreated++;
            }

            const categoryResult = {
                category: dishCategory.name,
                dishItems: []
            };

            // Create dish items for this category
            for (const item of category.items) {
                const dishItem = await Dish.create({
                    name: item.name,
                    description: item.description || '',
                    price: parseFloat(item.price.replace(/[^0-9.]/g, '')) || 0,
                    restaurant: restaurantId,
                    category: dishCategory._id,
                    isVegetarian: item.attributes?.includes('vegetarian') || false,
                    isVegan: item.attributes?.includes('vegan') || false,
                    isGlutenFree: item.attributes?.includes('gluten-free') || false,
                    spicyLevel: item.attributes?.includes('spicy') ? 3 : 0,
                    allergens: item.allergens || [],
                    texture: item.texture ? [item.texture] : [],
                    flavor_profile: item.flavor_profile || ''
                });

                results.dishItemsCreated++;
                categoryResult.dishItems.push(dishItem.name);
            }

            results.categories.push(categoryResult);
        }

        res.status(201).json({
            success: true,
            data: results
        });

    } catch (error) {
        console.error('Error creating dishes from analysis:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating dishes from analysis',
            error: error.message
        });
    }
};