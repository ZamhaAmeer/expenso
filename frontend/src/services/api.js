import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Get host IP from Expo debugger host or fallback to your local Wi-Fi IP
const getBaseUrl = () => {
  // If running in Expo Go on a real device or simulator
  const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoClient?.hostUri || Constants.manifest?.debuggerHost;
  const ip = debuggerHost ? debuggerHost.split(':')[0] : '172.20.10.3';

  if (Platform.OS === 'web') {
    return 'http://localhost:5000/api';
  }

  return `http://${ip}:5000/api`;
};

const BASE_URL = getBaseUrl();
console.log('[Expenso API] Initialized with BASE_URL:', BASE_URL);

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    console.log(`[Expenso API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    const token = await AsyncStorage.getItem('expenso_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('[Expenso API Request Error]', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[Expenso API Response Error]', error.message, error.code, error.response?.status);
    return Promise.reject(error);
  }
);

export default api;
