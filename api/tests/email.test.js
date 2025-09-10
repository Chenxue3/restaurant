import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as emailModule from "../src/services/azureEmail.js";

// Mock modules
const mockBeginSend = vi.fn();
const mockPollUntilDone = vi.fn();

// Create a global mock for Azure EmailClient
vi.mock("@azure/communication-email", () => {
  return {
    EmailClient: vi.fn().mockImplementation(() => ({
      beginSend: mockBeginSend,
    })),
  };
});

describe("Email Configuration", () => {
  // Save the original environment variables
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Setup environment variables for testing
    vi.resetModules();
    process.env = {
      ...originalEnv,
      EMAIL_CONNECTION_STRING:
        "endpoint=https://mock-email-service.communication.azure.com/;accesskey=mock-key",
      EMAIL_FROM: "noreply@smartsavor.com",
    };

    // Reset mocks and set default behaviors
    vi.clearAllMocks();
    mockPollUntilDone.mockResolvedValue({
      id: "mock-email-id",
      status: "Succeeded",
    });
    mockBeginSend.mockResolvedValue({
      pollUntilDone: mockPollUntilDone,
    });
  });

  afterEach(() => {
    // Restore the original environment variables
    process.env = originalEnv;
  });

  describe("getEmailClient", () => {
    it("should create an email client instance when connection string is provided", () => {
      const client = emailModule.getEmailClient();
      expect(client).toBeDefined();
    });

    it("should throw an error when connection string is missing", () => {
      // Remove the email connection string from env
      delete process.env.EMAIL_CONNECTION_STRING;

      expect(() => {
        emailModule.getEmailClient();
      }).toThrow("Azure email connection string is not configured");
    });
  });

  describe("sendVerificationEmail", () => {
    it("should successfully send a verification email", async () => {
      const email = "test@example.com";
      const code = "123456";

      // Spy on console.error to prevent logs
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const response = await emailModule.sendVerificationEmail(email, code);

      expect(response).toBeDefined();
      expect(response.status).toBe("Succeeded");
      expect(response.id).toBe("mock-email-id");
      expect(mockBeginSend).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should throw an error when email sending fails", async () => {
      const email = "test@example.com";
      const code = "123456";

      // Spy on console.error to prevent logs
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Mock beginSend to throw an error for this test only
      mockBeginSend.mockRejectedValueOnce(new Error("Failed to send email"));

      await expect(
        emailModule.sendVerificationEmail(email, code)
      ).rejects.toThrow("Failed to send email");

      consoleSpy.mockRestore();
    });

    it("should create an email with the right content", async () => {
      const email = "test@example.com";
      const code = "123456";

      // Spy on console.error to prevent logs
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Reset mocks
      mockBeginSend.mockClear();

      await emailModule.sendVerificationEmail(email, code);

      // Verify beginSend was called with the right parameters
      expect(mockBeginSend).toHaveBeenCalledTimes(1);

      // Extract and verify the email content
      const emailMessage = mockBeginSend.mock.calls[0][0];
      expect(emailMessage.senderAddress).toBe(process.env.EMAIL_FROM);
      expect(emailMessage.recipients.to[0].address).toBe(email);
      expect(emailMessage.content.subject).toBe("SmartSavor Verification Code");
      expect(emailMessage.content.plainText).toContain(code);
      expect(emailMessage.content.html).toContain(code);

      consoleSpy.mockRestore();
    });
  });
});
