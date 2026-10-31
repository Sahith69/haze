import { Platform } from 'react-native';

// Permanent Production Render Backend
const PRODUCTION_API_URL = 'https://haze-backend-lpwp.onrender.com';

export const getApiBaseUrl = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
    return 'http://localhost:3001';
  }
  return PRODUCTION_API_URL;
};

export const API_BASE_URL = getApiBaseUrl();
