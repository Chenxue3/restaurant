import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as redisModule from "../src/config/redis.js";

// Mock Redis client
const mockSet = vi.fn();
const mockGet = vi.fn();
const mockDel = vi.fn();
const mockConnect = vi.fn();
const mockOn = vi.fn();
const mockClient = {
  isOpen: false,
  connect: mockConnect,
  set: mockSet,
  get: mockGet,
  del: mockDel,
  on: mockOn,
};

// Mock the redis module
vi.mock("redis", () => {
  return {
    createClient: vi.fn().mockImplementation(() => mockClient),
  };
});

describe("Redis Configuration", () => {
  // Save original environment
  const originalEnv = { ...process.env };
  const originalConsoleError = console.error;

  beforeEach(() => {
    // Setup test environment
    vi.resetModules();
    process.env = { ...originalEnv };

    // Reset all mocks
    vi.clearAllMocks();
    // Reset client properties
    mockClient.isOpen = false;
    mockConnect.mockResolvedValue(undefined);
    mockSet.mockResolvedValue("OK");
    mockGet.mockResolvedValue("123456");
    mockDel.mockResolvedValue(1);

    // Silence console errors
    console.error = vi.fn();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    console.error = originalConsoleError;
  });

  describe("Redis Client Configuration", () => {
    it("should use default Redis URL when REDIS_URL is not provided", async () => {
      // Ensure REDIS_URL is not set
      delete process.env.REDIS_URL;

      // Call any method that will use the Redis client
      await redisModule.storeVerificationCode("test@example.com", "123456");

      // Check that the client was created with the default URL
      const { createClient } = await import("redis");
      expect(createClient).toHaveBeenCalledWith({
        url: "redis://localhost:6379",
      });
      expect(mockConnect).toHaveBeenCalledTimes(1);
      expect(mockOn).toHaveBeenCalledWith("error", expect.any(Function));
    });

    it("should use custom Redis URL when REDIS_URL is provided", async () => {
      // Set custom REDIS_URL
      process.env.REDIS_URL = "redis://custom-host:6379";

      // Call any method that will use the Redis client
      await redisModule.storeVerificationCode("test@example.com", "123456");

      // Check that the client was created with the custom URL
      const { createClient } = await import("redis");
      expect(createClient).toHaveBeenCalledWith({
        url: "redis://custom-host:6379",
      });
      expect(mockConnect).toHaveBeenCalledTimes(1);
    });

    it("should handle connection errors gracefully", async () => {
      // Make connect throw an error
      mockConnect.mockRejectedValueOnce(new Error("Connection failed"));

      // Call any method that will use the Redis client and expect it to fail
      await expect(
        redisModule.storeVerificationCode("test@example.com", "123456")
      ).rejects.toThrow("Connection failed");
    });

    it("should not connect if client is already open", async () => {
      // Set client to be already open
      mockClient.isOpen = true;

      // Call any method that will use the Redis client
      await redisModule.storeVerificationCode("test@example.com", "123456");

      // Check that connect was not called
      expect(mockConnect).not.toHaveBeenCalled();
    });

    it("should handle Redis error events", async () => {
      // Trigger the error event handler
      await redisModule.storeVerificationCode("test@example.com", "123456");

      // Find the error handler (first argument of the first call to mockOn)
      const errorHandler = mockOn.mock.calls[0][1];

      // Call the error handler with a test error
      errorHandler(new Error("Test Redis error"));

      // Verify console.error was called
      expect(console.error).toHaveBeenCalledWith(
        "Redis error:",
        expect.any(Error)
      );
    });
  });

  describe("storeVerificationCode", () => {
    it("should store a verification code in Redis", async () => {
      const email = "test@example.com";
      const code = "123456";

      await redisModule.storeVerificationCode(email, code);

      expect(mockSet).toHaveBeenCalledWith(`verification:${email}`, code, {
        EX: 600,
      });
    });

    it("should throw an error when Redis set operation fails", async () => {
      const email = "test@example.com";
      const code = "123456";

      // Make set throw an error
      mockSet.mockRejectedValueOnce(new Error("Set operation failed"));

      await expect(
        redisModule.storeVerificationCode(email, code)
      ).rejects.toThrow("Set operation failed");

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("getVerificationCode", () => {
    it("should retrieve a verification code from Redis", async () => {
      const email = "test@example.com";
      const expectedCode = "123456";

      mockGet.mockResolvedValueOnce(expectedCode);

      const code = await redisModule.getVerificationCode(email);

      expect(code).toBe(expectedCode);
      expect(mockGet).toHaveBeenCalledWith(`verification:${email}`);
    });

    it("should throw an error when Redis get operation fails", async () => {
      const email = "test@example.com";

      // Make get throw an error
      mockGet.mockRejectedValueOnce(new Error("Get operation failed"));

      await expect(redisModule.getVerificationCode(email)).rejects.toThrow(
        "Get operation failed"
      );

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("deleteVerificationCode", () => {
    it("should delete a verification code from Redis", async () => {
      const email = "test@example.com";

      await redisModule.deleteVerificationCode(email);

      expect(mockDel).toHaveBeenCalledWith(`verification:${email}`);
    });

    it("should throw an error when Redis del operation fails", async () => {
      const email = "test@example.com";

      // Make del throw an error
      mockDel.mockRejectedValueOnce(new Error("Del operation failed"));

      await expect(redisModule.deleteVerificationCode(email)).rejects.toThrow(
        "Del operation failed"
      );

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("generateCode", () => {
    it("should generate a 6-digit verification code", () => {
      const code = redisModule.generateCode();

      expect(code).toMatch(/^\d{6}$/);
      expect(parseInt(code)).toBeGreaterThanOrEqual(100000);
      expect(parseInt(code)).toBeLessThanOrEqual(999999);
    });

    it("should generate different codes on subsequent calls", () => {
      // Spy on Math.random to ensure it's called
      const randomSpy = vi.spyOn(Math, "random");

      const code1 = redisModule.generateCode();
      randomSpy.mockReturnValueOnce(0.5); // Mock a different random value
      const code2 = redisModule.generateCode();

      // If Math.random returns different values, codes should be different
      if (randomSpy.mock.results[0].value !== randomSpy.mock.results[1].value) {
        expect(code1).not.toBe(code2);
      }

      randomSpy.mockRestore();
    });
  });

  describe("Default export", () => {
    it("should export all the necessary functions", () => {
      const redisDefault = redisModule.default;

      expect(redisDefault.storeVerificationCode).toBe(
        redisModule.storeVerificationCode
      );
      expect(redisDefault.getVerificationCode).toBe(
        redisModule.getVerificationCode
      );
      expect(redisDefault.deleteVerificationCode).toBe(
        redisModule.deleteVerificationCode
      );
      expect(redisDefault.generateCode).toBe(redisModule.generateCode);
    });
  });
});
