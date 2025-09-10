import { expect, vi, describe, it, beforeEach, afterEach } from "vitest";
import { analyzeMenuImage } from "../src/controllers/scanMenuController.js";
import storage from "../src/services/azureStorage.js";
import * as openai from "../src/services/openai.js";
import { setupTestDB } from "./setup.js";

// Setup test database
setupTestDB();

// Mock services
vi.mock("../src/services/azureStorage.js", () => ({
  default: {
    uploadImage: vi.fn(),
  },
}));

vi.mock("../src/services/openai.js", () => ({
  translateMenuImageFromOpenAI: vi.fn(),
}));

describe("Scan Menu Controller", () => {
  let req, res;

  beforeEach(() => {
    req = {
      file: {
        filename: "menu.jpg",
        path: "/tmp/menu.jpg",
      },
      body: {},
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

  describe("analyzeMenuImage", () => {
    it("should analyze a menu image successfully", async () => {
      // Mock successful image upload
      const mockImageUrl =
        "https://storage.blob.core.windows.net/menus/menu.jpg";
      storage.uploadImage.mockResolvedValue(mockImageUrl);

      // Mock successful OpenAI analysis
      const mockMenuData = {
        categories: [
          {
            name: "Appetizers",
            items: [
              {
                name: "Mozzarella Sticks",
                price: "8.99",
                description: "Breaded mozzarella sticks with marinara sauce",
              },
              {
                name: "Chicken Wings",
                price: "12.99",
                description: "Buffalo or BBQ wings with blue cheese dip",
              },
            ],
          },
          {
            name: "Main Courses",
            items: [
              {
                name: "Spaghetti Carbonara",
                price: "15.99",
                description: "Classic carbonara with pancetta and parmesan",
              },
              {
                name: "Grilled Salmon",
                price: "19.99",
                description: "Grilled salmon with asparagus and lemon butter",
              },
            ],
          },
        ],
        restaurant: {
          name: "Italian Bistro",
          cuisine: "Italian",
        },
      };
      openai.translateMenuImageFromOpenAI.mockResolvedValue(mockMenuData);

      // Call the function
      await analyzeMenuImage(req, res);

      // Check if the storage upload was called correctly
      expect(storage.uploadImage).toHaveBeenCalledWith(req.file, "menus");

      // Check if OpenAI analysis was called correctly
      expect(openai.translateMenuImageFromOpenAI).toHaveBeenCalledWith(
        mockImageUrl,
        "en"
      );

      // Check response
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockMenuData,
      });
    });

    it("should use the specified language for analysis", async () => {
      // Set language in request body
      req.body.language = "zh";

      // Mock successful image upload
      const mockImageUrl =
        "https://storage.blob.core.windows.net/menus/menu.jpg";
      storage.uploadImage.mockResolvedValue(mockImageUrl);

      // Mock successful OpenAI analysis
      const mockMenuData = {
        categories: [
          {
            name: "Appetizers",
            items: [
              {
                name: "Fried Mozzarella Sticks",
                price: "8.99",
                description: "Fried mozzarella sticks with marinara sauce",
              },
              {
                name: "Chicken Wings",
                price: "12.99",
                description: "Buffalo or BBQ wings with blue cheese dip",
              },
            ],
          },
        ],
      };
      openai.translateMenuImageFromOpenAI.mockResolvedValue(mockMenuData);

      // Call the function
      await analyzeMenuImage(req, res);

      // Check if OpenAI analysis was called with Chinese language
      expect(openai.translateMenuImageFromOpenAI).toHaveBeenCalledWith(
        mockImageUrl,
        "zh"
      );

      // Check response
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockMenuData,
      });
    });

    it("should return 400 if no image is uploaded", async () => {
      // Set req.file to undefined to simulate no file uploaded
      req.file = undefined;

      // Call the function
      await analyzeMenuImage(req, res);

      // Check response
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Please upload a menu image",
      });

      // Make sure services were not called
      expect(storage.uploadImage).not.toHaveBeenCalled();
      expect(openai.translateMenuImageFromOpenAI).not.toHaveBeenCalled();
    });

    it("should handle errors from storage upload", async () => {
      // Mock failed image upload
      const errorMessage = "Storage error";
      storage.uploadImage.mockRejectedValue(new Error(errorMessage));

      // Call the function
      await analyzeMenuImage(req, res);

      // Check response
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Error translating menu image",
        error: errorMessage,
      });

      // Make sure OpenAI service was not called
      expect(openai.translateMenuImageFromOpenAI).not.toHaveBeenCalled();
    });

    it("should handle errors from OpenAI analysis", async () => {
      // Mock successful image upload
      const mockImageUrl =
        "https://storage.blob.core.windows.net/menus/menu.jpg";
      storage.uploadImage.mockResolvedValue(mockImageUrl);

      // Mock failed OpenAI analysis
      const errorMessage = "OpenAI API error";
      openai.translateMenuImageFromOpenAI.mockRejectedValue(
        new Error(errorMessage)
      );

      // Call the function
      await analyzeMenuImage(req, res);

      // Check response
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Error translating menu image",
        error: errorMessage,
      });
    });
  });
});
