import request from './request';

// Auth API
const authAPI = {
  sendVerificationCode: (email: string) => 
    request.post('/api/auth/send-code', { email }),
  
  verifyCode: async (email: string, code: string) => {
    try {
      console.log('Sending verify request:', { email, code });
      const response = await request.post('/api/auth/verify', { email, code });
      console.log('Verify response:', response);
      return response;
    } catch (error) {
      console.error('Verify error:', error);
      throw error;
    }
  },
  
  getCurrentUser: () => 
    request.get('/api/auth/me'),
  
  updateProfile: (data: { name: string }) => 
    request.put('/api/auth/profile', data),
}

export default authAPI