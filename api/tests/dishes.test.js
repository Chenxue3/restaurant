import request from "supertest";
import { describe, it, expect } from "vitest";
import app from "../src/app.js";
import { setupTestDB, testToken, testUser } from "./setup.js";

// Setup database connection
setupTestDB();

describe("Dishes API", () => {
  let createdDishId;
  let testRestaurantId;

  // First create a restaurant to test dishes with
  beforeAll(async () => {
    // Create a test restaurant
    const restaurantRes = await request(app)
      .post("/api/restaurants")
      .set("Authorization", `Bearer ${testToken}`)
      .send({
        name: "Test Restaurant for Dishes",
        description: "A test restaurant",
        address: "123 Test Street, Auckland, New Zealand",
        cuisineType: "Test Cuisine",
        priceRange: "$$",
      });

    if (restaurantRes.status === 201) {
      testRestaurantId = restaurantRes.body.data._id;
    }
  });

  // Test POST /api/restaurants/:restaurantId/dishes
  describe("POST /api/restaurants/:restaurantId/dishes", () => {
    it("should create a new dish when authenticated", async () => {
      // Skip if we don't have a created restaurant ID
      if (!testRestaurantId) {
        return;
      }

      const newDish = {
        name: "Test Dish",
        description: "A delicious test dish",
        price: 15.99,
        ingredients: ["ingredient1", "ingredient2"],
        dietaryInfo: ["vegetarian"],
      };

      const res = await request(app)
        .post(`/api/restaurants/${testRestaurantId}/dishes`)
        .set("Authorization", `Bearer ${testToken}`)
        .send(newDish);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.name).toBe(newDish.name);
      expect(res.body.data.description).toBe(newDish.description);
      expect(res.body.data.price).toBe(newDish.price);
      expect(res.body.data.restaurant).toBe(testRestaurantId);

      // Save the ID for use in other tests
      createdDishId = res.body.data._id;
    });

    it("should return 401 when not authenticated", async () => {
      // Skip if we don't have a created restaurant ID
      if (!testRestaurantId) {
        return;
      }

      const newDish = {
        name: "Unauthorized Dish",
        description: "Should not be created",
        price: 12.99,
      };

      const res = await request(app)
        .post(`/api/restaurants/${testRestaurantId}/dishes`)
        .send(newDish);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // Test GET /api/restaurants/:restaurantId/dishes
  describe("GET /api/restaurants/:restaurantId/dishes", () => {
    it("should get all dishes for a restaurant", async () => {
      // Skip if we don't have a created restaurant ID
      if (!testRestaurantId) {
        return;
      }

      const res = await request(app).get(
        `/api/restaurants/${testRestaurantId}/dishes`
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);

      // Check if our created dish is in the list
      if (createdDishId) {
        const dishExists = res.body.data.some(
          (dish) => dish._id === createdDishId
        );
        expect(dishExists).toBe(true);
      }
    });
  });

  // Test GET /api/dishes/:id
  describe("GET /api/dishes/:id", () => {
    it("should get a dish by ID", async () => {
      // Skip if we don't have a created dish ID
      if (!createdDishId) {
        return;
      }

      const res = await request(app).get(`/api/dishes/${createdDishId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data._id).toBe(createdDishId);
    });

    it("should return 404 for non-existent dish", async () => {
      const nonExistentId = "5f9d40e26d15f0a79e4e2c41"; // Random valid ObjectId

      const res = await request(app).get(`/api/dishes/${nonExistentId}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // Test PUT /api/dishes/:id
  describe("PUT /api/dishes/:id", () => {
    it("should update a dish when authenticated", async () => {
      // Skip if we don't have a created dish ID
      if (!createdDishId) {
        return;
      }

      const updateData = {
        name: "Updated Test Dish",
        description: "Updated description",
        price: 18.99,
        dietaryInfo: ["vegetarian", "gluten-free"],
      };

      const res = await request(app)
        .put(`/api/dishes/${createdDishId}`)
        .set("Authorization", `Bearer ${testToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(updateData.name);
      expect(res.body.data.description).toBe(updateData.description);
      expect(res.body.data.price).toBe(updateData.price);
      expect(res.body.data.dietaryInfo).toEqual(
        expect.arrayContaining(updateData.dietaryInfo)
      );
    });

    it("should return 401 when not authenticated", async () => {
      // Skip if we don't have a created dish ID
      if (!createdDishId) {
        return;
      }

      const updateData = {
        name: "Unauthorized Update",
      };

      const res = await request(app)
        .put(`/api/dishes/${createdDishId}`)
        .send(updateData);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // Test DELETE /api/dishes/:id
  describe("DELETE /api/dishes/:id", () => {
    it("should delete a dish when authenticated", async () => {
      // Skip if we don't have a created dish ID
      if (!createdDishId) {
        return;
      }

      const res = await request(app)
        .delete(`/api/dishes/${createdDishId}`)
        .set("Authorization", `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should return 401 when not authenticated", async () => {
      const nonExistentId = "5f9d40e26d15f0a79e4e2c41"; // Random valid ObjectId

      const res = await request(app).delete(`/api/dishes/${nonExistentId}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
