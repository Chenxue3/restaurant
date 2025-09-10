import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import OpenAI from "openai";
import { analyzeMenuImageFromOpenAI } from "../src/services/openai.js";

vi.mock("openai");

describe("OpenAI Utility Functions", () => {
  const mockApiKey = "test-api-key";
  const mockImageUrl = "https://example.com/menu.jpg";
  let mockCreateFn;

  beforeEach(() => {
    process.env.OPENAI_API_KEY = mockApiKey;
    mockCreateFn = vi.fn();
    OpenAI.mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreateFn,
        },
      },
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete process.env.OPENAI_API_KEY;
  });

  describe("getOpenAIClient (through analyzeMenuImageFromOpenAI)", () => {
    it("should throw error when API key is not configured", async () => {
      delete process.env.OPENAI_API_KEY;
      await expect(analyzeMenuImageFromOpenAI(mockImageUrl)).rejects.toThrow(
        "OpenAI API key is not configured"
      );
    });

    it("should initialize OpenAI client with correct API key", async () => {
      mockCreateFn.mockResolvedValue({
        choices: [
          {
            message: {
              tool_calls: [
                {
                  function: {
                    arguments: JSON.stringify({
                      categories: [],
                    }),
                  },
                },
              ],
            },
          },
        ],
      });

      await analyzeMenuImageFromOpenAI(mockImageUrl);
      expect(OpenAI).toHaveBeenCalledWith({ apiKey: mockApiKey });
    });
  });

  describe("analyzeMenuImageFromOpenAI", () => {
    const mockSuccessResponse = {
      choices: [
        {
          message: {
            tool_calls: [
              {
                function: {
                  arguments: JSON.stringify({
                    restaurant_name: "Test Restaurant",
                    menu_type: "Dinner",
                    categories: [
                      {
                        name: "Appetizers",
                        items: [
                          {
                            name: "Spring Rolls",
                            description:
                              "Fresh vegetables wrapped in rice paper",
                            price: "$8.99",
                            attributes: ["vegetarian"],
                            allergens: ["gluten"],
                            flavor_profile: "Fresh and light",
                            texture: "Crispy",
                          },
                        ],
                      },
                    ],
                  }),
                },
              },
            ],
          },
        },
      ],
    };

    beforeEach(() => {
      mockCreateFn.mockResolvedValue(mockSuccessResponse);
    });

    it("should successfully analyze menu image with default language", async () => {
      const result = await analyzeMenuImageFromOpenAI(mockImageUrl);
      expect(result).toHaveProperty("categories");
      expect(result.restaurant_name).toBe("Test Restaurant");
      expect(result.categories[0].items[0].name).toBe("Spring Rolls");
    });

    it("should handle Chinese language parameter correctly", async () => {
      await analyzeMenuImageFromOpenAI(mockImageUrl, "zh");
      expect(mockCreateFn).toHaveBeenCalled();
      const call = mockCreateFn.mock.calls[0][0];
      expect(call.messages[0].content).toContain("provide all content in zh");
    });

    it("should handle OpenAI API errors gracefully", async () => {
      mockCreateFn.mockRejectedValue(new Error("API Error"));
      await expect(analyzeMenuImageFromOpenAI(mockImageUrl)).rejects.toThrow(
        "API Error"
      );
    });

    it("should handle invalid response format from OpenAI", async () => {
      mockCreateFn.mockResolvedValue({
        choices: [
          {
            message: {}, // Missing tool_calls
          },
        ],
      });

      await expect(analyzeMenuImageFromOpenAI(mockImageUrl)).rejects.toThrow(
        "Structured data not returned from OpenAI"
      );
    });

    it("should pass correct parameters to OpenAI API", async () => {
      await analyzeMenuImageFromOpenAI(mockImageUrl);
      expect(mockCreateFn).toHaveBeenCalled();
      const call = mockCreateFn.mock.calls[0][0];

      expect(call.model).toBe("gpt-4.1-nano");
      expect(call.messages[1].content[1].image_url.url).toBe(mockImageUrl);
      expect(call.tool_choice).toBe("auto");
      expect(call.max_tokens).toBe(32768);
    });
  });
});
