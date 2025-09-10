import { expect, vi, describe, it, beforeEach, afterEach } from "vitest";
import { generateDishImage } from "../src/controllers/dishImageController.js";
import * as openai from "../src/services/openai.js";
import { setupTestDB } from "./setup.js";

// Setup test database
setupTestDB();

// Mock openai service
vi.mock("../src/services/openai.js", () => ({
  genDishImg: vi.fn(),
}));

describe("Dish Image Controller", () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {
        dishName: "Spaghetti Carbonara",
        dishDescription: "Classic Italian pasta with eggs, cheese, pancetta, and black pepper",
      },
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    // Mock console.error to prevent logs during tests
    vi.spyOn(console, "error").mockImplementation(() => {});
    
    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("generateDishImage", () => {
    it("should generate a dish image successfully", async () => {
      // Mock successful image generation
      const mockImageData = {
        success: true,
        data: {
          image_url: "https://storage.blob.core.windows.net/dishes/dish1.jpg",
        },
      };
      openai.genDishImg.mockResolvedValue(mockImageData);

      // Call the function
      await generateDishImage(req, res);

      // Check if OpenAI genDishImg was called correctly
      expect(openai.genDishImg).toHaveBeenCalledWith(
        "Spaghetti Carbonara",
        "Classic Italian pasta with eggs, cheese, pancetta, and black pepper"
      );

      // Check response
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockImageData);
    });

    it("should work with dish name only (no description)", async () => {
      // Setup request with only dish name
      req.body = {
        dishName: "Spaghetti Carbonara",
      };

      // Mock successful image generation
      const mockImageData = {
        success: true,
        data: {
          image_url: "https://storage.blob.core.windows.net/dishes/dish1.jpg",
        },
      };
      openai.genDishImg.mockResolvedValue(mockImageData);

      // Call the function
      await generateDishImage(req, res);

      // Check if OpenAI genDishImg was called correctly with empty description
      expect(openai.genDishImg).toHaveBeenCalledWith(
        "Spaghetti Carbonara",
        ""
      );

      // Check response
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockImageData);
    });

    it("should return 400 if no dish name is provided", async () => {
      // Setup request with missing dish name
      req.body = {
        dishDescription: "A delicious Italian pasta dish",
      };

      // Call the function
      await generateDishImage(req, res);

      // Check response
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Please provide a dish name",
      });

      // Make sure OpenAI service was not called
      expect(openai.genDishImg).not.toHaveBeenCalled();
    });

    it("should return error if OpenAI image generation fails", async () => {
      // Mock failed image generation
      const mockErrorResponse = {
        success: false,
        message: "Failed to generate dish image: API Error",
      };
      openai.genDishImg.mockResolvedValue(mockErrorResponse);

      // Call the function
      await generateDishImage(req, res);

      // Check response
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(mockErrorResponse);
    });

    it("should handle unexpected errors during image generation", async () => {
      // Mock unexpected error
      const errorMessage = "Unexpected error";
      openai.genDishImg.mockRejectedValue(new Error(errorMessage));

      // Call the function
      await generateDishImage(req, res);

      // Check response
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Error generating dish image",
        error: errorMessage,
      });
    });
  });
}); 