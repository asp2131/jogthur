import { LocationServiceImpl } from '../services/LocationServiceImpl';
import { LocationPoint } from '../models';

// Mock the Geolocation API
jest.mock('@react-native-community/geolocation', () => ({
  setRNConfiguration: jest.fn(),
  watchPosition: jest.fn((success) => {
    // Simulate location update
    success({
      coords: {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
        altitude: 100,
        speed: 5,
        heading: 90
      },
      timestamp: Date.now()
    });
    return 123; // Mock watch ID
  }),
  clearWatch: jest.fn(),
  getCurrentPosition: jest.fn((success) => {
    success({
      coords: {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
        altitude: 100,
        speed: 5,
        heading: 90
      },
      timestamp: Date.now()
    });
  })
}));

describe('LocationServiceImpl', () => {
  let locationService: LocationServiceImpl;
  
  beforeEach(() => {
    locationService = new LocationServiceImpl();
    jest.clearAllMocks();
  });
  
  describe('startTracking', () => {
    it('should start tracking location', async () => {
      const Geolocation = require('@react-native-community/geolocation');
      
      await locationService.startTracking();
      
      expect(Geolocation.setRNConfiguration).toHaveBeenCalled();
      expect(Geolocation.watchPosition).toHaveBeenCalled();
    });
    
    it('should use provided options', async () => {
      const Geolocation = require('@react-native-community/geolocation');
      
      await locationService.startTracking({
        updateInterval: 10000,
        distanceFilter: 20,
        highAccuracy: false
      });
      
      expect(Geolocation.watchPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        expect.objectContaining({
          enableHighAccuracy: false,
          distanceFilter: 20,
          interval: 10000
        })
      );
    });
  });
  
  describe('stopTracking', () => {
    it('should stop tracking location', async () => {
      const Geolocation = require('@react-native-community/geolocation');
      
      // Start tracking first
      await locationService.startTracking();
      
      // Then stop tracking
      await locationService.stopTracking();
      
      expect(Geolocation.clearWatch).toHaveBeenCalledWith(123);
    });
  });
  
  describe('getCurrentLocation', () => {
    it('should get current location', async () => {
      const Geolocation = require('@react-native-community/geolocation');
      
      const location = await locationService.getCurrentLocation();
      
      expect(Geolocation.getCurrentPosition).toHaveBeenCalled();
      expect(location).toEqual(expect.objectContaining({
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10
      }));
    });
    
    it('should use high accuracy when specified', async () => {
      const Geolocation = require('@react-native-community/geolocation');
      
      await locationService.getCurrentLocation(true);
      
      expect(Geolocation.getCurrentPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        expect.objectContaining({
          enableHighAccuracy: true
        })
      );
    });
  });
  
  describe('calculateDistance', () => {
    it('should calculate distance between two points', () => {
      const point1: LocationPoint = {
        latitude: 40.7128,
        longitude: -74.0060,
        timestamp: new Date(),
        accuracy: 10
      };
      
      const point2: LocationPoint = {
        latitude: 40.7138,
        longitude: -74.0070,
        timestamp: new Date(),
        accuracy: 10
      };
      
      const distance = locationService.calculateDistance(point1, point2);
      expect(distance).toBeGreaterThan(0);
    });
  });
  
  describe('calculateTotalDistance', () => {
    it('should calculate total distance for a path', () => {
      const path: LocationPoint[] = [
        {
          latitude: 40.7128,
          longitude: -74.0060,
          timestamp: new Date(),
          accuracy: 10
        },
        {
          latitude: 40.7138,
          longitude: -74.0070,
          timestamp: new Date(),
          accuracy: 10
        },
        {
          latitude: 40.7148,
          longitude: -74.0080,
          timestamp: new Date(),
          accuracy: 10
        }
      ];
      
      const totalDistance = locationService.calculateTotalDistance(path);
      expect(totalDistance).toBeGreaterThan(0);
      
      // Total distance should equal sum of individual segments
      const segment1 = locationService.calculateDistance(path[0], path[1]);
      const segment2 = locationService.calculateDistance(path[1], path[2]);
      expect(totalDistance).toBeCloseTo(segment1 + segment2);
    });
  });
  
  describe('filterPoints', () => {
    it('should filter points by accuracy', () => {
      const points: LocationPoint[] = [
        {
          latitude: 40.7128,
          longitude: -74.0060,
          timestamp: new Date(),
          accuracy: 5 // Good accuracy
        },
        {
          latitude: 40.7138,
          longitude: -74.0070,
          timestamp: new Date(),
          accuracy: 50 // Poor accuracy
        },
        {
          latitude: 40.7148,
          longitude: -74.0080,
          timestamp: new Date(),
          accuracy: 10 // Good accuracy
        }
      ];
      
      const filtered = locationService.filterPoints(points, {
        maxAccuracyThreshold: 20
      });
      
      expect(filtered.length).toBe(2);
      expect(filtered[0]).toEqual(points[0]);
      expect(filtered[1]).toEqual(points[2]);
    });
    
    it('should apply Douglas-Peucker simplification', () => {
      // Create a path with a middle point that's almost on a straight line
      const path: LocationPoint[] = [
        {
          latitude: 40.7128,
          longitude: -74.0060,
          timestamp: new Date(),
          accuracy: 10
        },
        {
          latitude: 40.7129,
          longitude: -74.0061, // Very close to the line between first and last
          timestamp: new Date(),
          accuracy: 10
        },
        {
          latitude: 40.7130,
          longitude: -74.0062,
          timestamp: new Date(),
          accuracy: 10
        }
      ];
      
      const simplified = locationService.filterPoints(path, {
        applyDouglasPeucker: true,
        douglasPeuckerEpsilon: 100
      });
      
      expect(simplified.length).toBe(2);
      expect(simplified[0]).toEqual(path[0]);
      expect(simplified[1]).toEqual(path[2]);
    });
  });
  
  describe('subscribeToLocationUpdates', () => {
    it('should call subscribers when location updates', async () => {
      const callback = jest.fn();
      
      // Subscribe to updates
      const unsubscribe = locationService.subscribeToLocationUpdates(callback);
      
      // Start tracking to trigger updates
      await locationService.startTracking();
      
      // Callback should have been called
      expect(callback).toHaveBeenCalled();
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        latitude: 40.7128,
        longitude: -74.0060
      }));
      
      // Unsubscribe
      unsubscribe();
      
      // Reset mock
      callback.mockReset();
      
      // Simulate another location update
      await locationService.startTracking();
      
      // Callback should not have been called again
      expect(callback).not.toHaveBeenCalled();
    });
  });
});
