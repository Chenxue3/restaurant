import Dish from '../models/Dish.js';
import DishCategory from '../models/DishCategory.js';
import Restaurant from '../models/Restaurant.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { uploadImage, deleteImage } from '../services/azureStorage.js';

// @desc    Get all dishes for a restaurant with filters
// @route   GET /api/restaurants/:restaurantId/dishes
export const getDishes = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { 
      category, 
      isVegetarian, 
      isVegan, 
      isGlutenFree,
      minPrice, 
      maxPrice, 
      spicyLevel,
      search,
      sort = 'displayOrder'
    } = req.query;

    // Build query
    const query = { restaurant: restaurantId };

    // Apply filters
    if (category) {
      query.category = category;
    }

    if (isVegetarian === 'true') {
      query.isVegetarian = true;
    }

    if (isVegan === 'true') {
      query.isVegan = true;
    }

    if (isGlutenFree === 'true') {
      query.isGlutenFree = true;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (spicyLevel) {
      query.spicyLevel = Number(spicyLevel);
    }

    if (search) {
      query.$text = { $search: search };
    }

    // Get dishes
    const dishes = await Dish.find(query)
      .populate('category', 'name description')
      .sort(sort);

    res.status(200).json({
      success: true,
      count: dishes.length,
      data: dishes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single dish
// @route   GET /api/dishes/:id
export const getDish = async (req, res) => {
  try {
    const dish = await Dish.findById(req.params.id)
      .populate('category', 'name description');

    if (!dish) {
      return res.status(404).json({
        success: false,
        message: 'Dish item not found'
      });
    }

    res.status(200).json({
      success: true,
      data: dish
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new dish
// @route   POST /api/restaurants/:restaurantId/dishes
export const createDish = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    // Check if user has access to this restaurant
    const restaurant = await Restaurant.findOne({ 
      _id: restaurantId,
      owner: req.user.id
    });
    
    if (!restaurant) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add dishes to this restaurant'
      });
    }
    
    // Verify the category exists and belongs to this restaurant
    const category = await DishCategory.findById(req.body.category);
    
    if (!category || category.restaurant.toString() !== restaurantId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category'
      });
    }
    
    // Set restaurant ID in the dish data
    req.body.restaurant = restaurantId;
    
    // Handle uploaded images using Azure Blob Storage
    if (req.files && req.files.length > 0) {
      // Upload each image to Azure Blob Storage
      const imageUrls = await Promise.all(
        req.files.map(file => uploadImage(file, `restaurants/${restaurantId}/dishes`))
      );
      
      req.body.images = imageUrls;
    }
    
    // Create the dish
    const dish = await Dish.create(req.body);
    
    res.status(201).json({
      success: true,
      data: dish
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update dish
// @route   PUT /api/dishes/:id
export const updateDish = async (req, res) => {
  try {
    let dish = await Dish.findById(req.params.id).populate('restaurant');
    
    if (!dish) {
      return res.status(404).json({
        success: false,
        message: 'Dish item not found'
      });
    }
    
    // Check ownership
    if (dish.restaurant.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this dish'
      });
    }
    
    // Verify the category exists and belongs to this restaurant
    const category = await DishCategory.findById(req.body.category);
    
    if (req.body.category && (!category || category.restaurant.toString() !== dish.restaurant._id.toString())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category'
      });
    }
    
    // Handle uploaded images using Azure Blob Storage
    if (req.files && req.files.length > 0) {
      // Delete old images from Azure Blob Storage
      if (dish.images && dish.images.length > 0) {
        try {
          await Promise.all(dish.images.map(imageUrl => deleteImage(imageUrl)));
        } catch (imageError) {
          console.error('Error deleting old images from Azure Blob Storage:', imageError);
          // Continue with update even if old image deletion fails
        }
      }
      
      // Upload each image to Azure Blob Storage
      const imageUrls = await Promise.all(
        req.files.map(file => uploadImage(file, `restaurants/${dish.restaurant._id}/dishes`))
      );
      
      req.body.images = imageUrls;
    }
    
    // Update the dish
    dish = await Dish.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('category', 'name description');
    
    res.status(200).json({
      success: true,
      data: dish
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete dish
// @route   DELETE /api/dishes/:id
export const deleteDish = async (req, res) => {
  try {
    const dish = await Dish.findById(req.params.id).populate('restaurant');
    
    if (!dish) {
      return res.status(404).json({
        success: false,
        message: 'Dish item not found'
      });
    }
    
    // Check ownership
    if (dish.restaurant.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this dish'
      });
    }
    
    // Delete images from Azure Blob Storage
    if (dish.images && dish.images.length > 0) {
      try {
        // Delete each image from Azure Blob Storage
        await Promise.all(dish.images.map(imageUrl => deleteImage(imageUrl)));
      } catch (imageError) {
        console.error('Error deleting images from Azure Blob Storage:', imageError);
        // Continue with dish deletion even if image deletion fails
      }
    }
    
    await dish.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Dish item deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all categories for a restaurant
// @route   GET /api/restaurants/:restaurantId/categories
export const getCategories = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    const categories = await DishCategory.find({ restaurant: restaurantId })
      .sort('displayOrder');
    
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new category
// @route   POST /api/restaurants/:restaurantId/categories
export const createCategory = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    
    // Check if user has access to this restaurant
    const restaurant = await Restaurant.findOne({ 
      _id: restaurantId,
      owner: req.user.id
    });
    
    if (!restaurant) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add categories to this restaurant'
      });
    }
    
    // Set restaurant ID in the category data
    req.body.restaurant = restaurantId;
    
    // Create the category
    const category = await DishCategory.create(req.body);
    
    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
export const updateCategory = async (req, res) => {
  try {
    let category = await DishCategory.findById(req.params.id).populate('restaurant');
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Check ownership
    if (category.restaurant.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this category'
      });
    }
    
    // Update the category
    category = await DishCategory.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    
    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete category
// @route   DELETE /api/categories/:id
export const deleteCategory = async (req, res) => {
  try {
    const category = await DishCategory.findById(req.params.id).populate('restaurant');
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Check ownership
    if (category.restaurant.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this category'
      });
    }
    
    // Check if there are dishes in this category
    const dishCount = await Dish.countDocuments({ category: category._id });
    
    if (dishCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with dishes. Move or delete dishes first.'
      });
    }
    
    await category.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
}; 