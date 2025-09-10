import { expect, vi, describe, it, beforeEach, afterEach } from "vitest";
import {
  analyzeMenuImage,
  createDishesFromAnalysis,
} from "../src/controllers/menuAnalysisController.js";
import Restaurant from "../src/models/Restaurant.js";
import DishCategory from "../src/models/DishCategory.js";
import Dish from "../src/models/Dish.js";
import storage from "../src/services/azureStorage.js";
import * as openai from "../src/services/openai.js";
import { setupTestDB, testUser } from "./setup.js";
import mongoose from "mongoose";

// Setup test database
setupTestDB();

// Mock modules
vi.mock("../src/services/azureStorage.js", () => ({
  default: {
    uploadImage: vi.fn(),
  },
}));

vi.mock("../src/services/openai.js", () => ({
  translateMenuImageFromOpenAI: vi.fn(),
}));

describe("Menu Analysis Controller", () => {
  let req, res, restaurantId;

  beforeEach(() => {
    restaurantId = new mongoose.Types.ObjectId().toString();

    req = {
      params: { restaurantId },
      user: { _id: testUser._id },
      file: { path: "test/path/to/image.jpg" },
      body: { language: "en" },
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    // Reset mocks
    vi.clearAllMocks();
  });

  describe("analyzeMenuImage", () => {
    it("should return 404 if restaurant not found", async () => {
      // Mock restaurant findById to return null
      Restaurant.findById = vi.fn().mockResolvedValue(null);

      await analyzeMenuImage(req, res);

      expect(Restaurant.findById).toHaveBeenCalledWith(restaurantId);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Restaurant not found",
      });
    });

    it("should return 403 if user is not the owner", async () => {
      // Mock restaurant with different owner
      const restaurant = {
        _id: restaurantId,
        owner: new mongoose.Types.ObjectId().toString(),
      };

      Restaurant.findById = vi.fn().mockResolvedValue(restaurant);

      await analyzeMenuImage(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Not authorized to analyze menu for this restaurant",
      });
    });

    it("should return 400 if no file is uploaded", async () => {
      // Mock restaurant with correct owner
      const restaurant = {
        _id: restaurantId,
        owner: testUser._id,
      };

      Restaurant.findById = vi.fn().mockResolvedValue(restaurant);

      // Remove file from request
      req.file = null;

      await analyzeMenuImage(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Please upload a menu image",
      });
    });

    it("should analyze menu image and return data", async () => {
      // Mock restaurant with correct owner
      const restaurant = {
        _id: restaurantId,
        owner: testUser._id,
      };

      // Mock successful responses
      Restaurant.findById = vi.fn().mockResolvedValue(restaurant);
      storage.uploadImage.mockResolvedValue("https://example.com/image.jpg");

      const mockMenuData = {
        categories: [
          {
            name: "Appetizers",
            items: [{ name: "Spring Rolls", price: "$5.99" }],
          },
        ],
      };

      openai.translateMenuImageFromOpenAI.mockResolvedValue(mockMenuData);

      await analyzeMenuImage(req, res);

      expect(storage.uploadImage).toHaveBeenCalledWith(req.file, "menus");
      expect(openai.translateMenuImageFromOpenAI).toHaveBeenCalledWith(
        "https://example.com/image.jpg",
        "en"
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockMenuData,
      });
    });

    it("should handle errors properly", async () => {
      // Mock error
      const errorMessage = "Test error";
      Restaurant.findById = vi.fn().mockRejectedValue(new Error(errorMessage));

      // Mock console.error to avoid polluting test output
      const consoleSpy = vi.spyOn(console, "error").mockImplementation();

      await analyzeMenuImage(req, res);

      expect(consoleSpy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Error analyzing menu image",
        error: errorMessage,
      });

      consoleSpy.mockRestore();
    });
  });

  describe("createDishesFromAnalysis", () => {
    const mockMenuData = {
      categories: [
        {
          name: "Appetizers",
          items: [
            {
              name: "Spring Rolls",
              description: "Crispy vegetable rolls",
              price: "$5.99",
              attributes: ["vegetarian", "spicy"],
              allergens: ["gluten"],
              texture: "crunchy",
              flavor_profile: "savory",
            },
          ],
        },
      ],
    };

    beforeEach(() => {
      req.body = { menuData: mockMenuData };
    });

    it("should return 404 if restaurant not found", async () => {
      Restaurant.findById = vi.fn().mockResolvedValue(null);

      await createDishesFromAnalysis(req, res);

      expect(Restaurant.findById).toHaveBeenCalledWith(restaurantId);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Restaurant not found",
      });
    });

    it("should return 403 if user is not the owner", async () => {
      // Mock restaurant with different owner
      const restaurant = {
        _id: restaurantId,
        owner: new mongoose.Types.ObjectId().toString(),
      };

      Restaurant.findById = vi.fn().mockResolvedValue(restaurant);

      await createDishesFromAnalysis(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Not authorized to add dish items to this restaurant",
      });
    });

    it("should create dishes from analysis data with new categories", async () => {
      // Mock restaurant with correct owner
      const restaurant = {
        _id: restaurantId,
        owner: testUser._id,
      };

      Restaurant.findById = vi.fn().mockResolvedValue(restaurant);

      // Mock category not found (need to create a new one)
      DishCategory.findOne = vi.fn().mockResolvedValue(null);

      // Mock category creation
      const mockCategory = {
        _id: new mongoose.Types.ObjectId(),
        name: "Appetizers",
      };

      DishCategory.create = vi.fn().mockResolvedValue(mockCategory);

      // Mock dish creation
      const mockDish = {
        _id: new mongoose.Types.ObjectId(),
        name: "Spring Rolls",
      };

      Dish.create = vi.fn().mockResolvedValue(mockDish);

      await createDishesFromAnalysis(req, res);

      expect(DishCategory.findOne).toHaveBeenCalledWith({
        name: "Appetizers",
        restaurant: restaurantId,
      });

      expect(DishCategory.create).toHaveBeenCalledWith({
        name: "Appetizers",
        restaurant: restaurantId,
      });

      expect(Dish.create).toHaveBeenCalledWith({
        name: "Spring Rolls",
        description: "Crispy vegetable rolls",
        price: 5.99,
        restaurant: restaurantId,
        category: mockCategory._id,
        isVegetarian: true,
        isVegan: false,
        isGlutenFree: false,
        spicyLevel: 3,
        allergens: ["gluten"],
        texture: ["crunchy"],
        flavor_profile: "savory",
      });

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          categoriesCreated: 1,
          dishItemsCreated: 1,
          categories: [
            {
              category: "Appetizers",
              dishItems: ["Spring Rolls"],
            },
          ],
        },
      });
    });

    it("should create dishes from analysis data with existing categories", async () => {
      // Mock restaurant with correct owner
      const restaurant = {
        _id: restaurantId,
        owner: testUser._id,
      };

      Restaurant.findById = vi.fn().mockResolvedValue(restaurant);

      // Mock category found (use existing one)
      const mockCategory = {
        _id: new mongoose.Types.ObjectId(),
        name: "Appetizers",
      };

      DishCategory.findOne = vi.fn().mockResolvedValue(mockCategory);

      // Mock dish creation
      const mockDish = {
        _id: new mongoose.Types.ObjectId(),
        name: "Spring Rolls",
      };

      Dish.create = vi.fn().mockResolvedValue(mockDish);

      await createDishesFromAnalysis(req, res);

      expect(DishCategory.findOne).toHaveBeenCalledWith({
        name: "Appetizers",
        restaurant: restaurantId,
      });

      // Should not create a new category
      expect(DishCategory.create).not.toHaveBeenCalled();

      expect(Dish.create).toHaveBeenCalledWith({
        name: "Spring Rolls",
        description: "Crispy vegetable rolls",
        price: 5.99,
        restaurant: restaurantId,
        category: mockCategory._id,
        isVegetarian: true,
        isVegan: false,
        isGlutenFree: false,
        spicyLevel: 3,
        allergens: ["gluten"],
        texture: ["crunchy"],
        flavor_profile: "savory",
      });

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          categoriesCreated: 0,
          dishItemsCreated: 1,
          categories: [
            {
              category: "Appetizers",
              dishItems: ["Spring Rolls"],
            },
          ],
        },
      });
    });

    it("should handle errors properly", async () => {
      // Mock error
      const errorMessage = "Test error";
      Restaurant.findById = vi.fn().mockRejectedValue(new Error(errorMessage));

      // Mock console.error to avoid polluting test output
      const consoleSpy = vi.spyOn(console, "error").mockImplementation();

      await createDishesFromAnalysis(req, res);

      expect(consoleSpy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Error creating dishes from analysis",
        error: errorMessage,
      });

      consoleSpy.mockRestore();
    });
  });
});
