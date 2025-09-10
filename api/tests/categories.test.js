import request from "supertest";
import { describe, it, expect } from "vitest";
import app from "../src/app.js";
import { setupTestDB, testToken, testUser } from "./setup.js";

// Setup database connection
setupTestDB();

describe("Categories API", () => {
  let createdCategoryId;
  let testRestaurantId;

  // First create a restaurant to test categories with
  beforeAll(async () => {
    // Create a test restaurant
    const restaurantRes = await request(app)
      .post("/api/restaurants")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        name: "Test Restaurant for Categories",
        description: "A test restaurant",
        address: "123 Test Street, Auckland, New Zealand",
        cuisineType: "Test Cuisine",
        priceRange: "$$",
      });

    if (restaurantRes.status === 201) {
      testRestaurantId = restaurantRes.body.data._id;
    }
  });

  // Test POST /api/restaurants/:restaurantId/categories
  describe("POST /api/restaurants/:restaurantId/categories", () => {
    it("should create a new category when authenticated", async () => {
      // Skip if we don't have a created restaurant ID
      if (!testRestaurantId) {
        return;
      }

      const newCategory = {
        name: "Test Category",
        description: "A test category for menu items",
      };

      const res = await request(app)
        .post(`/api/restaurants/${testRestaurantId}/categories`)
        .set("Authorization", `Bearer ${testToken}`)
        .send(newCategory);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.name).toBe(newCategory.name);
      expect(res.body.data.description).toBe(newCategory.description);
      expect(res.body.data.restaurant).toBe(testRestaurantId);

      // Save the ID for use in other tests
      createdCategoryId = res.body.data._id;
    });

    it("should return 401 when not authenticated", async () => {
      // Skip if we don't have a created restaurant ID
      if (!testRestaurantId) {
        return;
      }

      const newCategory = {
        name: "Unauthorized Category",
        description: "Should not be created",
      };

      const res = await request(app)
        .post(`/api/restaurants/${testRestaurantId}/categories`)
        .send(newCategory);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // Test GET /api/restaurants/:restaurantId/categories
  describe("GET /api/restaurants/:restaurantId/categories", () => {
    it("should get all categories for a restaurant", async () => {
      // Skip if we don't have a created restaurant ID
      if (!testRestaurantId) {
        return;
      }

      const res = await request(app).get(
        `/api/restaurants/${testRestaurantId}/categories`
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      // Check if our created category is in the list
      if (createdCategoryId) {
        const categoryExists = res.body.data.some(
          (category) => category._id === createdCategoryId
        );
        expect(categoryExists).toBe(true);
      }
    });
  });

  // Test PUT /api/categories/:id
  describe("PUT /api/categories/:id", () => {
    it("should update a category when authenticated", async () => {
      // Skip if we don't have a created category ID
      if (!createdCategoryId) {
        return;
      }

      const updateData = {
        name: "Updated Test Category",
        description: "Updated description",
      };

      const res = await request(app)
        .put(`/api/categories/${createdCategoryId}`)
        .set("Authorization", `Bearer ${testToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(updateData.name);
      expect(res.body.data.description).toBe(updateData.description);
    });

    it("should return 401 when not authenticated", async () => {
      // Skip if we don't have a created category ID
      if (!createdCategoryId) {
        return;
      }

      const updateData = {
        name: "Unauthorized Update",
      };

      const res = await request(app)
        .put(`/api/categories/${createdCategoryId}`)
        .send(updateData);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // Test DELETE /api/categories/:id
  describe("DELETE /api/categories/:id", () => {
    it("should delete a category when authenticated", async () => {
      // Skip if we don't have a created category ID
      if (!createdCategoryId) {
        return;
      }

      const res = await request(app)
        .delete(`/api/categories/${createdCategoryId}`)
        .set("Authorization", `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should return 401 when not authenticated", async () => {
      const nonExistentId = "5f9d40e26d15f0a79e4e2c41"; // Random valid ObjectId

      const res = await request(app).delete(`/api/categories/${nonExistentId}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
