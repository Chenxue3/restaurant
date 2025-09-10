import request from "supertest";
import { describe, it, expect } from "vitest";
import app from "../src/app.js";
import { setupTestDB, testToken, testUser } from "./setup.js";

// Setup database connection
setupTestDB();

describe("Restaurants API", () => {
  let createdRestaurantId;

  // Test GET /api/restaurants
  describe("GET /api/restaurants", () => {
    it("should get all restaurants", async () => {
      const res = await request(app).get("/api/restaurants");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // // Test POST /api/restaurants
  // describe("POST /api/restaurants", () => {
  //   it("should create a new restaurant when authenticated", async () => {
  //     const newRestaurant = {
  //       name: "Test Restaurant",
  //       description: "A test restaurant",
  //       address: "123 Test Street, Auckland, New Zealand",
  //       cuisineType: "Test Cuisine",
  //       priceRange: "$$",
  //       phoneNumber: "123-456-7890",
  //       openingHours: {
  //         monday: { open: "9:00", close: "22:00" },
  //         tuesday: { open: "9:00", close: "22:00" },
  //         wednesday: { open: "9:00", close: "22:00" },
  //         thursday: { open: "9:00", close: "22:00" },
  //         friday: { open: "9:00", close: "23:00" },
  //         saturday: { open: "10:00", close: "23:00" },
  //         sunday: { open: "10:00", close: "22:00" },
  //       },
  //     };

  //     const res = await request(app)
  //       .post("/api/restaurants")
  //       .set("Authorization", `Bearer ${testToken}`)
  //       .send(newRestaurant);

  //     expect(res.status).toBe(201);
  //     expect(res.body.success).toBe(true);
  //     expect(res.body.data).toBeDefined();
  //     expect(res.body.data.name).toBe(newRestaurant.name);
  //     expect(res.body.data.description).toBe(newRestaurant.description);
  //     expect(res.body.data.address).toBe(newRestaurant.address);

  //     // Save the ID for use in other tests
  //     createdRestaurantId = res.body.data._id;
  //   });

  //   it("should return 401 when not authenticated", async () => {
  //     const newRestaurant = {
  //       name: "Unauthorized Restaurant",
  //       description: "Should not be created",
  //     };

  //     const res = await request(app)
  //       .post("/api/restaurants")
  //       .send(newRestaurant);

  //     expect(res.status).toBe(401);
  //     expect(res.body.success).toBe(false);
  //   });
  // });

  // Test GET /api/restaurants/:id
  describe("GET /api/restaurants/:id", () => {
    it("should get a restaurant by id", async () => {
      // Skip if we don't have a created restaurant ID
      if (!createdRestaurantId) {
        return;
      }

      const res = await request(app).get(
        `/api/restaurants/${createdRestaurantId}`
      );

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data._id).toBe(createdRestaurantId);
    });

    it("should return 404 for non-existent restaurant", async () => {
      const nonExistentId = "5f9d40e26d15f0a79e4e2c41"; // Random valid ObjectId

      const res = await request(app).get(`/api/restaurants/${nonExistentId}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // Test PUT /api/restaurants/:id
  describe("PUT /api/restaurants/:id", () => {
    it("should update a restaurant when authenticated", async () => {
      // Skip if we don't have a created restaurant ID
      if (!createdRestaurantId) {
        return;
      }

      const updateData = {
        name: "Updated Test Restaurant",
        description: "Updated description",
        priceRange: "$$$",
      };

      const res = await request(app)
        .put(`/api/restaurants/${createdRestaurantId}`)
        .set("Authorization", `Bearer ${testToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(updateData.name);
      expect(res.body.data.description).toBe(updateData.description);
      expect(res.body.data.priceRange).toBe(updateData.priceRange);
    });

    it("should return 401 when not authenticated", async () => {
      // Skip if we don't have a created restaurant ID
      if (!createdRestaurantId) {
        return;
      }

      const updateData = {
        name: "Unauthorized Update",
      };

      const res = await request(app)
        .put(`/api/restaurants/${createdRestaurantId}`)
        .send(updateData);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  // Test DELETE /api/restaurants/:id
  describe("DELETE /api/restaurants/:id", () => {
    it("should delete a restaurant when authenticated", async () => {
      // Skip if we don't have a created restaurant ID
      if (!createdRestaurantId) {
        return;
      }

      const res = await request(app)
        .delete(`/api/restaurants/${createdRestaurantId}`)
        .set("Authorization", `Bearer ${testToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("should return 401 when not authenticated", async () => {
      const nonExistentId = "5f9d40e26d15f0a79e4e2c41"; // Random valid ObjectId

      const res = await request(app).delete(
        `/api/restaurants/${nonExistentId}`
      );

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
