import { 
  validateLocationPoint, 
  validateLocationPoints,
  validateActivityType,
  validateWorkout,
  validateUserPreferences,
  createDefaultUserPreferences
} from '../utils/validation';
import { LocationPoint, Workout, UserPreferences, ActivityType } from '../models';

describe('Validation Functions', () => {
  // LocationPoint validation tests
  describe('validateLocationPoint', () => {
    it('should validate a valid location point', () => {
      const validPoint: LocationPoint = {
        latitude: 40.7128,
        longitude: -74.0060,
        timestamp: new Date(),
        accuracy: 10,
        altitude: 100,
        speed: 5,
        heading: 90
      };
      
      const result = validateLocationPoint(validPoint);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
    
    it('should reject a point with invalid latitude', () => {
      const invalidPoint: LocationPoint = {
        latitude: 100, // Invalid: > 90
        longitude: -74.0060,
        timestamp: new Date(),
        accuracy: 10
      };
      
      const result = validateLocationPoint(invalidPoint);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Latitude must be between');
    });
    
    it('should reject a point with invalid longitude', () => {
      const invalidPoint: LocationPoint = {
        latitude: 40.7128,
        longitude: -200, // Invalid: < -180
        timestamp: new Date(),
        accuracy: 10
      };
      
      const result = validateLocationPoint(invalidPoint);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Longitude must be between');
    });
    
    it('should reject a point with missing timestamp', () => {
      const invalidPoint = {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10
      } as LocationPoint;
      
      const result = validateLocationPoint(invalidPoint);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('valid timestamp');
    });
    
    it('should reject a point with negative accuracy', () => {
      const invalidPoint: LocationPoint = {
        latitude: 40.7128,
        longitude: -74.0060,
        timestamp: new Date(),
        accuracy: -5 // Invalid: negative
      };
      
      const result = validateLocationPoint(invalidPoint);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Accuracy must be a positive number');
    });
    
    it('should reject a point with invalid speed', () => {
      const invalidPoint: LocationPoint = {
        latitude: 40.7128,
        longitude: -74.0060,
        timestamp: new Date(),
        accuracy: 10,
        speed: -1 // Invalid: negative
      };
      
      const result = validateLocationPoint(invalidPoint);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Speed must be a positive number');
    });
    
    it('should reject a point with invalid heading', () => {
      const invalidPoint: LocationPoint = {
        latitude: 40.7128,
        longitude: -74.0060,
        timestamp: new Date(),
        accuracy: 10,
        heading: 400 // Invalid: > 360
      };
      
      const result = validateLocationPoint(invalidPoint);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Heading must be between');
    });
  });
  
  // LocationPoints array validation tests
  describe('validateLocationPoints', () => {
    it('should validate an empty array of points', () => {
      const result = validateLocationPoints([]);
      expect(result.isValid).toBe(true);
    });
    
    it('should validate an array of valid points', () => {
      const points: LocationPoint[] = [
        {
          latitude: 40.7128,
          longitude: -74.0060,
          timestamp: new Date(2023, 0, 1, 12, 0, 0),
          accuracy: 10
        },
        {
          latitude: 40.7129,
          longitude: -74.0061,
          timestamp: new Date(2023, 0, 1, 12, 0, 10),
          accuracy: 12
        }
      ];
      
      const result = validateLocationPoints(points);
      expect(result.isValid).toBe(true);
    });
    
    it('should reject if any point is invalid', () => {
      const points: LocationPoint[] = [
        {
          latitude: 40.7128,
          longitude: -74.0060,
          timestamp: new Date(2023, 0, 1, 12, 0, 0),
          accuracy: 10
        },
        {
          latitude: 100, // Invalid: > 90
          longitude: -74.0061,
          timestamp: new Date(2023, 0, 1, 12, 0, 10),
          accuracy: 12
        }
      ];
      
      const result = validateLocationPoints(points);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid GPS point at index 1');
    });
    
    it('should reject points not in chronological order', () => {
      const points: LocationPoint[] = [
        {
          latitude: 40.7128,
          longitude: -74.0060,
          timestamp: new Date(2023, 0, 1, 12, 0, 10), // Later timestamp
          accuracy: 10
        },
        {
          latitude: 40.7129,
          longitude: -74.0061,
          timestamp: new Date(2023, 0, 1, 12, 0, 0), // Earlier timestamp
          accuracy: 12
        }
      ];
      
      const result = validateLocationPoints(points);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('GPS points must be in chronological order');
    });
  });
  
  // ActivityType validation tests
  describe('validateActivityType', () => {
    it('should validate valid activity types', () => {
      expect(validateActivityType('walk').isValid).toBe(true);
      expect(validateActivityType('run').isValid).toBe(true);
      expect(validateActivityType('bike').isValid).toBe(true);
    });
    
    it('should reject invalid activity types', () => {
      const result = validateActivityType('swim');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Activity type must be one of');
    });
  });
  
  // Workout validation tests
  describe('validateWorkout', () => {
    const validWorkout: Workout = {
      id: '123',
      type: 'run',
      startTime: new Date(2023, 0, 1, 12, 0, 0),
      endTime: new Date(2023, 0, 1, 12, 30, 0),
      distance: 5000, // 5km
      duration: 1800, // 30 minutes
      avgPace: 360, // 6 min/km
      maxSpeed: 3.5, // 3.5 m/s
      gpsPoints: [
        {
          latitude: 40.7128,
          longitude: -74.0060,
          timestamp: new Date(2023, 0, 1, 12, 0, 0),
          accuracy: 10
        },
        {
          latitude: 40.7129,
          longitude: -74.0061,
          timestamp: new Date(2023, 0, 1, 12, 15, 0),
          accuracy: 12
        },
        {
          latitude: 40.7130,
          longitude: -74.0062,
          timestamp: new Date(2023, 0, 1, 12, 30, 0),
          accuracy: 8
        }
      ]
    };
    
    it('should validate a valid workout', () => {
      const result = validateWorkout(validWorkout);
      expect(result.isValid).toBe(true);
    });
    
    it('should reject a workout without an ID', () => {
      const invalidWorkout = { ...validWorkout, id: '' };
      const result = validateWorkout(invalidWorkout);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('must have an ID');
    });
    
    it('should reject a workout with an invalid activity type', () => {
      const invalidWorkout = { ...validWorkout, type: 'swim' as ActivityType };
      const result = validateWorkout(invalidWorkout);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Activity type must be one of');
    });
    
    it('should reject a workout with end time before start time', () => {
      const invalidWorkout = { 
        ...validWorkout, 
        startTime: new Date(2023, 0, 1, 12, 30, 0),
        endTime: new Date(2023, 0, 1, 12, 0, 0)
      };
      
      const result = validateWorkout(invalidWorkout);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('End time must be after start time');
    });
    
    it('should reject a workout with negative distance', () => {
      const invalidWorkout = { ...validWorkout, distance: -100 };
      const result = validateWorkout(invalidWorkout);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Distance must be a non-negative number');
    });
    
    it('should reject a workout with zero or negative duration', () => {
      const invalidWorkout = { ...validWorkout, duration: 0 };
      const result = validateWorkout(invalidWorkout);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Duration must be a positive number');
    });
    
    it('should reject a workout with inconsistent duration', () => {
      const invalidWorkout = { 
        ...validWorkout, 
        duration: 3600 // 1 hour, but timestamps show 30 minutes
      };
      
      const result = validateWorkout(invalidWorkout);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Duration');
    });
  });
  
  // UserPreferences validation tests
  describe('validateUserPreferences', () => {
    const validPrefs: UserPreferences = {
      units: 'metric',
      defaultActivityType: 'walk',
      autoBackgroundTracking: true,
      gpsUpdateInterval: 5,
      theme: 'auto',
      enableHapticFeedback: true,
      enableAnimations: true,
      minDistanceFilter: 5,
      showCharacter: true
    };
    
    it('should validate valid user preferences', () => {
      const result = validateUserPreferences(validPrefs);
      expect(result.isValid).toBe(true);
    });
    
    it('should reject invalid units', () => {
      const invalidPrefs = { ...validPrefs, units: 'standard' as any };
      const result = validateUserPreferences(invalidPrefs);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Units must be either');
    });
    
    it('should reject invalid default activity type', () => {
      const invalidPrefs = { ...validPrefs, defaultActivityType: 'swim' as ActivityType };
      const result = validateUserPreferences(invalidPrefs);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Activity type must be one of');
    });
    
    it('should reject invalid theme', () => {
      const invalidPrefs = { ...validPrefs, theme: 'blue' as any };
      const result = validateUserPreferences(invalidPrefs);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Theme must be');
    });
    
    it('should reject invalid GPS update interval', () => {
      const invalidPrefs = { ...validPrefs, gpsUpdateInterval: 0 };
      const result = validateUserPreferences(invalidPrefs);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('GPS update interval must be a positive number');
    });
    
    it('should reject invalid minDistanceFilter', () => {
      const invalidPrefs = { ...validPrefs, minDistanceFilter: -1 };
      const result = validateUserPreferences(invalidPrefs);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Minimum distance filter must be a non-negative number');
    });
  });
  
  // Default preferences test
  describe('createDefaultUserPreferences', () => {
    it('should create valid default preferences', () => {
      const defaultPrefs = createDefaultUserPreferences();
      const result = validateUserPreferences(defaultPrefs);
      expect(result.isValid).toBe(true);
    });
    
    it('should set expected default values', () => {
      const defaultPrefs = createDefaultUserPreferences();
      expect(defaultPrefs.units).toBe('metric');
      expect(defaultPrefs.defaultActivityType).toBe('walk');
      expect(defaultPrefs.autoBackgroundTracking).toBe(true);
      expect(defaultPrefs.gpsUpdateInterval).toBe(5);
      expect(defaultPrefs.theme).toBe('auto');
      expect(defaultPrefs.enableHapticFeedback).toBe(true);
      expect(defaultPrefs.enableAnimations).toBe(true);
    });
  });
});
