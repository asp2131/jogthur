import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { StorageUtils } from '@/utils/storage';

// Define the app state interface
interface AppState {
  // User preferences
  isDarkMode: boolean;
  isFirstLaunch: boolean;
  
  // App state
  isLoading: boolean;
  
  // Actions
  setDarkMode: (isDark: boolean) => void;
  setFirstLaunch: (isFirst: boolean) => void;
  setLoading: (loading: boolean) => void;
}

// Create the app store with persistence
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Initial state
      isDarkMode: false,
      isFirstLaunch: true,
      isLoading: false,
      
      // Actions
      setDarkMode: (isDark) => set({ isDarkMode: isDark }),
      setFirstLaunch: (isFirst) => set({ isFirstLaunch: isFirst }),
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'app-store',
      storage: createJSONStorage(() => ({
        getItem: (key) => StorageUtils.getString(key) ?? null,
        setItem: (key, value) => StorageUtils.setString(key, value),
        removeItem: (key) => StorageUtils.delete(key),
      })),
    }
  )
);

export default useAppStore;