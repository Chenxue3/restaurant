import Restaurant from '../models/Restaurant.js';
import DishCategory from '../models/DishCategory.js';
import Dish from '../models/Dish.js';
import azureStorage from '../services/azureStorage.js';

// @desc    Get all restaurants
// @route   GET /api/restaurants
// @access  Public
export const getRestaurants = async (req, res) => {
  try {
    const { search, cuisine, priceRange, hasStudentDiscount, sort = 'name' } = req.query;

    // Build query
    const query = {};

    // Search by name or food items
    if (search) {
      // First find restaurants that have matching food items
      const matchingDishes = await Dish.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      }).distinct('restaurant');

      // Then build the query to include both name matches and restaurants with matching food items
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { _id: { $in: matchingDishes } }
      ];
    }

    // Filter by cuisine
    if (cuisine) {
      query.cuisineType = cuisine;
    }

    // Filter by price range
    if (priceRange) {
      query.priceRange = priceRange;
    }

    // Filter by student discount
    if (hasStudentDiscount === 'true') {
      query.hasStudentDiscount = true;
    }

    // Build sort object
    const sortObj = {};
    if (sort === 'rating') {
      sortObj.rating = -1;
    } else if (sort === 'priceAsc') {
      sortObj.priceRange = 1;
    } else if (sort === 'priceDesc') {
      sortObj.priceRange = -1;
    } else {
      sortObj.name = 1; // Default sort by name
    }

    const restaurants = await Restaurant.find(query)
      .sort(sortObj)
      .select('name description images rating cuisineType priceRange hasStudentDiscount address openingHours')
      .lean();

    res.status(200).json({
      success: true,
      count: restaurants.length,
      data: restaurants
    });
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching restaurants',
      error: error.message
    });
  }
};

// @desc    Get my restaurants (authenticated user only)
// @route   GET /api/restaurants/my
// @access  Private
export const getMyRestaurants = async (req, res) => {
  try {
    const { search, cuisine, priceRange, hasStudentDiscount, sort = 'name' } = req.query;

    // Build query - always filter by current user
    const query = { owner: req.user._id };

    // Search by name or food items
    if (search) {
      // First find restaurants that have matching food items
      const matchingDishes = await Dish.find({
        restaurant: { $in: await Restaurant.find({ owner: req.user._id }).distinct('_id') },
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      }).distinct('restaurant');

      // Then build the query to include both name matches and restaurants with matching food items
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { _id: { $in: matchingDishes } }
      ];
    }

    // Filter by cuisine
    if (cuisine) {
      query.cuisineType = cuisine;
    }

    // Filter by price range
    if (priceRange) {
      query.priceRange = priceRange;
    }

    // Filter by student discount
    if (hasStudentDiscount === 'true') {
      query.hasStudentDiscount = true;
    }

    // Build sort object
    const sortObj = {};
    if (sort === 'rating') {
      sortObj.rating = -1;
    } else if (sort === 'priceAsc') {
      sortObj.priceRange = 1;
    } else if (sort === 'priceDesc') {
      sortObj.priceRange = -1;
    } else {
      sortObj.name = 1; // Default sort by name
    }

    const restaurants = await Restaurant.find(query)
      .sort(sortObj)
      .select('name description images rating cuisineType priceRange hasStudentDiscount address openingHours')
      .lean();

    res.status(200).json({
      success: true,
      count: restaurants.length,
      data: restaurants
    });
  } catch (error) {
    console.error('Error fetching user restaurants:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user restaurants',
      error: error.message
    });
  }
};

// @desc    Get restaurant by ID
// @route   GET /api/restaurants/:id
// @access  Public
export const getRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Get food categories for this restaurant
    const categories = await DishCategory.find({ restaurant: restaurant._id })
      .sort({ displayOrder: 1 })
      .select('name description displayOrder');

    // Get food items organized by category
    const dishByCategory = {};

    for (const category of categories) {
      const dishItems = await Dish.find({
        restaurant: restaurant._id,
        category: category._id,
        isAvailable: true
      }).sort({ displayOrder: 1 });

      dishByCategory[category._id] = {
        categoryInfo: category,
        dishItems
      };
    }

    res.status(200).json({
      success: true,
      data: {
        restaurant,
        dishByCategory
      }
    });
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching restaurant',
      error: error.message
    });
  }
};

// @desc    Create new restaurant
// @route   POST /api/restaurants
// @access  Private
export const createRestaurant = async (req, res) => {
  try {
    // Validate if googlePlaceId exists and is not null
    if (!req.body.googlePlaceId) {
      return res.status(400).json({
        success: false,
        message: 'googlePlaceId is required and cannot be null.'
      });
    }

    // Duplicate check: same name & address
    const existing = await Restaurant.findOne({
      name: req.body.name,
      address: req.body.address
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A restaurant with the same name and address already exists.'
      });
    }

    // Set owner to current user
    req.body.owner = req.user.id;

    // Parse openingHours if it's a string
    if (req.body.openingHours && typeof req.body.openingHours === 'string') {
      try {
        req.body.openingHours = JSON.parse(req.body.openingHours);
      } catch (e) {
        req.body.openingHours = [];
      }
    }
    // Ensure openingHours is always an array
    if (!Array.isArray(req.body.openingHours)) {
      req.body.openingHours = [];
    }

    // Process uploaded images if any
    if (req.files && req.files.length > 0) {
      const imageUrls = [];
      for (const file of req.files) {
        const imageUrl = await azureStorage.uploadImage(file, 'restaurants');
        imageUrls.push(imageUrl);
      }
      req.body.images = imageUrls;
      if (!req.body.logoImage && imageUrls.length > 0) {
        req.body.logoImage = imageUrls[0];
      }
    }

    // Create restaurant
    const restaurant = await Restaurant.create(req.body);

    res.status(201).json({
      success: true,
      data: restaurant
    });
  } catch (error) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating restaurant',
      error: error.message
    });
  }
};

// @desc    Update restaurant
// @route   PUT /api/restaurants/:id
// @access  Private
export const updateRestaurant = async (req, res) => {
  try {
    let restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Check if user is owner
    if (restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this restaurant'
      });
    }

    // Process uploaded images if any
    if (req.files && req.files.length > 0) {
      const newImageUrls = [];
      for (const file of req.files) {
        const imageUrl = await azureStorage.uploadImage(file, 'restaurants');
        newImageUrls.push(imageUrl);
      }

      // Add to existing images or replace if specified
      if (req.body.replaceImages === 'true') {
        // If replacing images, delete old ones from Azure
        for (const oldImageUrl of restaurant.images) {
          await azureStorage.deleteImage(oldImageUrl);
        }
        req.body.images = newImageUrls;
      } else {
        req.body.images = [...(restaurant.images || []), ...newImageUrls];
      }

      // Update logo image if specified
      if (req.body.useAsLogo === 'true' && newImageUrls.length > 0) {
        req.body.logoImage = newImageUrls[0];
      }
    }

    restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: restaurant
    });
  } catch (error) {
    console.error('Error updating restaurant:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating restaurant',
      error: error.message
    });
  }
};

// @desc    Delete restaurant
// @route   DELETE /api/restaurants/:id
// @access  Private
export const deleteRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Check if user is owner
    if (restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this restaurant'
      });
    }

    // Delete all images from Azure Blob Storage
    if (restaurant.images && restaurant.images.length > 0) {
      for (const imageUrl of restaurant.images) {
        await azureStorage.deleteImage(imageUrl);
      }
    }

    if (restaurant.logoImage) {
      await azureStorage.deleteImage(restaurant.logoImage);
    }

    // Get all food items for this restaurant
    const dishes = await Dish.find({ restaurant: restaurant._id });

    // Delete all food images
    for (const food of dishes) {
      if (food.images && food.images.length > 0) {
        for (const imageUrl of food.images) {
          await azureStorage.deleteImage(imageUrl);
        }
      }
    }

    // Delete all food categories and items associated with this restaurant
    await DishCategory.deleteMany({ restaurant: restaurant._id });
    await Dish.deleteMany({ restaurant: restaurant._id });

    // Delete the restaurant
    await restaurant.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Restaurant deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting restaurant:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting restaurant',
      error: error.message
    });
  }
};

// @desc    Upload restaurant images
// @route   POST /api/restaurants/:id/images
// @access  Private
export const uploadRestaurantImages = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Check if user is owner
    if (restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this restaurant'
      });
    }

    // Process uploaded images
    if (req.files && req.files.length > 0) {
      const newImageUrls = [];
      for (const file of req.files) {
        const imageUrl = await azureStorage.uploadImage(file, 'restaurants');
        newImageUrls.push(imageUrl);
      }

      // Add to existing images
      const updatedImages = [...(restaurant.images || []), ...newImageUrls];

      // Update restaurant with new images
      await Restaurant.findByIdAndUpdate(
        req.params.id,
        { images: updatedImages },
        { new: true }
      );

      res.status(200).json({
        success: true,
        message: 'Images uploaded successfully',
        images: newImageUrls
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'No images provided'
      });
    }
  } catch (error) {
    console.error('Error uploading restaurant images:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading restaurant images',
      error: error.message
    });
  }
};

// @desc    Delete restaurant image
// @route   DELETE /api/restaurants/:id/images
// @access  Private
export const deleteRestaurantImage = async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Image URL is required'
      });
    }

    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    // Check if user is owner
    if (restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this restaurant'
      });
    }

    // Check if the image exists in the restaurant's images
    if (!restaurant.images.includes(imageUrl)) {
      return res.status(404).json({
        success: false,
        message: 'Image not found in restaurant'
      });
    }

    // Delete image from Azure storage
    await azureStorage.deleteImage(imageUrl);

    // Remove image from restaurant
    const updatedImages = restaurant.images.filter(img => img !== imageUrl);

    // Update logo image if it's the deleted one
    let logoImageUpdate = {};
    if (restaurant.logoImage === imageUrl) {
      logoImageUpdate = {
        logoImage: updatedImages.length > 0 ? updatedImages[0] : null
      };
    }

    // Update restaurant with new images
    await Restaurant.findByIdAndUpdate(
      req.params.id,
      {
        images: updatedImages,
        ...logoImageUpdate
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting restaurant image:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting restaurant image',
      error: error.message
    });
  }
};