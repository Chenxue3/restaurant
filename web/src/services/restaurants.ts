import request from './request'

// Restaurants API
const restaurantsAPI = {
  getRestaurants: (params?: {
    search?: string;
    cuisine?: string;
    priceRange?: string;
    hasStudentDiscount?: boolean;
    sort?: 'name' | 'rating' | 'priceAsc' | 'priceDesc';
  }) => request.get('/api/restaurants', { params }),

  getMyRestaurants: (params?: {
    search?: string;
    cuisine?: string;
    priceRange?: string;
    hasStudentDiscount?: boolean;
    sort?: 'name' | 'rating' | 'priceAsc' | 'priceDesc';
  }) => request.get('/api/restaurants/my', { params }),

  getRestaurant: (id: string) =>
    request.get(`/api/restaurants/${id}`),

  createRestaurant: (data: FormData) =>
    request.post('/api/restaurants', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  updateRestaurant: (id: string, data: FormData) =>
    request.put(`/api/restaurants/${id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  updateRestaurantJson: (id: string, data: Record<string, unknown>) =>
    request.put(`/api/restaurants/${id}`, data, {
      headers: {
        'Content-Type': 'application/json',
      },
    }),

  deleteRestaurant: (id: string) =>
    request.delete(`/api/restaurants/${id}`),

  // Dish (menu) related endpoints
  getDishes: (restaurantId: string) =>
    request.get(`/api/restaurants/${restaurantId}/dishes`),

  createDish: (restaurantId: string, data: FormData) =>
    request.post(`/api/restaurants/${restaurantId}/dishes`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  updateDish: (restaurantId: string, dishId: string, data: FormData) =>
    request.put(`/api/dishes/${dishId}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  updateDishJson: (restaurantId: string, dishId: string, data: Record<string, unknown>) =>
    request.put(`/api/restaurants/${restaurantId}/dishes/${dishId}`, data, {
      headers: {
        'Content-Type': 'application/json',
      },
    }),

  deleteDish: (restaurantId: string, dishId: string) =>
    request.delete(`/api/dishes/${dishId}`),

  // Category related endpoints
  getCategories: (restaurantId: string) =>
    request.get(`/api/restaurants/${restaurantId}/categories`),

  createCategory: (restaurantId: string, data: Record<string, unknown>) =>
    request.post(`/api/restaurants/${restaurantId}/categories`, data, {
      headers: {
        'Content-Type': 'application/json',
      },
    }),

  updateCategory: (categoryId: string, data: Record<string, unknown>) =>
    request.put(`/api/categories/${categoryId}`, data, {
      headers: {
        'Content-Type': 'application/json',
      },
    }),

  deleteCategory: (categoryId: string) =>
    request.delete(`/api/categories/${categoryId}`),

  // Menu analysis endpoints
  analyzeMenuImage: (restaurantId: string, data: FormData) =>
    request.post(`/api/restaurants/${restaurantId}/analyze-menu`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  // Scan menu endpoint (without restaurant ID)
  scanMenu: (data: FormData) =>
    request.post('/api/scan-menu/analyze-menu', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  createDishesFromAnalysis: (restaurantId: string, data: Record<string, unknown>) =>
    request.post(`/api/restaurants/${restaurantId}/create-from-analysis`, data, {
      headers: {
        'Content-Type': 'application/json',
      },
    }),

  // Restaurant image endpoints
  uploadRestaurantImages: (restaurantId: string, data: FormData) =>
    request.post(`/api/restaurants/${restaurantId}/images`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  // Generate dish image using AI
  generateDishImage: (dishName: string, dishDescription: string = '') =>
    request.post('/api/dish-images/generate', {
      dishName,
      dishDescription
    }),

  deleteRestaurantImage: (restaurantId: string, imageUrl: string) =>
    request.delete(`/api/restaurants/${restaurantId}/images`, {
      headers: {
        'Content-Type': 'application/json',
      },
      data: { imageUrl },
    }),
}

export default restaurantsAPI
