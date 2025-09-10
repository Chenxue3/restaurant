import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as dishController from "../src/controllers/dishController.js";
import Dish from "../src/models/Dish.js";
import DishCategory from "../src/models/DishCategory.js";
import * as storageService from "../src/services/azureStorage.js";

// Mock models
vi.mock("../src/models/Dish.js", () => ({
  default: {
    findById: vi.fn(),
    countDocuments: vi.fn(),
    deleteOne: vi.fn(),
  },
}));

vi.mock("../src/models/DishCategory.js", () => ({
  default: {
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn(),
    deleteOne: vi.fn(),
  },
}));

// Mock storage service
vi.mock("../src/services/azureStorage.js", () => ({
  deleteImage: vi.fn(),
}));

describe("Dish Controller - Part 3", () => {
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
      user: {
        id: "user123",
      },
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe("deleteDish", () => {
    it("should delete a dish successfully", async () => {
      // Setup
      const mockDish = {
        _id: "dish123",
        name: "Test Dish",
        images: [
          "https://example.com/image1.jpg",
          "https://example.com/image2.jpg",
        ],
        restaurant: {
          _id: "rest123",
          owner: "user123", // Same as req.user.id
        },
        deleteOne: vi.fn().mockResolvedValue(true),
      };

      // Mock successful dish retrieval
      Dish.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockDish),
      });

      // Mock successful image deletion
      storageService.deleteImage.mockResolvedValue(true);

      // Execute
      await dishController.deleteDish(req, res);

      // Verify
      expect(Dish.findById).toHaveBeenCalledWith("dish123");
      expect(storageService.deleteImage).toHaveBeenCalledTimes(2);
      expect(mockDish.deleteOne).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Dish item deleted successfully",
      });
    });

    it("should continue even if image deletion fails", async () => {
      // Setup
      const mockDish = {
        _id: "dish123",
        name: "Test Dish",
        images: ["https://example.com/image1.jpg"],
        restaurant: {
          _id: "rest123",
          owner: "user123",
        },
        deleteOne: vi.fn().mockResolvedValue(true),
      };

      Dish.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockDish),
      });

      // Mock image deletion failure
      storageService.deleteImage.mockRejectedValue(new Error("Storage error"));

      // Execute
      await dishController.deleteDish(req, res);

      // Verify
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error deleting images from Azure Blob Storage:",
        expect.any(Error)
      );
      expect(mockDish.deleteOne).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should return 404 if dish is not found", async () => {
      // Setup - dish not found
      Dish.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(null),
      });

      // Execute
      await dishController.deleteDish(req, res);

      // Verify
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Dish item not found",
      });
      expect(storageService.deleteImage).not.toHaveBeenCalled();
    });

    it("should return 403 if user is not the owner", async () => {
      // Setup - dish found but not owned by user
      const mockDish = {
        _id: "dish123",
        name: "Test Dish",
        restaurant: {
          _id: "rest123",
          owner: "different_user_id", // Different from req.user.id
        },
      };

      Dish.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockDish),
      });

      // Execute
      await dishController.deleteDish(req, res);

      // Verify
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Not authorized to delete this dish",
      });
      expect(storageService.deleteImage).not.toHaveBeenCalled();
    });

    it("should handle errors during deletion", async () => {
      // Setup - dish found and owned by user
      const mockDish = {
        _id: "dish123",
        name: "Test Dish",
        images: [],
        restaurant: {
          _id: "rest123",
          owner: "user123",
        },
        deleteOne: vi.fn().mockRejectedValue(new Error("Database error")),
      };

      Dish.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockDish),
      });

      // Execute
      await dishController.deleteDish(req, res);

      // Verify
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Database error",
      });
    });
  });

  describe("updateCategory", () => {
    it("should update a category successfully", async () => {
      // Setup
      req.body = {
        name: "Updated Category",
        description: "Updated description",
      };

      // Mock successful category retrieval
      const mockCategory = {
        _id: "cat123",
        name: "Original Category",
        restaurant: {
          _id: "rest123",
          owner: "user123", // Same as req.user.id
        },
      };
      DishCategory.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockCategory),
      });

      // Mock successful category update
      const updatedCategory = {
        _id: "cat123",
        name: "Updated Category",
        description: "Updated description",
      };
      DishCategory.findByIdAndUpdate.mockResolvedValue(updatedCategory);

      // Execute
      await dishController.updateCategory(req, res);

      // Verify
      expect(DishCategory.findById).toHaveBeenCalledWith("dish123");
      expect(DishCategory.findByIdAndUpdate).toHaveBeenCalledWith(
        "dish123",
        {
          name: "Updated Category",
          description: "Updated description",
        },
        {
          new: true,
          runValidators: true,
        }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: updatedCategory,
      });
    });

    it("should return 404 if category is not found", async () => {
      // Setup - category not found
      DishCategory.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(null),
      });

      // Execute
      await dishController.updateCategory(req, res);

      // Verify
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Category not found",
      });
      expect(DishCategory.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should return 403 if user is not the owner", async () => {
      // Setup - category found but not owned by user
      const mockCategory = {
        _id: "cat123",
        name: "Original Category",
        restaurant: {
          _id: "rest123",
          owner: "different_user_id", // Different from req.user.id
        },
      };
      DishCategory.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockCategory),
      });

      // Execute
      await dishController.updateCategory(req, res);

      // Verify
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Not authorized to update this category",
      });
      expect(DishCategory.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should handle errors during update", async () => {
      // Setup - category found and owned by user
      const mockCategory = {
        _id: "cat123",
        name: "Original Category",
        restaurant: {
          _id: "rest123",
          owner: "user123", // Same as req.user.id
        },
      };
      DishCategory.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockCategory),
      });

      // Mock update error
      const errorMessage = "Database error";
      DishCategory.findByIdAndUpdate.mockRejectedValue(new Error(errorMessage));

      // Execute
      await dishController.updateCategory(req, res);

      // Verify
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: errorMessage,
      });
    });
  });

  describe("deleteCategory", () => {
    it("should delete a category successfully", async () => {
      // Setup
      // Mock successful category retrieval
      const mockCategory = {
        _id: "cat123",
        name: "Test Category",
        restaurant: {
          _id: "rest123",
          owner: "user123", // Same as req.user.id
        },
        deleteOne: vi.fn().mockResolvedValue(true),
      };
      DishCategory.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockCategory),
      });

      // Mock no dishes in category
      Dish.countDocuments.mockResolvedValue(0);

      // Execute
      await dishController.deleteCategory(req, res);

      // Verify
      expect(DishCategory.findById).toHaveBeenCalledWith("dish123");
      expect(Dish.countDocuments).toHaveBeenCalledWith({ category: "cat123" });
      expect(mockCategory.deleteOne).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Category deleted successfully",
      });
    });

    it("should return 404 if category is not found", async () => {
      // Setup - category not found
      DishCategory.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(null),
      });

      // Execute
      await dishController.deleteCategory(req, res);

      // Verify
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Category not found",
      });
      expect(Dish.countDocuments).not.toHaveBeenCalled();
    });

    it("should return 403 if user is not the owner", async () => {
      // Setup - category found but not owned by user
      const mockCategory = {
        _id: "cat123",
        name: "Test Category",
        restaurant: {
          _id: "rest123",
          owner: "different_user_id", // Different from req.user.id
        },
      };
      DishCategory.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockCategory),
      });

      // Execute
      await dishController.deleteCategory(req, res);

      // Verify
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Not authorized to delete this category",
      });
      expect(Dish.countDocuments).not.toHaveBeenCalled();
    });

    it("should return 400 if category has dishes", async () => {
      // Setup - category found and owned by user
      const mockCategory = {
        _id: "cat123",
        name: "Test Category",
        restaurant: {
          _id: "rest123",
          owner: "user123", // Same as req.user.id
        },
      };
      DishCategory.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockCategory),
      });

      // Mock dishes found in category
      Dish.countDocuments.mockResolvedValue(5); // 5 dishes in this category

      // Execute
      await dishController.deleteCategory(req, res);

      // Verify
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message:
          "Cannot delete category with dishes. Move or delete dishes first.",
      });
      expect(DishCategory.deleteOne).not.toHaveBeenCalled();
    });

    it("should handle errors during deletion", async () => {
      // Setup - category found and owned by user
      const mockCategory = {
        _id: "cat123",
        name: "Test Category",
        restaurant: {
          _id: "rest123",
          owner: "user123", // Same as req.user.id
        },
        deleteOne: vi.fn().mockRejectedValue(new Error("Database error")),
      };
      DishCategory.findById.mockReturnValue({
        populate: vi.fn().mockResolvedValue(mockCategory),
      });

      // Mock no dishes in category
      Dish.countDocuments.mockResolvedValue(0);

      // Execute
      await dishController.deleteCategory(req, res);

      // Verify
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Database error",
      });
    });
  });
});
