import request from './request';

const postsAPI = {
  getPosts: (params?: { 
    page?: number; 
    limit?: number; 
    restaurantTag?: string; 
    foodTag?: string; 
    user?: string;
    sort?: 'recent' | 'likes' | 'rating';
    search?: string;
  }) => request.get('/api/posts', { params }),
  
  getPost: (id: string) => 
    request.get(`/api/posts/${id}`),
  
  createPost: (data: FormData) => 
    request.post('/api/posts', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  
  updatePost: (id: string, data: FormData) => 
    request.put(`/api/posts/${id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  
  deletePost: (id: string) => 
    request.delete(`/api/posts/${id}`),
  
  likePost: (id: string) => 
    request.put(`/api/posts/${id}/like`),
  
  addComment: (postId: string, content: string) => 
    request.post(`/api/posts/${postId}/comments`, { content }),
  
  deleteComment: (commentId: string) => 
    request.delete(`/api/comments/${commentId}`),
}

export default postsAPI