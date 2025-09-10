import request from './request';

const dishesAPI = {
  getDishes: (restaurantId: string, params?: {
    category?: string;
    isVegetarian?: boolean;
    isVegan?: boolean;
    isGlutenFree?: boolean;
    minPrice?: number;
    maxPrice?: number;
    spicyLevel?: number;
    search?: string;
  }) => request.get(`/api/restaurants/${restaurantId}/dishes`, { params }),
  
  getDish: (id: string) =>
    request.get(`/api/dishes/${id}`),
  
  createDish: (restaurantId: string, data: FormData) =>
    request.post(`/api/restaurants/${restaurantId}/dishes`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  
  updateDish: (id: string, data: FormData) =>
    request.put(`/api/dishes/${id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  
  deleteDish: (id: string) =>
    request.delete(`/api/dishes/${id}`),
};

export default dishesAPI; 