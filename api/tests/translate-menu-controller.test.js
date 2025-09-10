import { expect, vi, describe, it, beforeEach, afterEach } from "vitest";
import { translateMenu } from "../src/controllers/translateMenuController.js";
import axios from "axios";
import { setupTestDB } from "./setup.js";

// Setup test database
setupTestDB();

// Mock axios
vi.mock("axios");

// Mock getOpenAIClient
vi.mock("../src/services/openai.js", () => ({
  getOpenAIClient: vi.fn().mockReturnValue({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: "Translated text" } }]
        })
      }
    }
  })
}));

describe("Translate Menu Controller", () => {
  let req, res;
  let originalEnv;

  beforeEach(() => {
    // Store original environment variables
    originalEnv = { ...process.env };

    // Set up mock API key
    process.env.OPENAI_API_KEY = "test-api-key";

    req = {
      body: {
        menu: {
          category1: {
            categoryInfo: {
              name: "Appetizers",
              description: "Starters",
            },
            dishItems: [
              {
                name: "Garlic Bread",
                description: "Bread with garlic",
                flavor_profile: "",
                texture: "",
              },
            ],
          },
        },
        language: "Chinese",
      },
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    // Mock console methods
    vi.spyOn(console, "error").mockImplementation(() => {});

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore original environment variables
    process.env = originalEnv;

    vi.clearAllMocks();
  });

  describe("translateMenu", () => {
    it("should return 400 if menu is missing", async () => {
      // Remove menu from request
      req.body.menu = undefined;

      // Call the function
      await translateMenu(req, res);

      // Check response
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Menu and language are required",
      });
    });

    it("should return 400 if language is missing", async () => {
      // Remove language from request
      req.body.language = undefined;

      // Call the function
      await translateMenu(req, res);

      // Check response
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Menu and language are required",
      });
    });

    it("should handle successful menu translation", async () => {
      // Create simplified mock menu
      req.body.menu = {
        category1: {
          categoryInfo: {
            name: "Test Category",
            description: "",
          },
          dishItems: [
            {
              name: "Test Dish",
              description: "",
            },
          ],
        },
      };

      // Mock axios to return translations
      axios.post.mockImplementation(() => {
        return Promise.resolve({
          data: {
            choices: [{ message: { content: "Translated text" } }],
          },
        });
      });

      // Call the function
      await translateMenu(req, res);

      // Check response is successful
      expect(res.json).toHaveBeenCalled();
      expect(res.json.mock.calls[0][0].success).toBe(true);
    });
  });
});
