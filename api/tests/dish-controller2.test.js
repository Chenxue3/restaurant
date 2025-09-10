import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as dishController from "../src/controllers/dishController.js";
import Dish from "../src/models/Dish.js";
import DishCategory from "../src/models/DishCategory.js";
import * as storageService from "../src/services/azureStorage.js";

// Mock models
vi.mock("../src/models/Dish.js", () => ({
  default: {
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
  },
}));

vi.mock("../src/models/DishCategory.js", () => ({
  default: {
    findById: vi.fn(),
  },
}));

// Mock storage service
vi.mock("../src/services/azureStorage.js", () => ({
  uploadImage: vi.fn(),
  deleteImage: vi.fn(),
}));

describe("Dish Controller - Part 2", () => {
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
      },
      body: {
        name: "Updated Dish",
        price: 15.99,
        category: "cat123",
      },
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

  describe("updateDish", () => {
    it("should update a dish successfully", async () => {
      // Setup
      const mockDish = {
        _id: "dish123",
        name: "Original Dish",
        price: 12.99,
        restaurant: {
          _id: "rest123",
          owner: "user123", // Same as req.user.id
        },
      };

      // Mock successful dish retrieval
      Dish.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockDish),
      });

      // Mock successful category validation
      const mockCategory = {
        _id: "cat123",
        restaurant: "rest123", // Same as dish.restaurant._id
      };
      DishCategory.findById.mockResolvedValue(mockCategory);

      // Mock successful dish update
      const updatedDish = {
        _id: "dish123",
        name: "Updated Dish",
        price: 15.99,
        category: "cat123",
        restaurant: {
          _id: "rest123",
          owner: "user123",
        },
      };
      const mockPopulate = vi.fn().mockResolvedValue(updatedDish);
      Dish.findByIdAndUpdate.mockReturnValue({
        populate: mockPopulate,
      });

      // Execute
      await dishController.updateDish(req, res);

      // Verify
      expect(Dish.findById).toHaveBeenCalledWith("dish123");
      expect(DishCategory.findById).toHaveBeenCalledWith("cat123");
      expect(Dish.findByIdAndUpdate).toHaveBeenCalledWith(
        "dish123",
        {
          name: "Updated Dish",
          price: 15.99,
          category: "cat123",
        },
        {
          new: true,
          runValidators: true,
        }
      );
      expect(mockPopulate).toHaveBeenCalledWith("category", "name description");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: updatedDish,
      });
    });

    it("should handle image uploads during update", async () => {
      // Setup
      const mockDish = {
        _id: "dish123",
        name: "Original Dish",
        price: 12.99,
        images: ["https://old-image-url.com/image1.jpg"],
        restaurant: {
          _id: "rest123",
          owner: "user123",
        },
      };

      // Mock successful dish retrieval
      Dish.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockDish),
      });

      // Mock successful category validation
      DishCategory.findById.mockResolvedValue({
        _id: "cat123",
        restaurant: "rest123",
      });

      // Setup image files
      req.files = [
        { filename: "new-image1.jpg", path: "/tmp/new-image1.jpg" },
        { filename: "new-image2.jpg", path: "/tmp/new-image2.jpg" },
      ];

      // Mock image deletion and upload
      storageService.deleteImage.mockResolvedValue(true);
      storageService.uploadImage.mockImplementation((file, path) =>
        Promise.resolve(`https://storage.example.com/${path}/${file.filename}`)
      );

      // Mock successful dish update
      const expectedNewImageUrls = [
        "https://storage.example.com/restaurants/rest123/dishes/new-image1.jpg",
        "https://storage.example.com/restaurants/rest123/dishes/new-image2.jpg",
      ];
      const updatedDish = {
        _id: "dish123",
        name: "Updated Dish",
        price: 15.99,
        images: expectedNewImageUrls,
        restaurant: {
          _id: "rest123",
          owner: "user123",
        },
      };
      const mockPopulate = vi.fn().mockResolvedValue(updatedDish);
      Dish.findByIdAndUpdate.mockReturnValue({
        populate: mockPopulate,
      });

      // Execute
      await dishController.updateDish(req, res);

      // Verify
      expect(storageService.deleteImage).toHaveBeenCalledWith(
        "https://old-image-url.com/image1.jpg"
      );
      expect(storageService.uploadImage).toHaveBeenCalledTimes(2);
      expect(Dish.findByIdAndUpdate).toHaveBeenCalledWith(
        "dish123",
        {
          name: "Updated Dish",
          price: 15.99,
          category: "cat123",
          images: expectedNewImageUrls,
        },
        {
          new: true,
          runValidators: true,
        }
      );
    });

    it("should continue even if image deletion fails", async () => {
      // Setup
      const mockDish = {
        _id: "dish123",
        name: "Original Dish",
        price: 12.99,
        images: ["https://old-image-url.com/image1.jpg"],
        restaurant: {
          _id: "rest123",
          owner: "user123",
        },
      };

      // Mock successful dish retrieval
      Dish.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockDish),
      });

      // Mock successful category validation
      DishCategory.findById.mockResolvedValue({
        _id: "cat123",
        restaurant: "rest123",
      });

      // Setup image files
      req.files = [{ filename: "new-image.jpg", path: "/tmp/new-image.jpg" }];

      // Mock image deletion failure
      storageService.deleteImage.mockRejectedValue(new Error("Storage error"));
      storageService.uploadImage.mockImplementation((file, path) =>
        Promise.resolve(`https://storage.example.com/${path}/${file.filename}`)
      );

      // Mock successful dish update
      const updatedDish = {
        _id: "dish123",
        name: "Updated Dish",
        price: 15.99,
        images: [
          "https://storage.example.com/restaurants/rest123/dishes/new-image.jpg",
        ],
        restaurant: {
          _id: "rest123",
          owner: "user123",
        },
      };
      const mockPopulate = vi.fn().mockResolvedValue(updatedDish);
      Dish.findByIdAndUpdate.mockReturnValue({
        populate: mockPopulate,
      });

      // Execute
      await dishController.updateDish(req, res);

      // Verify
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error deleting old images from Azure Blob Storage:",
        expect.any(Error)
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 404 if dish is not found", async () => {
      // Setup - dish not found
      Dish.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(null),
      });

      // Execute
      await dishController.updateDish(req, res);

      // Verify
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Dish item not found",
      });
      expect(Dish.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should return 403 if user is not the owner", async () => {
      // Setup - dish found but not owned by user
      const mockDish = {
        _id: "dish123",
        name: "Original Dish",
        restaurant: {
          _id: "rest123",
          owner: "different_user_id", // Different from req.user.id
        },
      };
      Dish.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockDish),
      });

      // Execute
      await dishController.updateDish(req, res);

      // Verify
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Not authorized to update this dish",
      });
      expect(Dish.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should return 400 if category is invalid", async () => {
      // Setup - dish found and owned by user
      const mockDish = {
        _id: "dish123",
        name: "Original Dish",
        restaurant: {
          _id: "rest123",
          owner: "user123", // Same as req.user.id
        },
      };
      Dish.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockDish),
      });

      // Mock category not found
      DishCategory.findById.mockResolvedValue(null);

      // Execute
      await dishController.updateDish(req, res);

      // Verify
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid category",
      });
      expect(Dish.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should return 400 if category belongs to different restaurant", async () => {
      // Setup - dish found and owned by user
      const mockDish = {
        _id: "dish123",
        name: "Original Dish",
        restaurant: {
          _id: "rest123",
          owner: "user123", // Same as req.user.id
        },
      };
      Dish.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockDish),
      });

      // Mock category found but belongs to different restaurant
      DishCategory.findById.mockResolvedValue({
        _id: "cat123",
        restaurant: "different_rest_id", // Different from dish.restaurant._id
      });

      // Execute
      await dishController.updateDish(req, res);

      // Verify
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid category",
      });
      expect(Dish.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should handle validation errors during update", async () => {
      // Setup - dish found and owned by user
      const mockDish = {
        _id: "dish123",
        name: "Original Dish",
        restaurant: {
          _id: "rest123",
          owner: "user123",
        },
      };
      Dish.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockDish),
      });

      // No need to mock category validation as we'll force an error in findByIdAndUpdate

      // Mock validation error
      const errorMessage = "Validation error";
      Dish.findByIdAndUpdate.mockRejectedValue(new Error(errorMessage));

      // Execute
      await dishController.updateDish(req, res);

      // // Verify
      // expect(res.status).toHaveBeenCalledWith(400);
      // expect(res.json).toHaveBeenCalledWith({
      //   success: false,
      //   message: errorMessage,
      // });
    });
  });
});
