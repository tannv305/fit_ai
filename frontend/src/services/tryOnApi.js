import axios from 'axios';

const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000/api/v1';

export const tryOnApi = {
  detectPose: async (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await axios.post(`${AI_SERVICE_URL}/pose/detect`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  virtualTryOn: async (personImageFile, clothingImageFile) => {
    const formData = new FormData();
    formData.append('personImage', personImageFile);
    formData.append('clothingImage', clothingImageFile);

    const response = await axios.post(`${AI_SERVICE_URL}/try-on`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
