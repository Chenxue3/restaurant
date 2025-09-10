// API base URL - update with your actual API URL for production
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Tokens
export const TOKEN_KEY = 'smartsavor_token';

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  RESTAURANT_ADMIN: '/admin/restaurants',
  RESTAURANT_ADMIN_DETAIL: (id: string) => `/admin/restaurants/${id}`,
  RESTAURANT_DETAIL: (id: string) => `/restaurants/${id}`,
  RESTAURANT_DISHES: (id: string) => `/admin/restaurants/${id}/dishes`,
  RESTAURANT_CATEGORIES: (id: string) => `/admin/restaurants/${id}/categories`,
  RESTAURANT_MENU: (id: string) => `/admin/restaurants/${id}/menu`,
  POST_CREATE: '/posts/create',
  POST_DETAIL: (id: string) => `/posts/${id}`,
  POST_DETAILS: (id: string) => `/posts/${id}`,
  PROFILE: '/profile',
  FAQS: '/faqs',
}; 