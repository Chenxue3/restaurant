import axios from 'axios';

// @desc    Get place autocomplete suggestions
// @route   GET /api/places/autocomplete
// @access  Private
export const getPlaceAutocomplete = async (req, res) => {
  try {
    const { input, country = 'nz' } = req.query;
    
    if (!input) {
      return res.status(400).json({
        success: false,
        message: 'Input parameter is required'
      });
    }

    if (!process.env.GOOGLE_PLACES_API_KEY) {
      console.error('Google Places API key is not configured');
      return res.status(500).json({
        success: false,
        message: 'Google Places API key is not configured'
      });
    }

    const response = await axios.get('https://maps.googleapis.com/maps/api/place/autocomplete/json', {
      params: {
        input,
        types: 'restaurant',
        components: `country:${country}`,
        key: process.env.GOOGLE_PLACES_API_KEY
      }
    });

    if (response.data.status !== 'OK') {
      console.error('Google Places API error:', {
        status: response.data.status,
        error_message: response.data.error_message
      });
      return res.status(500).json({
        success: false,
        message: 'Error from Google Places API',
        status: response.data.status,
        error_message: response.data.error_message
      });
    }

    if (!response.data.predictions || response.data.predictions.length === 0) {
      console.log('No predictions found');
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    res.status(200).json({
      success: true,
      data: response.data.predictions
    });
  } catch (error) {
    console.error('Error fetching place autocomplete:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data,
      config: {
        url: error.config?.url,
        params: error.config?.params
      }
    });
    
    res.status(500).json({
      success: false,
      message: 'Error fetching place autocomplete',
      error: error.message,
      details: error.response?.data
    });
  }
};

// @desc    Get place details
// @route   GET /api/places/details
// @access  Private
export const getPlaceDetails = async (req, res) => {
  try {
    const { placeId } = req.query;
    
    if (!placeId) {
      return res.status(400).json({
        success: false,
        message: 'Place ID is required'
      });
    }

    if (!process.env.GOOGLE_PLACES_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Google Places API key is not configured'
      });
    }

    const response = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
      params: {
        place_id: placeId,
        fields: 'name,formatted_address,rating,user_ratings_total,opening_hours,geometry,photos',
        key: process.env.GOOGLE_PLACES_API_KEY
      }
    });

    if (response.data.status !== 'OK') {
      return res.status(500).json({
        success: false,
        message: 'Error from Google Places API',
        status: response.data.status,
        error_message: response.data.error_message
      });
    }

    console.log('Place details response:', {
      status: response.data.status,
      hasPhotos: response.data.result?.photos?.length > 0,
      photoCount: response.data.result?.photos?.length
    });

    res.status(200).json({
      success: true,
      data: response.data.result
    });
  } catch (error) {
    console.error('Error fetching place details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching place details',
      error: error.message
    });
  }
}; 