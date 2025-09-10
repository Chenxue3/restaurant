import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as authController from "../src/controllers/authController.js";
import * as emailService from "../src/services/azureEmail.js";
import * as redisService from "../src/config/redis.js";
import User from "../src/models/User.js";
import jwt from "jsonwebtoken";

// Mock dependencies
vi.mock("../src/services/azureEmail.js", () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue(true),
}));

vi.mock("../src/config/redis.js", () => ({
  generateCode: vi.fn().mockReturnValue("123456"),
  storeVerificationCode: vi.fn().mockResolvedValue(true),
  getVerificationCode: vi.fn(),
  deleteVerificationCode: vi.fn().mockResolvedValue(true),
}));

// Mock the User model
vi.mock("../src/models/User.js", () => {
  const mockSelect = vi.fn().mockReturnThis();
  return {
    default: {
      findOne: vi.fn(),
      create: vi.fn(),
      findByIdAndUpdate: vi.fn().mockImplementation(() => ({
        select: mockSelect,
      })),
    },
  };
});

// Mock JWT module
vi.mock("jsonwebtoken", () => ({
  default: {
    sign: vi.fn().mockReturnValue("mock-token"),
  },
  sign: vi.fn().mockReturnValue("mock-token"),
}));

describe("Auth Controller", () => {
  // Create mock request and response objects
  let req;
  let res;
  const originalEnv = { ...process.env };
  let consoleSpy;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock console.error
    consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Setup mock request and response
    req = {
      body: {},
      user: {
        _id: "6822b915fac297644fd1b530",
        email: "xuxinyi9977@gmail.com",
        name: "Test User",
      },
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    // Setup environment variables
    process.env = {
      ...originalEnv,
      JWT_SECRET: "test-secret",
      JWT_EXPIRES_IN: "7d",
    };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    consoleSpy.mockRestore();
  });

  describe("sendVerificationCode", () => {
    it("should send verification code successfully", async () => {
      // Setup
      req.body.email = "test@example.com";

      // Execute
      await authController.sendVerificationCode(req, res);

      // Verify
      expect(redisService.generateCode).toHaveBeenCalled();
      expect(redisService.storeVerificationCode).toHaveBeenCalledWith(
        "test@example.com",
        "123456"
      );
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        "test@example.com",
        "123456"
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Verification code sent successfully",
      });
    });

    it("should return 400 if email is not provided", async () => {
      // Execute
      await authController.sendVerificationCode(req, res);

      // Verify
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Please provide an email",
      });
    });

    it("should handle errors when sending verification code", async () => {
      // Setup
      req.body.email = "test@example.com";
      const errorMessage = "Failed to send email";
      emailService.sendVerificationEmail.mockRejectedValueOnce(
        new Error(errorMessage)
      );

      // Execute
      await authController.sendVerificationCode(req, res);

      // Verify
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Error sending verification code",
        error: errorMessage,
      });
    });
  });

  describe("verifyCode", () => {
    it("should verify code and login existing user", async () => {
      // Setup
      req.body = {
        email: "test@example.com",
        code: "123456",
      };

      // Mock Redis to return matching code
      redisService.getVerificationCode.mockResolvedValueOnce("123456");

      // Mock existing user
      const mockUser = {
        _id: "user123",
        email: "test@example.com",
        lastLogin: null,
        save: vi.fn().mockResolvedValueOnce(true),
      };
      User.findOne.mockResolvedValueOnce(mockUser);

      // Execute
      await authController.verifyCode(req, res);

      // Verify
      expect(redisService.getVerificationCode).toHaveBeenCalledWith(
        "test@example.com"
      );
      expect(User.findOne).toHaveBeenCalledWith({ email: "test@example.com" });
      expect(mockUser.save).toHaveBeenCalled();
      expect(redisService.deleteVerificationCode).toHaveBeenCalledWith(
        "test@example.com"
      );
      expect(jwt.sign).toHaveBeenCalledWith({ id: "user123" }, "test-secret", {
        expiresIn: "7d",
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        isNewUser: false,
        token: "mock-token",
        user: {
          _id: "user123",
          email: "test@example.com",
          name: undefined,
          profileImage: undefined,
        },
      });
    });

    it("should verify code and register new user", async () => {
      // Setup
      req.body = {
        email: "new@example.com",
        code: "123456",
      };

      // Mock Redis to return matching code
      redisService.getVerificationCode.mockResolvedValueOnce("123456");

      // Mock user not found, then created
      User.findOne.mockResolvedValueOnce(null);
      const mockNewUser = {
        _id: "newuser123",
        email: "new@example.com",
        lastLogin: null,
        save: vi.fn().mockResolvedValueOnce(true),
      };
      User.create.mockResolvedValueOnce(mockNewUser);

      // Execute
      await authController.verifyCode(req, res);

      // Verify
      expect(User.findOne).toHaveBeenCalledWith({ email: "new@example.com" });
      expect(User.create).toHaveBeenCalledWith({ email: "new@example.com" });
      expect(mockNewUser.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        isNewUser: true,
        token: "mock-token",
        user: {
          _id: "newuser123",
          email: "new@example.com",
          name: undefined,
          profileImage: undefined,
        },
      });
    });

    it("should return 400 if email or code is not provided", async () => {
      // Execute
      await authController.verifyCode(req, res);

      // Verify
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Please provide both email and verification code",
      });
    });

    it("should return 400 if verification code is invalid", async () => {
      // Setup
      req.body = {
        email: "test@example.com",
        code: "123456",
      };

      // Mock Redis to return different code
      redisService.getVerificationCode.mockResolvedValueOnce("654321");

      // Execute
      await authController.verifyCode(req, res);

      // Verify
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid or expired verification code",
      });
    });

    it("should return 400 if verification code is expired (null)", async () => {
      // Setup
      req.body = {
        email: "test@example.com",
        code: "123456",
      };

      // Mock Redis to return null (expired code)
      redisService.getVerificationCode.mockResolvedValueOnce(null);

      // Execute
      await authController.verifyCode(req, res);

      // Verify
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid or expired verification code",
      });
    });

    it("should handle errors during verification", async () => {
      // Setup
      req.body = {
        email: "test@example.com",
        code: "123456",
      };

      // Mock error in Redis
      const errorMessage = "Database connection failed";
      redisService.getVerificationCode.mockRejectedValueOnce(
        new Error(errorMessage)
      );

      // Execute
      await authController.verifyCode(req, res);

      // Verify
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Error verifying code",
        error: errorMessage,
      });
    });
  });

  describe("getMe", () => {
    it("should return current user profile", async () => {
      // Execute
      await authController.getMe(req, res);

      // Verify
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        user: req.user,
      });
    });

    it("should handle errors during profile fetching", async () => {
      // Setup - force an error
      res.status.mockImplementationOnce(() => {
        throw new Error("Test error");
      });

      // Execute
      await authController.getMe(req, res);

      // Verify
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error fetching user profile:",
        expect.any(Error)
      );
      // Since we're throwing during status(), we expect the backup json to be called
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Error fetching user profile",
        error: "Test error",
      });
    });
  });

  describe("updateProfile", () => {
    it("should update user profile successfully", async () => {
      // Setup
      req.body = { name: "Updated Name" };
      const updatedUser = {
        _id: "6822b915fac297644fd1b530",
        email: "xuxinyi9977@gmail.com",
        name: "Updated Name",
      };

      // Mock the User.findByIdAndUpdate().select() chain
      User.findByIdAndUpdate().select.mockResolvedValueOnce(updatedUser);

      // Execute
      await authController.updateProfile(req, res);

      // Verify
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith(
        req.user._id,
        { name: "Updated Name" },
        { new: true, runValidators: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        user: updatedUser,
      });
    });

    it("should handle errors during profile update", async () => {
      // Setup
      req.body = { name: "Updated Name" };

      // Mock error in findByIdAndUpdate
      User.findByIdAndUpdate.mockImplementationOnce(() => {
        throw new Error("Database error");
      });

      // Execute
      await authController.updateProfile(req, res);

      // Verify
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error updating profile:",
        expect.any(Error)
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Error updating profile",
        error: "Database error",
      });
    });
  });

  describe("generateToken", () => {
    it("should generate a JWT token with correct payload", async () => {
      // Test by executing verifyCode which will use generateToken internally
      req.body = {
        email: "test@example.com",
        code: "123456",
      };
      redisService.getVerificationCode.mockResolvedValueOnce("123456");
      const mockUser = {
        _id: "user123",
        email: "test@example.com",
        save: vi.fn().mockResolvedValueOnce(true),
      };
      User.findOne.mockResolvedValueOnce(mockUser);

      // Execute
      await authController.verifyCode(req, res);

      // Verify
      expect(jwt.sign).toHaveBeenCalledWith({ id: "user123" }, "test-secret", {
        expiresIn: "7d",
      });
    });

    it("should use environment variables for JWT configuration", async () => {
      // Modify environment variables
      process.env.JWT_SECRET = "custom-secret";
      process.env.JWT_EXPIRES_IN = "30d";

      // Test by executing verifyCode which will use generateToken internally
      req.body = {
        email: "test@example.com",
        code: "123456",
      };
      redisService.getVerificationCode.mockResolvedValueOnce("123456");
      const mockUser = {
        _id: "user789",
        email: "test@example.com",
        save: vi.fn().mockResolvedValueOnce(true),
      };
      User.findOne.mockResolvedValueOnce(mockUser);

      // Execute
      await authController.verifyCode(req, res);

      // Verify
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: "user789" },
        "custom-secret",
        { expiresIn: "30d" }
      );
    });
  });
});
