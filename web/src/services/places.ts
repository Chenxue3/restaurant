import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const placesAPI = {
  getAutocomplete: async (input: string, country: string = 'nz') => {
    const response = await axios.get(`${API_URL}/api/places/autocomplete`, {
      params: { input, country }
    });
    return response.data;
  },

  getDetails: async (placeId: string) => {
    const response = await axios.get(`${API_URL}/api/places/details`, {
      params: { placeId }
    });
    return response.data;
  }
}; 