import api from './api';

export const cartApi = {
  getCart: async () => {
    const response = await api.get('/cart');
    return response.data;
  },

  addItem: async (variantId, quantity = 1) => {
    const response = await api.post('/cart/items', { variantId, quantity });
    return response.data;
  },

  updateItem: async (itemId, quantity) => {
    const response = await api.put(`/cart/items/${itemId}`, { quantity });
    return response.data;
  },

  removeItem: async (itemId) => {
    const response = await api.delete(`/cart/items/${itemId}`);
    return response.data;
  },

  clearCart: async () => {
    const response = await api.delete('/cart');
    return response.data;
  },
};
