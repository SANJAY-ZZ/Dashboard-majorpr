import api from './api';

const authService = {
  async register(data) {
    const res = await api.post('/auth/register', data);
    if (res.token) {
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
    }
    return res;
  },

  async login(data) {
    const res = await api.post('/auth/login', data);
    if (res.token) {
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
    }
    return res;
  },

  async logout() {
    try {
      await api.post('/auth/logout', {});
    } catch (err) {
      // Continue client cleanup regardless of server logout response
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  async me() {
    return await api.get('/auth/me');
  },

  async changePassword(currentPassword, newPassword) {
    return await api.put('/auth/change-password', { currentPassword, newPassword });
  },

  async forgotPassword(email) {
    return await api.post('/auth/forgot-password', { email });
  },

  async resetPassword(token, newPassword) {
    return await api.post('/auth/reset-password', { token, newPassword });
  },

  getToken() {
    return localStorage.getItem('token');
  },

  getUser() {
    const val = localStorage.getItem('user');
    try {
      return val ? JSON.parse(val) : null;
    } catch {
      return null;
    }
  },

  isAuthenticated() {
    return Boolean(localStorage.getItem('token'));
  },
};

export default authService;
