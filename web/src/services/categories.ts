import request from './request';

// Dish Categories API
const categoriesAPI = {
  getCategories: (restaurantId: string) =>
    request.get(`/api/restaurants/${restaurantId}/categories`),
  
  createCategory: (restaurantId: string, data: Record<string, unknown>) =>
    request.post(`/api/restaurants/${restaurantId}/categories`, data),
  
  updateCategory: (id: string, data: Record<string, unknown>) =>
    request.put(`/api/categories/${id}`, data),
  
  deleteCategory: (id: string) =>
    request.delete(`/api/categories/${id}`),
};

export default categoriesAPI;