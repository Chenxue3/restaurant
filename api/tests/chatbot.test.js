import request from "supertest";
import { describe, it, expect, vi } from "vitest";
import app from "../src/app.js";
import { setupTestDB } from "./setup.js";
import * as chatbotLogic from "../src/util/chatbotLogic.js";

// Setup database connection
setupTestDB();

// Mock the chatbot logic utilities
vi.mock("../src/util/chatbotLogic.js", () => ({
  checkTopicRelevanceUtility: vi.fn(),
  getAnswerUtility: vi.fn(),
}));

describe("Chatbot API", () => {
  // Reset mocks before each test
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // Test POST /api/chatbot/chat
  describe("POST /api/chatbot/chat", () => {
    it("should return a response for a relevant message", async () => {
      // Setup mocks
      chatbotLogic.checkTopicRelevanceUtility.mockResolvedValue({
        success: true,
        isRelevant: true,
      });

      chatbotLogic.getAnswerUtility.mockResolvedValue({
        success: true,
        data: "This is a test response about food.",
      });

      const message = "What are some good restaurants in Auckland?";

      const res = await request(app)
        .post("/api/chatbot/chat")
        .send({ message });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.response).toBe("This is a test response about food.");

      // Verify the mocks were called correctly
      expect(chatbotLogic.checkTopicRelevanceUtility).toHaveBeenCalledWith(
        message
      );
      expect(chatbotLogic.getAnswerUtility).toHaveBeenCalledWith(message, "zh");
    });

    it("should return a polite response for irrelevant messages", async () => {
      // Setup mocks
      chatbotLogic.checkTopicRelevanceUtility.mockResolvedValue({
        success: true,
        isRelevant: false,
      });

      const message = "What is the capital of France?";

      const res = await request(app)
        .post("/api/chatbot/chat")
        .send({ message });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.response).toContain(
        "only answer questions related to food"
      );

      // Verify that only the relevance check was called
      expect(chatbotLogic.checkTopicRelevanceUtility).toHaveBeenCalledWith(
        message
      );
      expect(chatbotLogic.getAnswerUtility).not.toHaveBeenCalled();
    });

    it("should return 400 for invalid input", async () => {
      const res = await request(app)
        .post("/api/chatbot/chat")
        .send({ message: "" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);

      // Verify that none of the logic was called
      expect(chatbotLogic.checkTopicRelevanceUtility).not.toHaveBeenCalled();
      expect(chatbotLogic.getAnswerUtility).not.toHaveBeenCalled();
    });

    it("should handle errors in the relevance check", async () => {
      // Setup mocks
      chatbotLogic.checkTopicRelevanceUtility.mockResolvedValue({
        success: false,
        error: "Relevance check failed",
      });

      const message = "What are some good restaurants in Auckland?";

      const res = await request(app)
        .post("/api/chatbot/chat")
        .send({ message });

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("Service unavailable");

      // Verify the relevance check was called but not the answer utility
      expect(chatbotLogic.checkTopicRelevanceUtility).toHaveBeenCalledWith(
        message
      );
      expect(chatbotLogic.getAnswerUtility).not.toHaveBeenCalled();
    });

    it("should handle errors in getting the answer", async () => {
      // Setup mocks
      chatbotLogic.checkTopicRelevanceUtility.mockResolvedValue({
        success: true,
        isRelevant: true,
      });

      chatbotLogic.getAnswerUtility.mockResolvedValue({
        success: false,
        error: "Failed to get answer",
      });

      const message = "What are some good restaurants in Auckland?";

      const res = await request(app)
        .post("/api/chatbot/chat")
        .send({ message });

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain("Service unavailable");

      // Verify both functions were called
      expect(chatbotLogic.checkTopicRelevanceUtility).toHaveBeenCalledWith(
        message
      );
      expect(chatbotLogic.getAnswerUtility).toHaveBeenCalledWith(message, "zh");
    });

    it("should respect language parameter", async () => {
      // Setup mocks
      chatbotLogic.checkTopicRelevanceUtility.mockResolvedValue({
        success: true,
        isRelevant: true,
      });

      chatbotLogic.getAnswerUtility.mockResolvedValue({
        success: true,
        data: "This is a test response in English.",
      });

      const message = "What are some good restaurants in Auckland?";
      const language = "en";

      const res = await request(app)
        .post("/api/chatbot/chat")
        .send({ message, language });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify getAnswerUtility was called with the correct language
      expect(chatbotLogic.getAnswerUtility).toHaveBeenCalledWith(
        message,
        language
      );
    });
  });
});
