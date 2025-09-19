import { StorageServiceImpl } from '../services/StorageServiceImpl';
import { Workout, ActivityType } from '../models';
import { createDefaultUserPreferences } from '../utils/validation';

// Mock MMKV
jest.mock('react-native-mmkv', () => {
  const mockStorage = new Map();
  
  return {
    MMKV: jest.fn().mockImplementation(() => ({
      set: jest.fn((key, value) => {
        mockStorage.set(key, value);
        return true;
      }),
      getString: jest.fn((key) => mockStorage.get(key) || null),
      getBoolean: jest.fn((key) => {
        const value = mockStorage.get(key);
        return value === 'true' ? true : false;
      }),
      contains: jest.fn((key) => mockStorage.has(key)),
      delete: jest.fn((key) => {
        mockStorage.delete(key);
        return true;
      }),
      clearAll: jest.fn(() => {
        mockStorage.clear();
        return true;
      }),
      getAllKeys: jest.fn(() => Array.from(mockStorage.keys()))
    }))
  };
});

describe('StorageServiceImpl', () => {
  let storageService: StorageServiceImpl;
  
  beforeEach(() => {
    jest.clearAllMocks();
    storageService = new StorageServiceImpl();
  });
  
  describe('saveWorkout', () => {
    it('should save a valid workout', async () => {
      const workout: Workout = {
        id: '123',
        type: 'run',
        startTime: new Date(2023, 0, 1, 12, 0, 0),
        endTime: new Date(2023, 0, 1, 12, 30, 0),
        distance: 5000,
        duration: 1800,
        avgPace: 360,
        maxSpeed: 3.5,
        gpsPoints: [
          {
            latitude: 40.7128,
            longitude: -74.0060,
            timestamp: new Date(2023, 0, 1, 12, 0, 0),
            accuracy: 10
          },
          {
            latitude: 40.7138,
            longitude: -74.0070,
            timestamp: new Date(2023, 0, 1, 12, 15, 0),
            accuracy: 10
          }
        ]
      };
      
      await storageService.saveWorkout(workout);
      
      // Get the workout back to verify
      const savedWorkout = await storageService.getWorkout('123');
      expect(savedWorkout).toBeDefined();
      expect(savedWorkout?.id).toBe('123');
      expect(savedWorkout?.type).toBe('run');
      expect(savedWorkout?.distance).toBe(5000);
      expect(savedWorkout?.gpsPoints.length).toBe(2);
    });
    
    it('should reject an invalid workout', async () => {
      const invalidWorkout = {
        id: '123',
        type: 'swim', // Invalid type
        startTime: new Date(2023, 0, 1, 12, 0, 0),
        endTime: new Date(2023, 0, 1, 12, 30, 0),
        distance: 5000,
        duration: 1800,
        avgPace: 360,
        maxSpeed: 3.5,
        gpsPoints: []
      } as Workout;
      
      await expect(storageService.saveWorkout(invalidWorkout)).rejects.toThrow();
    });
  });
  
  describe('getWorkout', () => {
    it('should return null for non-existent workout', async () => {
      const workout = await storageService.getWorkout('non-existent');
      expect(workout).toBeNull();
    });
    
    it('should retrieve a saved workout', async () => {
      const workout: Workout = {
        id: '123',
        type: 'run',
        startTime: new Date(2023, 0, 1, 12, 0, 0),
        endTime: new Date(2023, 0, 1, 12, 30, 0),
        distance: 5000,
        duration: 1800,
        avgPace: 360,
        maxSpeed: 3.5,
        gpsPoints: []
      };
      
      await storageService.saveWorkout(workout);
      
      const savedWorkout = await storageService.getWorkout('123');
      expect(savedWorkout).toBeDefined();
      expect(savedWorkout?.id).toBe('123');
      
      // Check that dates are properly converted back to Date objects
      expect(savedWorkout?.startTime).toBeInstanceOf(Date);
      expect(savedWorkout?.endTime).toBeInstanceOf(Date);
    });
  });
  
  describe('getAllWorkouts', () => {
    beforeEach(async () => {
      // Save some test workouts
      await storageService.saveWorkout({
        id: '1',
        type: 'walk',
        startTime: new Date(2023, 0, 1),
        endTime: new Date(2023, 0, 1, 1),
        distance: 3000,
        duration: 3600,
        avgPace: 1200,
        maxSpeed: 1.0,
        gpsPoints: []
      });
      
      await storageService.saveWorkout({
        id: '2',
        type: 'run',
        startTime: new Date(2023, 0, 2),
        endTime: new Date(2023, 0, 2, 0, 30),
        distance: 5000,
        duration: 1800,
        avgPace: 360,
        maxSpeed: 3.5,
        gpsPoints: []
      });
      
      await storageService.saveWorkout({
        id: '3',
        type: 'bike',
        startTime: new Date(2023, 0, 3),
        endTime: new Date(2023, 0, 3, 2),
        distance: 20000,
        duration: 7200,
        avgPace: 360,
        maxSpeed: 8.0,
        gpsPoints: []
      });
    });
    
    it('should retrieve all workouts', async () => {
      const workouts = await storageService.getAllWorkouts();
      expect(workouts.length).toBe(3);
    });
    
    it('should filter by activity type', async () => {
      const runWorkouts = await storageService.getAllWorkouts({
        activityType: 'run'
      });
      
      expect(runWorkouts.length).toBe(1);
      expect(runWorkouts[0].id).toBe('2');
      expect(runWorkouts[0].type).toBe('run');
    });
    
    it('should sort workouts', async () => {
      // Sort by distance ascending
      const sortedByDistance = await storageService.getAllWorkouts({
        sortBy: 'distance',
        sortDirection: 'asc'
      });
      
      expect(sortedByDistance.length).toBe(3);
      expect(sortedByDistance[0].id).toBe('1'); // Walk (3000m)
      expect(sortedByDistance[1].id).toBe('2'); // Run (5000m)
      expect(sortedByDistance[2].id).toBe('3'); // Bike (20000m)
      
      // Sort by startTime descending (newest first)
      const sortedByTime = await storageService.getAllWorkouts({
        sortBy: 'startTime',
        sortDirection: 'desc'
      });
      
      expect(sortedByTime.length).toBe(3);
      expect(sortedByTime[0].id).toBe('3'); // 2023-01-03
      expect(sortedByTime[1].id).toBe('2'); // 2023-01-02
      expect(sortedByTime[2].id).toBe('1'); // 2023-01-01
    });
    
    it('should apply pagination', async () => {
      // Skip 1, limit 1
      const paginated = await storageService.getAllWorkouts({
        skip: 1,
        limit: 1
      });
      
      expect(paginated.length).toBe(1);
      // Default sort is by startTime desc, so this should be the second newest
      expect(paginated[0].id).toBe('2');
    });
  });
  
  describe('deleteWorkout', () => {
    it('should delete an existing workout', async () => {
      // Save a workout first
      await storageService.saveWorkout({
        id: '123',
        type: 'run',
        startTime: new Date(2023, 0, 1, 12, 0, 0),
        endTime: new Date(2023, 0, 1, 12, 30, 0),
        distance: 5000,
        duration: 1800,
        avgPace: 360,
        maxSpeed: 3.5,
        gpsPoints: []
      });
      
      // Verify it exists
      let workout = await storageService.getWorkout('123');
      expect(workout).not.toBeNull();
      
      // Delete it
      const result = await storageService.deleteWorkout('123');
      expect(result).toBe(true);
      
      // Verify it's gone
      workout = await storageService.getWorkout('123');
      expect(workout).toBeNull();
    });
    
    it('should return false for non-existent workout', async () => {
      const result = await storageService.deleteWorkout('non-existent');
      expect(result).toBe(false);
    });
  });
  
  describe('deleteMultipleWorkouts', () => {
    beforeEach(async () => {
      // Save some test workouts
      await storageService.saveWorkout({
        id: '1',
        type: 'walk',
        startTime: new Date(2023, 0, 1),
        endTime: new Date(2023, 0, 1, 1),
        distance: 3000,
        duration: 3600,
        avgPace: 1200,
        maxSpeed: 1.0,
        gpsPoints: []
      });
      
      await storageService.saveWorkout({
        id: '2',
        type: 'run',
        startTime: new Date(2023, 0, 2),
        endTime: new Date(2023, 0, 2, 0, 30),
        distance: 5000,
        duration: 1800,
        avgPace: 360,
        maxSpeed: 3.5,
        gpsPoints: []
      });
    });
    
    it('should delete multiple workouts', async () => {
      const result = await storageService.deleteMultipleWorkouts(['1', '2']);
      expect(result).toBe(2);
      
      // Verify they're gone
      const workouts = await storageService.getAllWorkouts();
      expect(workouts.length).toBe(0);
    });
    
    it('should handle non-existent workouts', async () => {
      const result = await storageService.deleteMultipleWorkouts(['1', 'non-existent']);
      expect(result).toBe(1); // Only one workout was deleted
      
      // Verify only one is gone
      const workouts = await storageService.getAllWorkouts();
      expect(workouts.length).toBe(1);
      expect(workouts[0].id).toBe('2');
    });
  });
  
  describe('getWorkoutStatistics', () => {
    beforeEach(async () => {
      // Save some test workouts
      await storageService.saveWorkout({
        id: '1',
        type: 'walk',
        startTime: new Date(2023, 0, 1),
        endTime: new Date(2023, 0, 1, 1),
        distance: 3000,
        duration: 3600,
        avgPace: 1200,
        maxSpeed: 1.0,
        gpsPoints: []
      });
      
      await storageService.saveWorkout({
        id: '2',
        type: 'run',
        startTime: new Date(2023, 0, 2),
        endTime: new Date(2023, 0, 2, 0, 30),
        distance: 5000,
        duration: 1800,
        avgPace: 360,
        maxSpeed: 3.5,
        gpsPoints: []
      });
      
      await storageService.saveWorkout({
        id: '3',
        type: 'run',
        startTime: new Date(2023, 0, 3),
        endTime: new Date(2023, 0, 3, 1),
        distance: 10000,
        duration: 3600,
        avgPace: 360,
        maxSpeed: 4.0,
        gpsPoints: []
      });
    });
    
    it('should calculate overall statistics', async () => {
      const stats = await storageService.getWorkoutStatistics();
      
      expect(stats.totalCount).toBe(3);
      expect(stats.totalDistance).toBe(18000); // 3000 + 5000 + 10000
      expect(stats.totalDuration).toBe(9000); // 3600 + 1800 + 3600
      expect(stats.averageDistance).toBe(6000); // 18000 / 3
      expect(stats.averageDuration).toBe(3000); // 9000 / 3
      expect(stats.longestDistance).toBe(10000);
      expect(stats.longestDuration).toBe(3600);
    });
    
    it('should calculate statistics by activity type', async () => {
      const stats = await storageService.getWorkoutStatistics();
      
      expect(stats.byActivityType.walk).toBeDefined();
      expect(stats.byActivityType.walk.count).toBe(1);
      expect(stats.byActivityType.walk.totalDistance).toBe(3000);
      
      expect(stats.byActivityType.run).toBeDefined();
      expect(stats.byActivityType.run.count).toBe(2);
      expect(stats.byActivityType.run.totalDistance).toBe(15000); // 5000 + 10000
    });
    
    it('should filter statistics by activity type', async () => {
      const runStats = await storageService.getWorkoutStatistics({
        activityType: 'run'
      });
      
      expect(runStats.totalCount).toBe(2);
      expect(runStats.totalDistance).toBe(15000);
      expect(runStats.byActivityType.run.count).toBe(2);
      expect(runStats.byActivityType.walk).toBeUndefined();
    });
  });
  
  describe('user preferences', () => {
    it('should save and retrieve user preferences', async () => {
      const prefs = {
        units: 'imperial',
        defaultActivityType: 'bike',
        autoBackgroundTracking: false,
        gpsUpdateInterval: 10,
        theme: 'dark',
        enableHapticFeedback: false,
        enableAnimations: true
      } as const;
      
      await storageService.saveUserPreferences(prefs);
      
      const savedPrefs = await storageService.getUserPreferences();
      expect(savedPrefs).toEqual(prefs);
    });
    
    it('should return default preferences if none are stored', async () => {
      const defaultPrefs = createDefaultUserPreferences();
      const prefs = await storageService.getUserPreferences();
      
      expect(prefs).toEqual(defaultPrefs);
    });
  });
  
  describe('exportWorkouts', () => {
    beforeEach(async () => {
      // Save a test workout
      await storageService.saveWorkout({
        id: '1',
        type: 'walk',
        startTime: new Date(2023, 0, 1),
        endTime: new Date(2023, 0, 1, 1),
        distance: 3000,
        duration: 3600,
        avgPace: 1200,
        maxSpeed: 1.0,
        gpsPoints: [
          {
            latitude: 40.7128,
            longitude: -74.0060,
            timestamp: new Date(2023, 0, 1),
            accuracy: 10
          }
        ]
      });
    });
    
    it('should export workouts to JSON', async () => {
      const json = await storageService.exportWorkouts(undefined, 'json');
      expect(json).toContain('"id":"1"');
      expect(json).toContain('"type":"walk"');
      expect(json).toContain('"latitude":40.7128');
    });
    
    it('should export workouts to GPX', async () => {
      const gpx = await storageService.exportWorkouts(undefined, 'gpx');
      expect(gpx).toContain('<gpx');
      expect(gpx).toContain('<trk>');
      expect(gpx).toContain('<type>walk</type>');
      expect(gpx).toContain('lat="40.7128"');
      expect(gpx).toContain('lon="-74.006"');
    });
    
    it('should export workouts to CSV', async () => {
      const csv = await storageService.exportWorkouts(undefined, 'csv');
      expect(csv).toContain('id,type,startTime,endTime,distance,duration,avgPace,maxSpeed,calories');
      expect(csv).toContain('1,walk,');
      expect(csv).toContain('3000,3600,1200,1,');
    });
  });
  
  describe('clearAllData', () => {
    it('should clear all data', async () => {
      // Save some data first
      await storageService.saveWorkout({
        id: '1',
        type: 'walk',
        startTime: new Date(2023, 0, 1),
        endTime: new Date(2023, 0, 1, 1),
        distance: 3000,
        duration: 3600,
        avgPace: 1200,
        maxSpeed: 1.0,
        gpsPoints: []
      });
      
      await storageService.saveUserPreferences({
        units: 'imperial',
        defaultActivityType: 'bike',
        autoBackgroundTracking: false,
        gpsUpdateInterval: 10,
        theme: 'dark',
        enableHapticFeedback: false,
        enableAnimations: true
      });
      
      // Verify data exists
      let workouts = await storageService.getAllWorkouts();
      expect(workouts.length).toBe(1);
      
      // Clear all data
      await storageService.clearAllData();
      
      // Verify data is gone
      workouts = await storageService.getAllWorkouts();
      expect(workouts.length).toBe(0);
      
      // User preferences should be reset to default
      const prefs = await storageService.getUserPreferences();
      expect(prefs.units).toBe('metric');
    });
  });
});
