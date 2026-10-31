import { Platform } from 'react-native';

// Dynamically determine the backend host so localhost works on desktop,
// and 10.0.0.69 works on mobile Wi-Fi / physical devices.
export const getApiBaseUrl = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.hostname) {
    return `${window.location.protocol}//${window.location.hostname}:3001`;
  }
  return 'http://10.0.0.69:3001';
};

export const API_BASE_URL = getApiBaseUrl();
