import { WorkoutManager, WorkoutState } from '../services/WorkoutManager';
import { LocationServiceImpl } from '../services/LocationServiceImpl';
import { StorageServiceImpl } from '../services/StorageServiceImpl';
import { LocationPoint } from '../models';

// Mock the dependencies
jest.mock('../services/LocationServiceImpl');
jest.mock('../services/StorageServiceImpl');
jest.mock('@react-native-community/geolocation');

describe('WorkoutManager Integration Tests', () => {
  let workoutManager: WorkoutManager;
  let mockLocationService: jest.Mocked<LocationServiceImpl>;
  let mockStorageService: jest.Mocked<StorageServiceImpl>;
  let locationCallback: ((location: LocationPoint) => void) | null = null;

  beforeEach(() => {
    // Create mocked services
    mockLocationService = new LocationServiceImpl() as jest.Mocked<LocationServiceImpl>;
    mockStorageService = new StorageServiceImpl() as jest.Mocked<StorageServiceImpl>;
    
    // Mock LocationService methods
    mockLocationService.startTracking = jest.fn().mockResolvedValue(undefined);
    mockLocationService.stopTracking = jest.fn().mockResolvedValue(undefined);
    mockLocationService.calculateTotalDistance = jest.fn().mockReturnValue(1000); // 1km
    mockLocationService.subscribeToLocationUpdates = jest.fn().mockImplementation((callback) => {
      locationCallback = callback;
      return () => { locationCallback = null; };
    });
    
    // Mock StorageService methods
    mockStorageService.saveWorkout = jest.fn().mockResolvedValue(undefined);
    
    // Create WorkoutManager with mocked services
    workoutManager = new WorkoutManager(mockLocationService, mockStorageService);
    
    jest.clearAllMocks();
  });

  describe('Complete Workout Flow', () => {
    it('should successfully complete a full workout cycle', async () => {
      // Start workout
      const session = await workoutManager.startWorkout('run');
      
      expect(session).toBeDefined();
      expect(session.type).toBe('run');
      expect(session.state).toBe(WorkoutState.ACTIVE);
      expect(mockLocationService.startTracking).toHaveBeenCalledWith({
        updateInterval: 3000, // 3 seconds for running
        distanceFilter: 5,
        highAccuracy: true,
        backgroundTracking: true,
        useKalmanFilter: true
      });
      
      // Simulate location updates
      const mockLocations: LocationPoint[] = [
        {
          latitude: 40.7128,
          longitude: -74.0060,
          timestamp: new Date('2023-01-01T12:00:00Z'),
          accuracy: 10
        },
        {
          latitude: 40.7138,
          longitude: -74.0070,
          timestamp: new Date('2023-01-01T12:00:30Z'),
          accuracy: 8
        },
        {
          latitude: 40.7148,
          longitude: -74.0080,
          timestamp: new Date('2023-01-01T12:01:00Z'),
          accuracy: 12
        }
      ];
      
      // Send location updates
      mockLocations.forEach(location => {
        if (locationCallback) {
          locationCallback(location);
        }
      });
      
      // Check that session has been updated
      const currentSession = workoutManager.getCurrentSession();
      expect(currentSession?.gpsPoints.length).toBe(3);
      
      // Pause workout
      await workoutManager.pauseWorkout();
      
      const pausedSession = workoutManager.getCurrentSession();
      expect(pausedSession?.state).toBe(WorkoutState.PAUSED);
      expect(mockLocationService.stopTracking).toHaveBeenCalled();
      
      // Resume workout
      await workoutManager.resumeWorkout();
      
      const resumedSession = workoutManager.getCurrentSession();
      expect(resumedSession?.state).toBe(WorkoutState.ACTIVE);
      expect(mockLocationService.startTracking).toHaveBeenCalledTimes(2);
      
      // Stop workout
      const completedWorkout = await workoutManager.stopWorkout();
      
      expect(completedWorkout).toBeDefined();
      expect(completedWorkout.type).toBe('run');
      expect(completedWorkout.gpsPoints.length).toBe(3);
      expect(mockStorageService.saveWorkout).toHaveBeenCalledWith(completedWorkout);
      expect(mockLocationService.stopTracking).toHaveBeenCalledTimes(2);
      
      // Check that session is cleared
      expect(workoutManager.getCurrentSession()).toBeNull();
    });
    
    it('should handle workout with different activity types', async () => {
      // Test walking workout
      const walkSession = await workoutManager.startWorkout('walk');
      expect(walkSession.type).toBe('walk');
      expect(mockLocationService.startTracking).toHaveBeenCalledWith({
        updateInterval: 5000, // 5 seconds for walking
        distanceFilter: 3,
        highAccuracy: true,
        backgroundTracking: true,
        useKalmanFilter: true
      });
      
      await workoutManager.stopWorkout();
      
      // Test biking workout
      const bikeSession = await workoutManager.startWorkout('bike');
      expect(bikeSession.type).toBe('bike');
      expect(mockLocationService.startTracking).toHaveBeenCalledWith({
        updateInterval: 5000, // 5 seconds for biking
        distanceFilter: 10,
        highAccuracy: true,
        backgroundTracking: true,
        useKalmanFilter: true
      });
      
      await workoutManager.stopWorkout();
    });
    
    it('should calculate statistics correctly during workout', async () => {
      // Start workout
      await workoutManager.startWorkout('run');
      
      // Simulate location updates with known distances
      const mockLocations: LocationPoint[] = [
        {
          latitude: 40.7128,
          longitude: -74.0060,
          timestamp: new Date('2023-01-01T12:00:00Z'),
          accuracy: 10
        },
        {
          latitude: 40.7138,
          longitude: -74.0070,
          timestamp: new Date('2023-01-01T12:00:30Z'), // 30 seconds later
          accuracy: 8
        }
      ];
      
      // Mock distance calculation to return 100 meters
      mockLocationService.calculateTotalDistance.mockReturnValue(100);
      
      // Send location updates
      mockLocations.forEach(location => {
        if (locationCallback) {
          locationCallback(location);
        }
      });
      
      // Wait a bit for stats to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const stats = workoutManager.getCurrentStats();
      expect(stats).toBeDefined();
      expect(stats?.distance).toBe(100);
      expect(stats?.currentSpeed).toBeGreaterThan(0);
      expect(stats?.maxSpeed).toBeGreaterThan(0);
    });
    
    it('should filter out poor quality GPS points', async () => {
      await workoutManager.startWorkout('run');
      
      // Simulate location updates with poor accuracy
      const mockLocations: LocationPoint[] = [
        {
          latitude: 40.7128,
          longitude: -74.0060,
          timestamp: new Date('2023-01-01T12:00:00Z'),
          accuracy: 10 // Good accuracy
        },
        {
          latitude: 40.7138,
          longitude: -74.0070,
          timestamp: new Date('2023-01-01T12:00:30Z'),
          accuracy: 100 // Poor accuracy - should be filtered out
        },
        {
          latitude: 40.7148,
          longitude: -74.0080,
          timestamp: new Date('2023-01-01T12:01:00Z'),
          accuracy: 5 // Good accuracy
        }
      ];
      
      // Send location updates
      mockLocations.forEach(location => {
        if (locationCallback) {
          locationCallback(location);
        }
      });
      
      const session = workoutManager.getCurrentSession();
      // Should only have 2 points (filtered out the one with poor accuracy)
      expect(session?.gpsPoints.length).toBe(2);
      expect(session?.gpsPoints[0].accuracy).toBe(10);
      expect(session?.gpsPoints[1].accuracy).toBe(5);
    });
    
    it('should handle pause and resume correctly with timing', async () => {
      const startTime = new Date('2023-01-01T12:00:00Z');
      jest.useFakeTimers();
      jest.setSystemTime(startTime);
      
      // Start workout
      await workoutManager.startWorkout('run');
      
      // Advance time by 60 seconds
      jest.advanceTimersByTime(60000);
      
      // Pause workout
      const pauseTime = new Date('2023-01-01T12:01:00Z');
      jest.setSystemTime(pauseTime);
      await workoutManager.pauseWorkout();
      
      // Advance time by 30 seconds while paused
      jest.advanceTimersByTime(30000);
      
      // Resume workout
      const resumeTime = new Date('2023-01-01T12:01:30Z');
      jest.setSystemTime(resumeTime);
      await workoutManager.resumeWorkout();
      
      // Advance time by 60 more seconds
      jest.advanceTimersByTime(60000);
      
      // Stop workout
      const stopTime = new Date('2023-01-01T12:02:30Z');
      jest.setSystemTime(stopTime);
      const workout = await workoutManager.stopWorkout();
      
      // Total time: 150 seconds, but 30 seconds were paused
      // So active duration should be 120 seconds
      expect(workout.duration).toBe(120);
      
      jest.useRealTimers();
    });
  });
  
  describe('Error Handling', () => {
    it('should handle location service errors gracefully', async () => {
      mockLocationService.startTracking.mockRejectedValue(new Error('GPS not available'));
      
      await expect(workoutManager.startWorkout('run')).rejects.toThrow('Failed to start workout');
    });
    
    it('should handle storage service errors gracefully', async () => {
      mockStorageService.saveWorkout.mockRejectedValue(new Error('Storage full'));
      
      await workoutManager.startWorkout('run');
      
      await expect(workoutManager.stopWorkout()).rejects.toThrow('Storage full');
    });
    
    it('should prevent starting multiple workouts', async () => {
      await workoutManager.startWorkout('run');
      
      await expect(workoutManager.startWorkout('walk')).rejects.toThrow('A workout is already in progress');
    });
    
    it('should prevent pausing when no workout is active', async () => {
      await expect(workoutManager.pauseWorkout()).rejects.toThrow('No active workout to pause');
    });
    
    it('should prevent resuming when no workout is paused', async () => {
      await expect(workoutManager.resumeWorkout()).rejects.toThrow('No paused workout to resume');
    });
    
    it('should prevent stopping when no workout is active', async () => {
      await expect(workoutManager.stopWorkout()).rejects.toThrow('No workout session to stop');
    });
  });
  
  describe('Activity Configuration', () => {
    it('should return correct configuration for each activity type', () => {
      const walkConfig = workoutManager.getActivityConfig('walk');
      expect(walkConfig.type).toBe('walk');
      expect(walkConfig.minSpeed).toBe(0.5);
      expect(walkConfig.maxReasonableSpeed).toBe(3.0);
      expect(walkConfig.gpsUpdateInterval).toBe(5);
      expect(walkConfig.distanceFilter).toBe(3);
      
      const runConfig = workoutManager.getActivityConfig('run');
      expect(runConfig.type).toBe('run');
      expect(runConfig.minSpeed).toBe(1.5);
      expect(runConfig.maxReasonableSpeed).toBe(8.0);
      expect(runConfig.gpsUpdateInterval).toBe(3);
      expect(runConfig.distanceFilter).toBe(5);
      
      const bikeConfig = workoutManager.getActivityConfig('bike');
      expect(bikeConfig.type).toBe('bike');
      expect(bikeConfig.minSpeed).toBe(2.0);
      expect(bikeConfig.maxReasonableSpeed).toBe(20.0);
      expect(bikeConfig.gpsUpdateInterval).toBe(5);
      expect(bikeConfig.distanceFilter).toBe(10);
    });
  });
  
  describe('Utility Methods', () => {
    it('should correctly report workout status', async () => {
      expect(workoutManager.isWorkoutActive()).toBe(false);
      
      await workoutManager.startWorkout('run');
      expect(workoutManager.isWorkoutActive()).toBe(true);
      
      await workoutManager.pauseWorkout();
      expect(workoutManager.isWorkoutActive()).toBe(true); // Still active, just paused
      
      await workoutManager.resumeWorkout();
      expect(workoutManager.isWorkoutActive()).toBe(true);
      
      await workoutManager.stopWorkout();
      expect(workoutManager.isWorkoutActive()).toBe(false);
    });
    
    it('should return current session and stats', async () => {
      expect(workoutManager.getCurrentSession()).toBeNull();
      expect(workoutManager.getCurrentStats()).toBeNull();
      
      const session = await workoutManager.startWorkout('run');
      
      expect(workoutManager.getCurrentSession()).toEqual(session);
      expect(workoutManager.getCurrentStats()).toEqual(session.stats);
      
      await workoutManager.stopWorkout();
      
      expect(workoutManager.getCurrentSession()).toBeNull();
      expect(workoutManager.getCurrentStats()).toBeNull();
    });
  });
});
