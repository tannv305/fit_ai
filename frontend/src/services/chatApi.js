import api from './api';

export const chatApi = {
  sendMessage: async (message, sessionId = null) => {
    const response = await api.post('/ai/chat', { message, sessionId });
    return response.data;
  },

  getRecommendation: async (criteria) => {
    const response = await api.post('/ai/recommend', criteria);
    return response.data;
  },

  generateSpeech: async (text, voice = 'banmai', speed = 0) => {
    try {
      const response = await api.post('/tts', { text, voice, speed });
      return response.data;
    } catch (err) {
      console.error('Error generating FPT.AI TTS audio via backend:', err);
      return null;
    }
  },

  getSessions: async () => {
    const response = await api.get('/ai/chat/sessions');
    return response.data;
  },

  getSessionById: async (id) => {
    const response = await api.get(`/ai/chat/sessions/${id}`);
    return response.data;
  },
};
