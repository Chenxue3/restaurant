import { expect, vi, describe, it, beforeEach } from "vitest";
import {
  getPlaceAutocomplete,
  getPlaceDetails,
} from "../src/controllers/placesController.js";
import axios from "axios";
import { setupTestDB } from "./setup.js";

// Setup test database
setupTestDB();

// Mock modules
vi.mock("axios");

describe("Places Controller", () => {
  let req, res;
  const originalEnv = process.env;

  beforeEach(() => {
    // Setup request and response
    req = {
      query: {},
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    // Mock console methods to avoid polluting test output
    vi.spyOn(console, "log").mockImplementation();
    vi.spyOn(console, "error").mockImplementation();

    // Reset mocks
    vi.clearAllMocks();

    // Backup environment variables
    process.env = { ...originalEnv };
    process.env.GOOGLE_PLACES_API_KEY = "test-api-key";
  });

  afterEach(() => {
    // Restore environment variables
    process.env = originalEnv;
  });

  describe("getPlaceAutocomplete", () => {
    it("should return 400 if input parameter is missing", async () => {
      await getPlaceAutocomplete(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Input parameter is required",
      });
    });

    it("should return 500 if Google Places API key is not configured", async () => {
      // Remove API key from environment
      delete process.env.GOOGLE_PLACES_API_KEY;

      req.query = { input: "Restaurant" };

      await getPlaceAutocomplete(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Google Places API key is not configured",
      });
    });

    it("should return 500 if Google Places API returns an error status", async () => {
      req.query = { input: "Restaurant" };

      // Mock axios to return error status
      axios.get.mockResolvedValue({
        data: {
          status: "REQUEST_DENIED",
          error_message: "API key invalid",
        },
      });

      await getPlaceAutocomplete(req, res);

      expect(axios.get).toHaveBeenCalledWith(
        "https://maps.googleapis.com/maps/api/place/autocomplete/json",
        expect.any(Object)
      );

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Error from Google Places API",
        status: "REQUEST_DENIED",
        error_message: "API key invalid",
      });
    });

    it("should return empty array if no predictions are found", async () => {
      req.query = { input: "NonExistentRestaurant" };

      // Mock axios to return empty predictions
      axios.get.mockResolvedValue({
        data: {
          status: "OK",
          predictions: [],
        },
      });

      await getPlaceAutocomplete(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [],
      });
    });

    it("should return predictions when successful", async () => {
      req.query = { input: "Restaurant", country: "us" };

      const mockPredictions = [
        { place_id: "place1", description: "Restaurant 1" },
        { place_id: "place2", description: "Restaurant 2" },
      ];

      // Mock axios to return predictions
      axios.get.mockResolvedValue({
        data: {
          status: "OK",
          predictions: mockPredictions,
        },
      });

      await getPlaceAutocomplete(req, res);

      expect(axios.get).toHaveBeenCalledWith(
        "https://maps.googleapis.com/maps/api/place/autocomplete/json",
        {
          params: {
            input: "Restaurant",
            types: "restaurant",
            components: "country:us",
            key: "test-api-key",
          },
        }
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockPredictions,
      });
    });

    it("should use default country if not specified", async () => {
      req.query = { input: "Restaurant" };

      // Mock axios to return success
      axios.get.mockResolvedValue({
        data: {
          status: "OK",
          predictions: [],
        },
      });

      await getPlaceAutocomplete(req, res);

      expect(axios.get).toHaveBeenCalledWith(
        "https://maps.googleapis.com/maps/api/place/autocomplete/json",
        {
          params: {
            input: "Restaurant",
            types: "restaurant",
            components: "country:nz",
            key: "test-api-key",
          },
        }
      );
    });

    it("should handle axios error", async () => {
      req.query = { input: "Restaurant" };

      const axiosError = new Error("Network error");
      axiosError.response = { data: "Error data" };
      axiosError.config = {
        url: "https://maps.googleapis.com/maps/api/place/autocomplete/json",
        params: {
          input: "Restaurant",
          types: "restaurant",
          components: "country:nz",
          key: "test-api-key",
        },
      };

      // Mock axios to throw error
      axios.get.mockRejectedValue(axiosError);

      await getPlaceAutocomplete(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Error fetching place autocomplete",
        error: "Network error",
        details: "Error data",
      });
    });
  });

  describe("getPlaceDetails", () => {
    it("should return 400 if placeId parameter is missing", async () => {
      await getPlaceDetails(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Place ID is required",
      });
    });

    it("should return 500 if Google Places API key is not configured", async () => {
      // Remove API key from environment
      delete process.env.GOOGLE_PLACES_API_KEY;

      req.query = { placeId: "place123" };

      await getPlaceDetails(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Google Places API key is not configured",
      });
    });

    it("should return 500 if Google Places API returns an error status", async () => {
      req.query = { placeId: "invalid-place-id" };

      // Mock axios to return error status
      axios.get.mockResolvedValue({
        data: {
          status: "INVALID_REQUEST",
          error_message: "Invalid place ID",
        },
      });

      await getPlaceDetails(req, res);

      expect(axios.get).toHaveBeenCalledWith(
        "https://maps.googleapis.com/maps/api/place/details/json",
        expect.any(Object)
      );

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Error from Google Places API",
        status: "INVALID_REQUEST",
        error_message: "Invalid place ID",
      });
    });

    it("should return place details when successful", async () => {
      req.query = { placeId: "place123" };

      const mockPlaceDetails = {
        name: "Restaurant Name",
        formatted_address: "123 Example St, Auckland",
        rating: 4.5,
        user_ratings_total: 100,
        geometry: { location: { lat: -36.8, lng: 174.7 } },
        photos: [{ photo_reference: "photo1" }],
      };

      // Mock axios to return place details
      axios.get.mockResolvedValue({
        data: {
          status: "OK",
          result: mockPlaceDetails,
        },
      });

      await getPlaceDetails(req, res);

      expect(axios.get).toHaveBeenCalledWith(
        "https://maps.googleapis.com/maps/api/place/details/json",
        {
          params: {
            place_id: "place123",
            fields:
              "name,formatted_address,rating,user_ratings_total,opening_hours,geometry,photos",
            key: "test-api-key",
          },
        }
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: mockPlaceDetails,
      });
    });

    it("should handle axios error", async () => {
      req.query = { placeId: "place123" };

      // Mock axios to throw error
      axios.get.mockRejectedValue(new Error("Network error"));

      await getPlaceDetails(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Error fetching place details",
        error: "Network error",
      });
    });
  });
});
