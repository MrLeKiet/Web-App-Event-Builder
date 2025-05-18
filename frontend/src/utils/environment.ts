import { Platform } from 'react-native';

// Helper to get the correct API URL based on the platform
export const getApiUrl = () => {
    // For web, we can use localhost
    if (typeof window !== 'undefined' && window.location) {
        return 'http://localhost:5000/api';
    }

    // For Android emulator, use 10.0.2.2 instead of localhost
    // For iOS simulator, use localhost
    return Platform.OS === 'android'
        ? 'http://10.0.2.2:5000/api'
        : 'http://localhost:5000/api';
};