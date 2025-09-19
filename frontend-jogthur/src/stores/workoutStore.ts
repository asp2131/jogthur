import React from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MMKV } from 'react-native-mmkv';
import { WorkoutManager, WorkoutSession, WorkoutStats, WorkoutState } from '../services/WorkoutManager';
import { LocationServiceImpl } from '../services/LocationServiceImpl';
import { StorageServiceImpl } from '../services/StorageServiceImpl';
import { Workout, ActivityType, UserPreferences } from '../models';

// Initialize MMKV for Zustand persistence
const storage = new MMKV({
  id: 'workout-store',
  encryptionKey: 'workout-store-key'
});

// Zustand storage adapter for MMKV
const mmkvStorage = {
  getItem: (name: string) => {
    const value = storage.getString(name);
    return value ? JSON.parse(value) : null;
  },
  setItem: (name: string, value: any) => {
    storage.set(name, JSON.stringify(value));
  },
  removeItem: (name: string) => {
    storage.delete(name);
  }
};

/**
 * Workout store state interface.
 */
interface WorkoutStore {
  // Services
  workoutManager: WorkoutManager;
  
  // Current workout session
  currentSession: WorkoutSession | null;
  currentStats: WorkoutStats | null;
  
  // Workout history
  workouts: Workout[];
  
  // User preferences
  userPreferences: UserPreferences | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Actions
  startWorkout: (activityType: ActivityType) => Promise<void>;
  pauseWorkout: () => Promise<void>;
  resumeWorkout: () => Promise<void>;
  stopWorkout: () => Promise<Workout>;
  
  // Workout history actions
  loadWorkouts: () => Promise<void>;
  deleteWorkout: (id: string) => Promise<void>;
  
  // User preferences actions
  loadUserPreferences: () => Promise<void>;
  updateUserPreferences: (preferences: UserPreferences) => Promise<void>;
  
  // Utility actions
  clearError: () => void;
  refreshStats: () => void;
}

/**
 * Create the workout store with Zustand.
 */
export const useWorkoutStore = create<WorkoutStore>()(
  persist(
    (set, get) => {
      // Initialize services
      const locationService = new LocationServiceImpl();
      const storageService = new StorageServiceImpl();
      const workoutManager = new WorkoutManager(locationService, storageService);
      
      return {
        // Services
        workoutManager,
        
        // Initial state
        currentSession: null,
        currentStats: null,
        workouts: [],
        userPreferences: null,
        isLoading: false,
        error: null,
        
        // Workout control actions
        startWorkout: async (activityType: ActivityType) => {
          const { workoutManager } = get();
          
          try {
            set({ isLoading: true, error: null });
            
            const session = await workoutManager.startWorkout(activityType);
            
            set({ 
              currentSession: session,
              currentStats: session.stats,
              isLoading: false 
            });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to start workout',
              isLoading: false 
            });
            throw error;
          }
        },
        
        pauseWorkout: async () => {
          const { workoutManager } = get();
          
          try {
            set({ isLoading: true, error: null });
            
            await workoutManager.pauseWorkout();
            
            const currentSession = workoutManager.getCurrentSession();
            set({ 
              currentSession,
              isLoading: false 
            });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to pause workout',
              isLoading: false 
            });
            throw error;
          }
        },
        
        resumeWorkout: async () => {
          const { workoutManager } = get();
          
          try {
            set({ isLoading: true, error: null });
            
            await workoutManager.resumeWorkout();
            
            const currentSession = workoutManager.getCurrentSession();
            const currentStats = workoutManager.getCurrentStats();
            
            set({ 
              currentSession,
              currentStats,
              isLoading: false 
            });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to resume workout',
              isLoading: false 
            });
            throw error;
          }
        },
        
        stopWorkout: async () => {
          const { workoutManager, workouts } = get();
          
          try {
            set({ isLoading: true, error: null });
            
            const completedWorkout = await workoutManager.stopWorkout();
            
            // Add the completed workout to the history
            const updatedWorkouts = [completedWorkout, ...workouts];
            
            set({ 
              currentSession: null,
              currentStats: null,
              workouts: updatedWorkouts,
              isLoading: false 
            });
            
            return completedWorkout;
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to stop workout',
              isLoading: false 
            });
            throw error;
          }
        },
        
        // Workout history actions
        loadWorkouts: async () => {
          const { workoutManager } = get();
          
          try {
            set({ isLoading: true, error: null });
            
            const workouts = await workoutManager['storageService'].getAllWorkouts({
              sortBy: 'startTime',
              sortDirection: 'desc'
            });
            
            set({ 
              workouts,
              isLoading: false 
            });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to load workouts',
              isLoading: false 
            });
          }
        },
        
        deleteWorkout: async (id: string) => {
          const { workoutManager, workouts } = get();
          
          try {
            set({ isLoading: true, error: null });
            
            const success = await workoutManager['storageService'].deleteWorkout(id);
            
            if (success) {
              const updatedWorkouts = workouts.filter(workout => workout.id !== id);
              set({ 
                workouts: updatedWorkouts,
                isLoading: false 
              });
            } else {
              throw new Error('Failed to delete workout');
            }
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to delete workout',
              isLoading: false 
            });
            throw error;
          }
        },
        
        // User preferences actions
        loadUserPreferences: async () => {
          const { workoutManager } = get();
          
          try {
            const preferences = await workoutManager['storageService'].getUserPreferences();
            set({ userPreferences: preferences });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to load user preferences'
            });
          }
        },
        
        updateUserPreferences: async (preferences: UserPreferences) => {
          const { workoutManager } = get();
          
          try {
            set({ isLoading: true, error: null });
            
            await workoutManager['storageService'].saveUserPreferences(preferences);
            
            set({ 
              userPreferences: preferences,
              isLoading: false 
            });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to update user preferences',
              isLoading: false 
            });
            throw error;
          }
        },
        
        // Utility actions
        clearError: () => {
          set({ error: null });
        },
        
        refreshStats: () => {
          const { workoutManager } = get();
          const currentStats = workoutManager.getCurrentStats();
          const currentSession = workoutManager.getCurrentSession();
          
          set({ 
            currentStats,
            currentSession 
          });
        }
      };
    },
    {
      name: 'workout-store',
      storage: createJSONStorage(() => mmkvStorage),
      // Only persist user preferences and workout history, not current session
      partialize: (state) => ({
        userPreferences: state.userPreferences,
        workouts: state.workouts
      })
    }
  )
);

/**
 * Hook to get workout statistics with automatic updates.
 * This hook will automatically refresh stats every second when a workout is active.
 */
export const useWorkoutStats = () => {
  const { currentStats, currentSession, refreshStats } = useWorkoutStore();
  
  // Set up automatic stats refresh when workout is active
  React.useEffect(() => {
    if (currentSession?.state === WorkoutState.ACTIVE) {
      const interval = setInterval(refreshStats, 1000);
      return () => clearInterval(interval);
    }
  }, [currentSession?.state, refreshStats]);
  
  return currentStats;
};

/**
 * Hook to get current workout session.
 */
export const useCurrentWorkout = () => {
  const { currentSession, currentStats } = useWorkoutStore();
  
  return {
    session: currentSession,
    stats: currentStats,
    isActive: currentSession?.state === WorkoutState.ACTIVE,
    isPaused: currentSession?.state === WorkoutState.PAUSED,
    isIdle: !currentSession || currentSession.state === WorkoutState.IDLE
  };
};

/**
 * Hook for workout control actions.
 */
export const useWorkoutActions = () => {
  const { 
    startWorkout, 
    pauseWorkout, 
    resumeWorkout, 
    stopWorkout,
    isLoading,
    error,
    clearError
  } = useWorkoutStore();
  
  return {
    startWorkout,
    pauseWorkout,
    resumeWorkout,
    stopWorkout,
    isLoading,
    error,
    clearError
  };
};

/**
 * Hook for workout history management.
 */
export const useWorkoutHistory = () => {
  const { 
    workouts, 
    loadWorkouts, 
    deleteWorkout,
    isLoading,
    error
  } = useWorkoutStore();
  
  return {
    workouts,
    loadWorkouts,
    deleteWorkout,
    isLoading,
    error
  };
};

/**
 * Hook for user preferences management.
 */
export const useUserPreferences = () => {
  const { 
    userPreferences, 
    loadUserPreferences, 
    updateUserPreferences,
    isLoading,
    error
  } = useWorkoutStore();
  
  return {
    preferences: userPreferences,
    loadPreferences: loadUserPreferences,
    updatePreferences: updateUserPreferences,
    isLoading,
    error
  };
};
