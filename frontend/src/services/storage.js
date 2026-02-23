export const storage = {
  getToken() {
    return localStorage.getItem('access_token');
  },

  setToken(token) {
    localStorage.setItem('access_token', token);
  },

  getRefreshToken() {
    return localStorage.getItem('refresh_token');
  },

  setRefreshToken(token) {
    localStorage.setItem('refresh_token', token);
  },

  setTokens(access, refresh) {
    this.setToken(access);
    this.setRefreshToken(refresh);
  },

  clearTokens() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  },
};