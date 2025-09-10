import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as dishController from "../src/controllers/dishController.js";
import Dish from "../src/models/Dish.js";
import DishCategory from "../src/models/DishCategory.js";
import Restaurant from "../src/models/Restaurant.js";
import * as storageService from "../src/services/azureStorage.js";

// Mock models
vi.mock("../src/models/Dish.js", () => ({
  default: {
    find: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    countDocuments: vi.fn(),
    deleteOne: vi.fn(),
  },
}));

vi.mock("../src/models/DishCategory.js", () => ({
  default: {
    find: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    deleteOne: vi.fn(),
  },
}));

vi.mock("../src/models/Restaurant.js", () => ({
  default: {
    findOne: vi.fn(),
  },
}));

// Mock storage service
vi.mock("../src/services/azureStorage.js", () => ({
  uploadImage: vi.fn(),
  deleteImage: vi.fn(),
}));

describe("Dish Controller", () => {
  let req;
  let res;
  let consoleSpy;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock console.error
    consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Setup mock request and response
    req = {
      params: {
        id: "dish123",
        restaurantId: "rest123",
      },
      query: {},
      body: {},
      user: {
        id: "user123",
      },
      files: [],
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe("getDishes", () => {
    it("should get all dishes for a restaurant", async () => {
      // Setup
      const mockDishes = [
        { _id: "dish1", name: "Dish 1", price: 10.99 },
        { _id: "dish2", name: "Dish 2", price: 12.99 },
      ];

      // Mock Dish.find().populate().sort()
      const mockSort = vi.fn().mockResolvedValue(mockDishes);
      const mockPopulate = vi.fn().mockReturnValue({ sort: mockSort });
      Dish.find.mockReturnValue({ populate: mockPopulate });

      // Execute
      await dishController.getDishes(req, res);

      // Verify
      expect(Dish.find).toHaveBeenCalledWith({ restaurant: "rest123" });
      expect(mockPopulate).toHaveBeenCalledWith("category", "name description");
      expect(mockSort).toHaveBeenCalledWith("displayOrder");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        data: mockDishes,
      });
    });

    it("should apply filters when provided", async () => {
      // Setup
      req.query = {
        category: "cat123",
        isVegetarian: "true",
        isVegan: "true",
        isGlutenFree: "true",
        minPrice: "10",
        maxPrice: "20",
        spicyLevel: "2",
        search: "spicy",
        sort: "price",
      };

      const mockDishes = [{ _id: "dish1", name: "Spicy Dish", price: 15.99 }];

      // Mock Dish.find().populate().sort()
      const mockSort = vi.fn().mockResolvedValue(mockDishes);
      const mockPopulate = vi.fn().mockReturnValue({ sort: mockSort });
      Dish.find.mockReturnValue({ populate: mockPopulate });

      // Execute
      await dishController.getDishes(req, res);

      // Verify
      expect(Dish.find).toHaveBeenCalledWith({
        restaurant: "rest123",
        category: "cat123",
        isVegetarian: true,
        isVegan: true,
        isGlutenFree: true,
        price: { $gte: 10, $lte: 20 },
        spicyLevel: 2,
        $text: { $search: "spicy" },
      });
      expect(mockPopulate).toHaveBeenCalledWith("category", "name description");
      expect(mockSort).toHaveBeenCalledWith("price");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 1,
        data: mockDishes,
      });
    });

    it("should handle price filters with only min or max value", async () => {
      // Setup with only minPrice
      req.query = { minPrice: "10" };

      const mockSort = vi.fn().mockResolvedValue([]);
      const mockPopulate = vi.fn().mockReturnValue({ sort: mockSort });
      Dish.find.mockReturnValue({ populate: mockPopulate });

      // Execute
      await dishController.getDishes(req, res);

      // Verify
      expect(Dish.find).toHaveBeenCalledWith({
        restaurant: "rest123",
        price: { $gte: 10 },
      });

      // Reset
      vi.clearAllMocks();

      // Setup with only maxPrice
      req.query = { maxPrice: "20" };

      Dish.find.mockReturnValue({ populate: mockPopulate });

      // Execute
      await dishController.getDishes(req, res);

      // Verify
      expect(Dish.find).toHaveBeenCalledWith({
        restaurant: "rest123",
        price: { $lte: 20 },
      });
    });

    it("should handle errors", async () => {
      // Setup
      const errorMessage = "Database error";
      Dish.find.mockImplementation(() => {
        throw new Error(errorMessage);
      });

      // Execute
      await dishController.getDishes(req, res);

      // Verify
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: errorMessage,
      });
    });
  });

  describe("getDish", () => {
    it("should get a dish by ID", async () => {
      // Setup
      const mockDish = {
        _id: "dish123",
        name: "Test Dish",
        price: 12.99,
      };

      // Mock Dish.findById().populate()
      const mockPopulate = vi.fn().mockResolvedValue(mockDish);
      Dish.findById.mockReturnValue({ populate: mockPopulate });

      // Execute
      await dishController.getDish(req, res);

      // Verify
      expect(Dish.findById).toHaveBeenCalledWith("dish123");
      expect(mockPopulate).toHaveBeenCalledWith("category", "name description");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockDish,
      });
    });

    it("should return 404 if dish not found", async () => {
      // Setup
      const mockPopulate = vi.fn().mockResolvedValue(null);
      Dish.findById.mockReturnValue({ populate: mockPopulate });

      // Execute
      await dishController.getDish(req, res);

      // Verify
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Dish item not found",
      });
    });

    it("should handle errors", async () => {
      // Setup
      const errorMessage = "Database error";
      Dish.findById.mockImplementation(() => {
        throw new Error(errorMessage);
      });

      // Execute
      await dishController.getDish(req, res);

      // Verify
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: errorMessage,
      });
    });
  });

  describe("createDish", () => {
    it("should create a new dish", async () => {
      // Setup
      const newDish = {
        name: "New Dish",
        description: "Delicious new dish",
        price: 15.99,
        category: "cat123",
      };
      req.body = newDish;

      // Mock successful restaurant ownership check
      const mockRestaurant = { _id: "rest123", owner: "user123" };
      Restaurant.findOne.mockResolvedValue(mockRestaurant);

      // Mock successful category validation
      const mockCategory = { _id: "cat123", restaurant: "rest123" };
      DishCategory.findById.mockResolvedValue(mockCategory);

      // Mock successful dish creation
      const mockCreatedDish = {
        _id: "dish123",
        ...newDish,
        restaurant: "rest123",
      };
      Dish.create.mockResolvedValue(mockCreatedDish);

      // Execute
      await dishController.createDish(req, res);

      // Verify
      expect(Restaurant.findOne).toHaveBeenCalledWith({
        _id: "rest123",
        owner: "user123",
      });
      expect(DishCategory.findById).toHaveBeenCalledWith("cat123");
      expect(Dish.create).toHaveBeenCalledWith({
        ...newDish,
        restaurant: "rest123",
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockCreatedDish,
      });
    });

    it("should handle image uploads", async () => {
      // Setup
      req.body = {
        name: "New Dish",
        price: 15.99,
        category: "cat123",
      };
      req.files = [
        { filename: "image1.jpg", path: "/tmp/image1.jpg" },
        { filename: "image2.jpg", path: "/tmp/image2.jpg" },
      ];

      // Mock successful restaurant ownership check
      Restaurant.findOne.mockResolvedValue({
        _id: "rest123",
        owner: "user123",
      });

      // Mock successful category validation
      DishCategory.findById.mockResolvedValue({
        _id: "cat123",
        restaurant: "rest123",
      });

      // Mock successful image uploads
      storageService.uploadImage.mockImplementation((file, path) =>
        Promise.resolve(`https://storage.example.com/${path}/${file.filename}`)
      );

      // Mock successful dish creation
      const expectedImageUrls = [
        "https://storage.example.com/restaurants/rest123/dishes/image1.jpg",
        "https://storage.example.com/restaurants/rest123/dishes/image2.jpg",
      ];
      const mockCreatedDish = {
        _id: "dish123",
        name: "New Dish",
        price: 15.99,
        category: "cat123",
        restaurant: "rest123",
        images: expectedImageUrls,
      };
      Dish.create.mockResolvedValue(mockCreatedDish);

      // Execute
      await dishController.createDish(req, res);

      // Verify
      expect(storageService.uploadImage).toHaveBeenCalledTimes(2);
      expect(Dish.create).toHaveBeenCalledWith({
        name: "New Dish",
        price: 15.99,
        category: "cat123",
        restaurant: "rest123",
        images: expectedImageUrls,
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockCreatedDish,
      });
    });

    it("should return 403 if user is not authorized", async () => {
      // Setup - restaurant not found or not owned by user
      Restaurant.findOne.mockResolvedValue(null);

      // Execute
      await dishController.createDish(req, res);

      // Verify
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Not authorized to add dishes to this restaurant",
      });
      expect(Dish.create).not.toHaveBeenCalled();
    });

    it("should return 400 if category is invalid", async () => {
      // Setup
      req.body = { category: "cat123" };

      // Mock successful restaurant ownership check
      Restaurant.findOne.mockResolvedValue({
        _id: "rest123",
        owner: "user123",
      });

      // Mock category not found
      DishCategory.findById.mockResolvedValue(null);

      // Execute
      await dishController.createDish(req, res);

      // Verify
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid category",
      });
      expect(Dish.create).not.toHaveBeenCalled();
    });

    it("should return 400 if category belongs to different restaurant", async () => {
      // Setup
      req.body = { category: "cat123" };

      // Mock successful restaurant ownership check
      Restaurant.findOne.mockResolvedValue({
        _id: "rest123",
        owner: "user123",
      });

      // Mock category belonging to different restaurant
      DishCategory.findById.mockResolvedValue({
        _id: "cat123",
        restaurant: "rest456", // Different restaurant
      });

      // Execute
      await dishController.createDish(req, res);

      // Verify
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid category",
      });
      expect(Dish.create).not.toHaveBeenCalled();
    });

    it("should handle errors during dish creation", async () => {
      // Setup
      req.body = {
        name: "New Dish",
        category: "cat123",
      }; // Missing required price field

      // Mock successful restaurant ownership check
      Restaurant.findOne.mockResolvedValue({
        _id: "rest123",
        owner: "user123",
      });

      // Mock successful category validation
      DishCategory.findById.mockResolvedValue({
        _id: "cat123",
        restaurant: "rest123",
      });

      // Mock validation error
      const errorMessage = "Price is required";
      Dish.create.mockRejectedValue(new Error(errorMessage));

      // Execute
      await dishController.createDish(req, res);

      // Verify
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: errorMessage,
      });
    });
  });

  describe("getCategories", () => {
    it("should get all categories for a restaurant", async () => {
      // Setup
      const mockCategories = [
        { _id: "cat1", name: "Category 1" },
        { _id: "cat2", name: "Category 2" },
      ];

      // Mock DishCategory.find().sort()
      const mockSort = vi.fn().mockResolvedValue(mockCategories);
      DishCategory.find.mockReturnValue({ sort: mockSort });

      // Execute
      await dishController.getCategories(req, res);

      // Verify
      expect(DishCategory.find).toHaveBeenCalledWith({ restaurant: "rest123" });
      expect(mockSort).toHaveBeenCalledWith("displayOrder");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        count: 2,
        data: mockCategories,
      });
    });

    it("should handle errors", async () => {
      // Setup
      const errorMessage = "Database error";
      DishCategory.find.mockImplementation(() => {
        throw new Error(errorMessage);
      });

      // Execute
      await dishController.getCategories(req, res);

      // Verify
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: errorMessage,
      });
    });
  });

  describe("createCategory", () => {
    it("should create a new category", async () => {
      // Setup
      const newCategory = {
        name: "New Category",
        description: "A new category",
      };
      req.body = newCategory;

      // Mock successful restaurant ownership check
      Restaurant.findOne.mockResolvedValue({
        _id: "rest123",
        owner: "user123",
      });

      // Mock successful category creation
      const mockCreatedCategory = {
        _id: "cat123",
        ...newCategory,
        restaurant: "rest123",
      };
      DishCategory.create.mockResolvedValue(mockCreatedCategory);

      // Execute
      await dishController.createCategory(req, res);

      // Verify
      expect(Restaurant.findOne).toHaveBeenCalledWith({
        _id: "rest123",
        owner: "user123",
      });
      expect(DishCategory.create).toHaveBeenCalledWith({
        ...newCategory,
        restaurant: "rest123",
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockCreatedCategory,
      });
    });

    it("should return 403 if user is not authorized", async () => {
      // Setup - restaurant not found or not owned by user
      Restaurant.findOne.mockResolvedValue(null);

      // Execute
      await dishController.createCategory(req, res);

      // Verify
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Not authorized to add categories to this restaurant",
      });
      expect(DishCategory.create).not.toHaveBeenCalled();
    });

    it("should handle errors during category creation", async () => {
      // Setup
      req.body = {}; // Missing required name field

      // Mock successful restaurant ownership check
      Restaurant.findOne.mockResolvedValue({
        _id: "rest123",
        owner: "user123",
      });

      // Mock validation error
      const errorMessage = "Category name is required";
      DishCategory.create.mockRejectedValue(new Error(errorMessage));

      // Execute
      await dishController.createCategory(req, res);

      // Verify
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: errorMessage,
      });
    });
  });
});
