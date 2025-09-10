import { expect, vi, describe, it, beforeEach, afterEach } from "vitest";
import {
  deleteRestaurant,
  uploadRestaurantImages,
  deleteRestaurantImage,
} from "../src/controllers/restaurantController.js";
import Restaurant from "../src/models/Restaurant.js";
import DishCategory from "../src/models/DishCategory.js";
import Dish from "../src/models/Dish.js";
import azureStorage from "../src/services/azureStorage.js";
import { setupTestDB, testUser } from "./setup.js";
import mongoose from "mongoose";

// Setup test database
setupTestDB();

// Mock models
vi.mock("../src/models/Restaurant.js");
vi.mock("../src/models/DishCategory.js");
vi.mock("../src/models/Dish.js");

// Mock storage service
vi.mock("../src/services/azureStorage.js", () => ({
  default: {
    uploadImage: vi.fn(),
    deleteImage: vi.fn(),
  },
}));

describe("Restaurant Controller - Part 2", () => {
  let req, res, restaurantId;

  beforeEach(() => {
    restaurantId = new mongoose.Types.ObjectId().toString();

    req = {
      params: { id: restaurantId },
      user: { _id: testUser._id, id: testUser._id },
      query: {},
      body: {},
      files: [],
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    // Mock console methods
    vi.spyOn(console, "log").mockImplementation();
    vi.spyOn(console, "error").mockImplementation();

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("deleteRestaurant", () => {
    it("should return 404 if restaurant is not found", async () => {
      Restaurant.findById = vi.fn().mockResolvedValue(null);

      await deleteRestaurant(req, res);

      expect(Restaurant.findById).toHaveBeenCalledWith(restaurantId);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Restaurant not found",
      });
    });

    it("should return 403 if user is not the owner", async () => {
      const mockRestaurant = {
        _id: restaurantId,
        name: "Test Restaurant",
        owner: new mongoose.Types.ObjectId().toString(),
      };

      Restaurant.findById = vi.fn().mockResolvedValue(mockRestaurant);

      await deleteRestaurant(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Not authorized to delete this restaurant",
      });
    });

    it("should delete a restaurant and all associated resources", async () => {
      const mockRestaurant = {
        _id: restaurantId,
        name: "Test Restaurant",
        owner: testUser._id,
        images: [
          "https://storage.com/image1.jpg",
          "https://storage.com/image2.jpg",
        ],
        logoImage: "https://storage.com/logo.jpg",
        deleteOne: vi.fn().mockResolvedValue(true),
      };

      Restaurant.findById = vi.fn().mockResolvedValue(mockRestaurant);

      const mockDishes = [
        {
          _id: "dish1",
          name: "Dish 1",
          images: ["https://storage.com/dish1.jpg"],
        },
        {
          _id: "dish2",
          name: "Dish 2",
          images: [
            "https://storage.com/dish2.jpg",
            "https://storage.com/dish2-2.jpg",
          ],
        },
      ];

      Dish.find = vi.fn().mockResolvedValue(mockDishes);

      DishCategory.deleteMany = vi.fn().mockResolvedValue({ deletedCount: 3 });
      Dish.deleteMany = vi.fn().mockResolvedValue({ deletedCount: 5 });

      await deleteRestaurant(req, res);

      // Should delete all restaurant images
      expect(azureStorage.deleteImage).toHaveBeenCalledWith(
        "https://storage.com/image1.jpg"
      );
      expect(azureStorage.deleteImage).toHaveBeenCalledWith(
        "https://storage.com/image2.jpg"
      );
      expect(azureStorage.deleteImage).toHaveBeenCalledWith(
        "https://storage.com/logo.jpg"
      );

      // Should delete all dish images
      expect(azureStorage.deleteImage).toHaveBeenCalledWith(
        "https://storage.com/dish1.jpg"
      );
      expect(azureStorage.deleteImage).toHaveBeenCalledWith(
        "https://storage.com/dish2.jpg"
      );
      expect(azureStorage.deleteImage).toHaveBeenCalledWith(
        "https://storage.com/dish2-2.jpg"
      );

      // Should delete all categories and dishes
      expect(DishCategory.deleteMany).toHaveBeenCalledWith({
        restaurant: restaurantId,
      });
      expect(Dish.deleteMany).toHaveBeenCalledWith({
        restaurant: restaurantId,
      });

      // Should delete the restaurant
      expect(mockRestaurant.deleteOne).toHaveBeenCalled();

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Restaurant deleted successfully",
      });
    });

    it("should handle errors", async () => {
      const errorMessage = "Database error";
      Restaurant.findById = vi.fn().mockRejectedValue(new Error(errorMessage));

      await deleteRestaurant(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Error deleting restaurant",
        error: errorMessage,
      });
    });
  });

  describe("uploadRestaurantImages", () => {
    it("should return 404 if restaurant is not found", async () => {
      Restaurant.findById = vi.fn().mockResolvedValue(null);

      await uploadRestaurantImages(req, res);

      expect(Restaurant.findById).toHaveBeenCalledWith(restaurantId);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Restaurant not found",
      });
    });

    it("should return 403 if user is not the owner", async () => {
      const mockRestaurant = {
        _id: restaurantId,
        name: "Test Restaurant",
        owner: new mongoose.Types.ObjectId().toString(),
      };

      Restaurant.findById = vi.fn().mockResolvedValue(mockRestaurant);

      await uploadRestaurantImages(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Not authorized to update this restaurant",
      });
    });

    it("should return 400 if no images are provided", async () => {
      const mockRestaurant = {
        _id: restaurantId,
        name: "Test Restaurant",
        owner: testUser._id,
      };

      Restaurant.findById = vi.fn().mockResolvedValue(mockRestaurant);

      // No files provided
      req.files = [];

      await uploadRestaurantImages(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "No images provided",
      });
    });

    it("should upload images and update the restaurant", async () => {
      const mockRestaurant = {
        _id: restaurantId,
        name: "Test Restaurant",
        owner: testUser._id,
        images: ["https://storage.com/existing.jpg"],
      };

      Restaurant.findById = vi.fn().mockResolvedValue(mockRestaurant);

      req.files = [{ filename: "new1.jpg" }, { filename: "new2.jpg" }];

      azureStorage.uploadImage
        .mockResolvedValueOnce("https://storage.com/new1.jpg")
        .mockResolvedValueOnce("https://storage.com/new2.jpg");

      const updatedRestaurant = {
        ...mockRestaurant,
        images: [
          "https://storage.com/existing.jpg",
          "https://storage.com/new1.jpg",
          "https://storage.com/new2.jpg",
        ],
      };

      Restaurant.findByIdAndUpdate = vi
        .fn()
        .mockResolvedValue(updatedRestaurant);

      await uploadRestaurantImages(req, res);

      expect(azureStorage.uploadImage).toHaveBeenCalledTimes(2);
      expect(azureStorage.uploadImage).toHaveBeenCalledWith(
        req.files[0],
        "restaurants"
      );
      expect(azureStorage.uploadImage).toHaveBeenCalledWith(
        req.files[1],
        "restaurants"
      );

      expect(Restaurant.findByIdAndUpdate).toHaveBeenCalledWith(
        restaurantId,
        {
          images: [
            "https://storage.com/existing.jpg",
            "https://storage.com/new1.jpg",
            "https://storage.com/new2.jpg",
          ],
        },
        { new: true }
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Images uploaded successfully",
        images: [
          "https://storage.com/new1.jpg",
          "https://storage.com/new2.jpg",
        ],
      });
    });

    it("should handle errors", async () => {
      const mockRestaurant = {
        _id: restaurantId,
        name: "Test Restaurant",
        owner: testUser._id,
      };

      Restaurant.findById = vi.fn().mockResolvedValue(mockRestaurant);

      req.files = [{ filename: "new.jpg" }];

      const errorMessage = "Storage error";
      azureStorage.uploadImage.mockRejectedValue(new Error(errorMessage));

      await uploadRestaurantImages(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Error uploading restaurant images",
        error: errorMessage,
      });
    });
  });

  describe("deleteRestaurantImage", () => {
    it("should return 400 if imageUrl is not provided", async () => {
      req.body = {}; // No imageUrl

      await deleteRestaurantImage(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Image URL is required",
      });
    });

    it("should return 404 if restaurant is not found", async () => {
      req.body = { imageUrl: "https://storage.com/image.jpg" };

      Restaurant.findById = vi.fn().mockResolvedValue(null);

      await deleteRestaurantImage(req, res);

      expect(Restaurant.findById).toHaveBeenCalledWith(restaurantId);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Restaurant not found",
      });
    });

    it("should return 403 if user is not the owner", async () => {
      req.body = { imageUrl: "https://storage.com/image.jpg" };

      const mockRestaurant = {
        _id: restaurantId,
        name: "Test Restaurant",
        owner: new mongoose.Types.ObjectId().toString(),
      };

      Restaurant.findById = vi.fn().mockResolvedValue(mockRestaurant);

      await deleteRestaurantImage(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Not authorized to update this restaurant",
      });
    });

    it("should return 404 if image is not found in restaurant", async () => {
      req.body = { imageUrl: "https://storage.com/nonexistent.jpg" };

      const mockRestaurant = {
        _id: restaurantId,
        name: "Test Restaurant",
        owner: testUser._id,
        images: ["https://storage.com/other.jpg"],
      };

      Restaurant.findById = vi.fn().mockResolvedValue(mockRestaurant);

      await deleteRestaurantImage(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Image not found in restaurant",
      });
    });

    it("should delete an image and update the restaurant", async () => {
      const imageUrl = "https://storage.com/image.jpg";
      req.body = { imageUrl };

      const mockRestaurant = {
        _id: restaurantId,
        name: "Test Restaurant",
        owner: testUser._id,
        images: ["https://storage.com/other.jpg", imageUrl],
      };

      Restaurant.findById = vi.fn().mockResolvedValue(mockRestaurant);

      const updatedRestaurant = {
        ...mockRestaurant,
        images: ["https://storage.com/other.jpg"],
      };

      Restaurant.findByIdAndUpdate = vi
        .fn()
        .mockResolvedValue(updatedRestaurant);

      await deleteRestaurantImage(req, res);

      expect(azureStorage.deleteImage).toHaveBeenCalledWith(imageUrl);

      expect(Restaurant.findByIdAndUpdate).toHaveBeenCalledWith(
        restaurantId,
        {
          images: ["https://storage.com/other.jpg"],
        },
        { new: true }
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Image deleted successfully",
      });
    });

    it("should update logoImage if deleted image was the logo", async () => {
      const imageUrl = "https://storage.com/logo.jpg";
      req.body = { imageUrl };

      const mockRestaurant = {
        _id: restaurantId,
        name: "Test Restaurant",
        owner: testUser._id,
        images: ["https://storage.com/other.jpg", imageUrl],
        logoImage: imageUrl,
      };

      Restaurant.findById = vi.fn().mockResolvedValue(mockRestaurant);

      const updatedRestaurant = {
        ...mockRestaurant,
        images: ["https://storage.com/other.jpg"],
        logoImage: "https://storage.com/other.jpg",
      };

      Restaurant.findByIdAndUpdate = vi
        .fn()
        .mockResolvedValue(updatedRestaurant);

      await deleteRestaurantImage(req, res);

      expect(Restaurant.findByIdAndUpdate).toHaveBeenCalledWith(
        restaurantId,
        {
          images: ["https://storage.com/other.jpg"],
          logoImage: "https://storage.com/other.jpg",
        },
        { new: true }
      );
    });

    it("should set logoImage to null if deleted image was the logo and no other images exist", async () => {
      const imageUrl = "https://storage.com/logo.jpg";
      req.body = { imageUrl };

      const mockRestaurant = {
        _id: restaurantId,
        name: "Test Restaurant",
        owner: testUser._id,
        images: [imageUrl],
        logoImage: imageUrl,
      };

      Restaurant.findById = vi.fn().mockResolvedValue(mockRestaurant);

      const updatedRestaurant = {
        ...mockRestaurant,
        images: [],
        logoImage: null,
      };

      Restaurant.findByIdAndUpdate = vi
        .fn()
        .mockResolvedValue(updatedRestaurant);

      await deleteRestaurantImage(req, res);

      expect(Restaurant.findByIdAndUpdate).toHaveBeenCalledWith(
        restaurantId,
        {
          images: [],
          logoImage: null,
        },
        { new: true }
      );
    });

    it("should handle errors", async () => {
      req.body = { imageUrl: "https://storage.com/image.jpg" };

      const errorMessage = "Database error";
      Restaurant.findById = vi.fn().mockRejectedValue(new Error(errorMessage));

      await deleteRestaurantImage(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Error deleting restaurant image",
        error: errorMessage,
      });
    });
  });
});
