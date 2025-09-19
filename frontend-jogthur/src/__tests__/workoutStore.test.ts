import { renderHook, act } from '@testing-library/react-hooks';
import { useWorkoutStore, useWorkoutActions, useCurrentWorkout } from '../stores/workoutStore';
import { WorkoutState } from '../services/WorkoutManager';

// Mock the dependencies
jest.mock('../services/LocationServiceImpl');
jest.mock('../services/StorageServiceImpl');
jest.mock('react-native-mmkv');

// Mock MMKV
const mockMMKV = {
  set: jest.fn(),
  getString: jest.fn().mockReturnValue(null),
  getBoolean: jest.fn().mockReturnValue(false),
  contains: jest.fn().mockReturnValue(false),
  delete: jest.fn(),
  clearAll: jest.fn(),
  getAllKeys: jest.fn().mockReturnValue([])
};

jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => mockMMKV)
}));

describe('Workout Store', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset store state
    useWorkoutStore.getState().currentSession = null;
    useWorkoutStore.getState().currentStats = null;
    useWorkoutStore.getState().workouts = [];
    useWorkoutStore.getState().error = null;
    useWorkoutStore.getState().isLoading = false;
  });

  describe('useWorkoutActions', () => {
    it('should start a workout successfully', async () => {
      const { result } = renderHook(() => useWorkoutActions());
      
      await act(async () => {
        await result.current.startWorkout('run');
      });
      
      const state = useWorkoutStore.getState();
      expect(state.currentSession).toBeDefined();
      expect(state.currentSession?.type).toBe('run');
      expect(state.currentSession?.state).toBe(WorkoutState.ACTIVE);
      expect(state.error).toBeNull();
    });
    
    it('should handle start workout errors', async () => {
      // Mock the workout manager to throw an error
      const originalWorkoutManager = useWorkoutStore.getState().workoutManager;
      const mockStartWorkout = jest.fn().mockRejectedValue(new Error('GPS not available'));
      useWorkoutStore.getState().workoutManager.startWorkout = mockStartWorkout;
      
      const { result } = renderHook(() => useWorkoutActions());
      
      await act(async () => {
        try {
          await result.current.startWorkout('run');
        } catch (error) {
          // Expected to throw
        }
      });
      
      const state = useWorkoutStore.getState();
      expect(state.error).toBe('GPS not available');
      expect(state.currentSession).toBeNull();
      
      // Restore original
      useWorkoutStore.getState().workoutManager = originalWorkoutManager;
    });
    
    it('should pause and resume workout', async () => {
      const { result } = renderHook(() => useWorkoutActions());
      
      // Start workout first
      await act(async () => {
        await result.current.startWorkout('run');
      });
      
      // Pause workout
      await act(async () => {
        await result.current.pauseWorkout();
      });
      
      let state = useWorkoutStore.getState();
      expect(state.currentSession?.state).toBe(WorkoutState.PAUSED);
      
      // Resume workout
      await act(async () => {
        await result.current.resumeWorkout();
      });
      
      state = useWorkoutStore.getState();
      expect(state.currentSession?.state).toBe(WorkoutState.ACTIVE);
    });
    
    it('should stop workout and save it', async () => {
      const { result } = renderHook(() => useWorkoutActions());
      
      // Start workout first
      await act(async () => {
        await result.current.startWorkout('run');
      });
      
      // Stop workout
      let completedWorkout;
      await act(async () => {
        completedWorkout = await result.current.stopWorkout();
      });
      
      const state = useWorkoutStore.getState();
      expect(completedWorkout).toBeDefined();
      expect(state.currentSession).toBeNull();
      expect(state.currentStats).toBeNull();
      expect(state.workouts).toContain(completedWorkout);
    });
    
    it('should clear errors', () => {
      const { result } = renderHook(() => useWorkoutActions());
      
      // Set an error
      act(() => {
        useWorkoutStore.setState({ error: 'Test error' });
      });
      
      expect(useWorkoutStore.getState().error).toBe('Test error');
      
      // Clear error
      act(() => {
        result.current.clearError();
      });
      
      expect(useWorkoutStore.getState().error).toBeNull();
    });
  });
  
  describe('useCurrentWorkout', () => {
    it('should return correct workout status', async () => {
      const { result: actionsResult } = renderHook(() => useWorkoutActions());
      const { result: workoutResult } = renderHook(() => useCurrentWorkout());
      
      // Initially idle
      expect(workoutResult.current.isIdle).toBe(true);
      expect(workoutResult.current.isActive).toBe(false);
      expect(workoutResult.current.isPaused).toBe(false);
      
      // Start workout
      await act(async () => {
        await actionsResult.current.startWorkout('run');
      });
      
      expect(workoutResult.current.isIdle).toBe(false);
      expect(workoutResult.current.isActive).toBe(true);
      expect(workoutResult.current.isPaused).toBe(false);
      
      // Pause workout
      await act(async () => {
        await actionsResult.current.pauseWorkout();
      });
      
      expect(workoutResult.current.isIdle).toBe(false);
      expect(workoutResult.current.isActive).toBe(false);
      expect(workoutResult.current.isPaused).toBe(true);
      
      // Resume workout
      await act(async () => {
        await actionsResult.current.resumeWorkout();
      });
      
      expect(workoutResult.current.isIdle).toBe(false);
      expect(workoutResult.current.isActive).toBe(true);
      expect(workoutResult.current.isPaused).toBe(false);
      
      // Stop workout
      await act(async () => {
        await actionsResult.current.stopWorkout();
      });
      
      expect(workoutResult.current.isIdle).toBe(true);
      expect(workoutResult.current.isActive).toBe(false);
      expect(workoutResult.current.isPaused).toBe(false);
    });
    
    it('should return session and stats', async () => {
      const { result: actionsResult } = renderHook(() => useWorkoutActions());
      const { result: workoutResult } = renderHook(() => useCurrentWorkout());
      
      expect(workoutResult.current.session).toBeNull();
      expect(workoutResult.current.stats).toBeNull();
      
      await act(async () => {
        await actionsResult.current.startWorkout('run');
      });
      
      expect(workoutResult.current.session).toBeDefined();
      expect(workoutResult.current.stats).toBeDefined();
      expect(workoutResult.current.session?.type).toBe('run');
    });
  });
  
  describe('Workout History', () => {
    it('should load workouts from storage', async () => {
      // Mock storage service to return some workouts
      const mockWorkouts = [
        {
          id: '1',
          type: 'run' as const,
          startTime: new Date('2023-01-01T12:00:00Z'),
          endTime: new Date('2023-01-01T12:30:00Z'),
          distance: 5000,
          duration: 1800,
          avgPace: 360,
          maxSpeed: 3.5,
          gpsPoints: []
        },
        {
          id: '2',
          type: 'walk' as const,
          startTime: new Date('2023-01-02T12:00:00Z'),
          endTime: new Date('2023-01-02T13:00:00Z'),
          distance: 3000,
          duration: 3600,
          avgPace: 1200,
          maxSpeed: 1.5,
          gpsPoints: []
        }
      ];
      
      const mockGetAllWorkouts = jest.fn().mockResolvedValue(mockWorkouts);
      useWorkoutStore.getState().workoutManager['storageService'].getAllWorkouts = mockGetAllWorkouts;
      
      await act(async () => {
        await useWorkoutStore.getState().loadWorkouts();
      });
      
      const state = useWorkoutStore.getState();
      expect(state.workouts).toEqual(mockWorkouts);
      expect(mockGetAllWorkouts).toHaveBeenCalledWith({
        sortBy: 'startTime',
        sortDirection: 'desc'
      });
    });
    
    it('should delete a workout', async () => {
      // Set up initial workouts
      const initialWorkouts = [
        {
          id: '1',
          type: 'run' as const,
          startTime: new Date('2023-01-01T12:00:00Z'),
          endTime: new Date('2023-01-01T12:30:00Z'),
          distance: 5000,
          duration: 1800,
          avgPace: 360,
          maxSpeed: 3.5,
          gpsPoints: []
        },
        {
          id: '2',
          type: 'walk' as const,
          startTime: new Date('2023-01-02T12:00:00Z'),
          endTime: new Date('2023-01-02T13:00:00Z'),
          distance: 3000,
          duration: 3600,
          avgPace: 1200,
          maxSpeed: 1.5,
          gpsPoints: []
        }
      ];
      
      act(() => {
        useWorkoutStore.setState({ workouts: initialWorkouts });
      });
      
      // Mock delete workout to return success
      const mockDeleteWorkout = jest.fn().mockResolvedValue(true);
      useWorkoutStore.getState().workoutManager['storageService'].deleteWorkout = mockDeleteWorkout;
      
      await act(async () => {
        await useWorkoutStore.getState().deleteWorkout('1');
      });
      
      const state = useWorkoutStore.getState();
      expect(state.workouts).toHaveLength(1);
      expect(state.workouts[0].id).toBe('2');
      expect(mockDeleteWorkout).toHaveBeenCalledWith('1');
    });
  });
  
  describe('User Preferences', () => {
    it('should load user preferences', async () => {
      const mockPreferences = {
        units: 'imperial' as const,
        defaultActivityType: 'bike' as const,
        autoBackgroundTracking: false,
        gpsUpdateInterval: 10,
        theme: 'dark' as const,
        enableHapticFeedback: false,
        enableAnimations: true
      };
      
      const mockGetUserPreferences = jest.fn().mockResolvedValue(mockPreferences);
      useWorkoutStore.getState().workoutManager['storageService'].getUserPreferences = mockGetUserPreferences;
      
      await act(async () => {
        await useWorkoutStore.getState().loadUserPreferences();
      });
      
      const state = useWorkoutStore.getState();
      expect(state.userPreferences).toEqual(mockPreferences);
    });
    
    it('should update user preferences', async () => {
      const newPreferences = {
        units: 'metric' as const,
        defaultActivityType: 'run' as const,
        autoBackgroundTracking: true,
        gpsUpdateInterval: 5,
        theme: 'light' as const,
        enableHapticFeedback: true,
        enableAnimations: true
      };
      
      const mockSaveUserPreferences = jest.fn().mockResolvedValue(undefined);
      useWorkoutStore.getState().workoutManager['storageService'].saveUserPreferences = mockSaveUserPreferences;
      
      await act(async () => {
        await useWorkoutStore.getState().updateUserPreferences(newPreferences);
      });
      
      const state = useWorkoutStore.getState();
      expect(state.userPreferences).toEqual(newPreferences);
      expect(mockSaveUserPreferences).toHaveBeenCalledWith(newPreferences);
    });
  });
  
  describe('Loading States', () => {
    it('should set loading state during async operations', async () => {
      const { result } = renderHook(() => useWorkoutActions());
      
      // Mock a slow start workout
      const mockStartWorkout = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );
      useWorkoutStore.getState().workoutManager.startWorkout = mockStartWorkout;
      
      let state = useWorkoutStore.getState();
      expect(state.isLoading).toBe(false);
      
      // Start the async operation
      const startPromise = act(async () => {
        await result.current.startWorkout('run');
      });
      
      // Check loading state is true during operation
      state = useWorkoutStore.getState();
      expect(state.isLoading).toBe(true);
      
      // Wait for completion
      await startPromise;
      
      // Check loading state is false after completion
      state = useWorkoutStore.getState();
      expect(state.isLoading).toBe(false);
    });
  });
  
  describe('Store Persistence', () => {
    it('should persist user preferences and workout history', () => {
      const testPreferences = {
        units: 'metric' as const,
        defaultActivityType: 'run' as const,
        autoBackgroundTracking: true,
        gpsUpdateInterval: 5,
        theme: 'auto' as const,
        enableHapticFeedback: true,
        enableAnimations: true
      };
      
      const testWorkouts = [
        {
          id: '1',
          type: 'run' as const,
          startTime: new Date('2023-01-01T12:00:00Z'),
          endTime: new Date('2023-01-01T12:30:00Z'),
          distance: 5000,
          duration: 1800,
          avgPace: 360,
          maxSpeed: 3.5,
          gpsPoints: []
        }
      ];
      
      act(() => {
        useWorkoutStore.setState({
          userPreferences: testPreferences,
          workouts: testWorkouts,
          currentSession: {
            id: 'test',
            type: 'run',
            state: WorkoutState.ACTIVE,
            startTime: new Date(),
            gpsPoints: [],
            stats: {
              distance: 0,
              duration: 0,
              activeDuration: 0,
              currentPace: 0,
              averagePace: 0,
              currentSpeed: 0,
              maxSpeed: 0
            },
            totalPausedDuration: 0
          }
        });
      });
      
      // The store should have called MMKV.set with the persisted data
      // Note: currentSession should not be persisted
      expect(mockMMKV.set).toHaveBeenCalled();
    });
  });
});
