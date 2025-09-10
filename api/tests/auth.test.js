import request from "supertest";
import { describe, it, expect } from "vitest";
import app from "../src/app.js";
import { setupTestDB, testToken, testUser } from "./setup.js";

// Setup database connection
setupTestDB();

describe("Auth API", () => {
  // Test GET /api/auth/me
  describe("GET /api/auth/me", () => {
    it("should get current user profile when authenticated", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toBeDefined();
      expect(res.body.user._id).toBeDefined();
      expect(res.body.user.email).toBeDefined();
    });

    it("should return 401 when no token is provided", async () => {
      const res = await request(app).get("/api/auth/me");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Not authorized, no token");
    });

    it("should return 401 when invalid token is provided", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalidtoken");

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // Test PUT /api/auth/profile
  describe("PUT /api/auth/profile", () => {
    it("should update user profile when authenticated", async () => {
      const updatedName = "Updated Test User";

      const res = await request(app)
        .put("/api/auth/profile")
        .set("Authorization", `Bearer ${testToken}`)
        .send({ name: updatedName });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.name).toBe(updatedName);
    });

    it("should return 401 when no token is provided", async () => {
      const res = await request(app)
        .put("/api/auth/profile")
        .send({ name: "Test User" });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
