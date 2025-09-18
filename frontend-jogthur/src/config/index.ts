// App configuration constants
export const CONFIG = {
  // Maps configuration
  GOOGLE_MAPS_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY',
  
  // Storage keys
  STORAGE_KEYS: {
    USER_PREFERENCES: 'user_preferences',
    WORKOUT_DATA: 'workout_data',
    SETTINGS: 'app_settings',
  },
  
  // App constants
  APP_NAME: 'FitTracker',
  VERSION: '1.0.0',
} as const;

export default CONFIG;