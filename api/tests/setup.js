import dotenv from "dotenv";
import mongoose from "mongoose";
import { afterAll, beforeAll } from "vitest";

// Load environment variables
dotenv.config();

// Setup function to connect to the database
export const setupTestDB = () => {
  beforeAll(async () => {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log("Connected to MongoDB for testing");
    } catch (error) {
      console.error("Failed to connect to MongoDB:", error);
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
    console.log("Disconnected from MongoDB");
  });
};

// Common test data
export const testToken =
  "your-jwt-token";
export const testUser = {
  _id: "your-user-id",
  email: "your-email",
};
