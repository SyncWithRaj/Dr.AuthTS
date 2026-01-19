import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Your backend URL
  withCredentials: true // Send cookies with requests
});
// Response interceptor for API calls
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Prevent infinite loops
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/refresh-token')) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh the token
        await api.post('/auth/refresh-token');

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login or handle logout
        // We can optionally trigger a global logout event here
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;