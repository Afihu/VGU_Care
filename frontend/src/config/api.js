// Frontend API Configuration
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? process.env.REACT_APP_API_URL || 'https://vgu-care-backend-production.up.railway.app'
  : 'http://localhost:5001';

export default API_BASE_URL;

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/login',
    SIGNUP: '/api/signup',
    LOGOUT: '/api/logout'
  },
  USERS: {
    PROFILE: '/api/users/me',
    UPDATE_PROFILE: '/api/users/profile',
    CHANGE_PASSWORD: '/api/users/change-password'
  },
  APPOINTMENTS: {
    LIST: '/api/appointments',
    CREATE: '/api/appointments',
    UPDATE: '/api/appointments',
    DELETE: '/api/appointments'
  },
  MOOD: {
    LIST: '/api/mood-entries',
    CREATE: '/api/mood-entries',
    UPDATE: '/api/mood-entries',
    DELETE: '/api/mood-entries'
  },
  NOTIFICATIONS: {
    LIST: '/api/notifications',
    MARK_READ: '/api/notifications',
    DELETE: '/api/notifications'
  }
};