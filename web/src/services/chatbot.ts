import axios from 'axios';

const chatbotAPI = {
  sendMessage: async (message: string) => {
    try {
      const response = await axios.post('/api/chatbot', { message });
      return response;
    } catch (error) {
      console.error('Error sending message to chatbot:', error);
      throw error;
    }
  },
};

export default chatbotAPI; 