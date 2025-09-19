import { 
  LocationPoint, 
  Workout, 
  ActivityType, 
  UserPreferences, 
  UnitSystem,
  ThemeMode 
} from '../models';

// This file tests TypeScript type safety by ensuring models can be properly instantiated
// These tests are mainly for type checking during development
describe('Model Types', () => {
  // LocationPoint model tests
  describe('LocationPoint', () => {
    it('should create a valid LocationPoint with required fields', () => {
      const point: LocationPoint = {
        latitude: 40.7128,
        longitude: -74.0060,
        timestamp: new Date(),
        accuracy: 10
      };
      
      expect(point).toBeDefined();
      expect(point.latitude).toBe(40.7128);
      expect(point.longitude).toBe(-74.0060);
      expect(point.timestamp).toBeInstanceOf(Date);
      expect(point.accuracy).toBe(10);
    });
    
    it('should create a LocationPoint with optional fields', () => {
      const point: LocationPoint = {
        latitude: 40.7128,
        longitude: -74.0060,
        timestamp: new Date(),
        accuracy: 10,
        altitude: 100,
        speed: 5,
        heading: 90
      };
      
      expect(point).toBeDefined();
      expect(point.altitude).toBe(100);
      expect(point.speed).toBe(5);
      expect(point.heading).toBe(90);
    });
  });
  
  // ActivityType tests
  describe('ActivityType', () => {
    it('should accept valid activity types', () => {
      const walk: ActivityType = 'walk';
      const run: ActivityType = 'run';
      const bike: ActivityType = 'bike';
      
      expect(walk).toBe('walk');
      expect(run).toBe('run');
      expect(bike).toBe('bike');
    });
  });
  
  // Workout model tests
  describe('Workout', () => {
    it('should create a valid Workout with required fields', () => {
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
      
      expect(workout).toBeDefined();
      expect(workout.id).toBe('123');
      expect(workout.type).toBe('run');
      expect(workout.startTime).toBeInstanceOf(Date);
      expect(workout.endTime).toBeInstanceOf(Date);
      expect(workout.distance).toBe(5000);
      expect(workout.duration).toBe(1800);
      expect(workout.avgPace).toBe(360);
      expect(workout.maxSpeed).toBe(3.5);
      expect(workout.gpsPoints).toEqual([]);
    });
    
    it('should create a Workout with optional fields', () => {
      const workout: Workout = {
        id: '123',
        type: 'run',
        startTime: new Date(2023, 0, 1, 12, 0, 0),
        endTime: new Date(2023, 0, 1, 12, 30, 0),
        distance: 5000,
        duration: 1800,
        avgPace: 360,
        maxSpeed: 3.5,
        gpsPoints: [],
        calories: 500,
        notes: 'Great run!',
        name: 'Morning Run'
      };
      
      expect(workout).toBeDefined();
      expect(workout.calories).toBe(500);
      expect(workout.notes).toBe('Great run!');
      expect(workout.name).toBe('Morning Run');
    });
  });
  
  // UnitSystem tests
  describe('UnitSystem', () => {
    it('should accept valid unit systems', () => {
      const metric: UnitSystem = 'metric';
      const imperial: UnitSystem = 'imperial';
      
      expect(metric).toBe('metric');
      expect(imperial).toBe('imperial');
    });
  });
  
  // ThemeMode tests
  describe('ThemeMode', () => {
    it('should accept valid theme modes', () => {
      const light: ThemeMode = 'light';
      const dark: ThemeMode = 'dark';
      const auto: ThemeMode = 'auto';
      
      expect(light).toBe('light');
      expect(dark).toBe('dark');
      expect(auto).toBe('auto');
    });
  });
  
  // UserPreferences model tests
  describe('UserPreferences', () => {
    it('should create valid UserPreferences with required fields', () => {
      const prefs: UserPreferences = {
        units: 'metric',
        defaultActivityType: 'walk',
        autoBackgroundTracking: true,
        gpsUpdateInterval: 5,
        theme: 'auto',
        enableHapticFeedback: true,
        enableAnimations: true
      };
      
      expect(prefs).toBeDefined();
      expect(prefs.units).toBe('metric');
      expect(prefs.defaultActivityType).toBe('walk');
      expect(prefs.autoBackgroundTracking).toBe(true);
      expect(prefs.gpsUpdateInterval).toBe(5);
      expect(prefs.theme).toBe('auto');
      expect(prefs.enableHapticFeedback).toBe(true);
      expect(prefs.enableAnimations).toBe(true);
    });
    
    it('should create UserPreferences with optional fields', () => {
      const prefs: UserPreferences = {
        units: 'imperial',
        defaultActivityType: 'bike',
        autoBackgroundTracking: false,
        gpsUpdateInterval: 10,
        theme: 'dark',
        enableHapticFeedback: false,
        enableAnimations: false,
        minDistanceFilter: 10,
        showCharacter: false
      };
      
      expect(prefs).toBeDefined();
      expect(prefs.minDistanceFilter).toBe(10);
      expect(prefs.showCharacter).toBe(false);
    });
  });
});
