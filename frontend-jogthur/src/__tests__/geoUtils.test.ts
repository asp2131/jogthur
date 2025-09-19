import { 
  degreesToRadians, 
  calculateHaversineDistance, 
  calculatePathDistance,
  calculateSpeed,
  douglasPeuckerSimplify,
  KalmanFilter,
  applyKalmanFilter
} from '../utils/geoUtils';
import { LocationPoint } from '../models';

describe('Geo Utilities', () => {
  describe('degreesToRadians', () => {
    it('should convert degrees to radians correctly', () => {
      expect(degreesToRadians(0)).toBeCloseTo(0);
      expect(degreesToRadians(180)).toBeCloseTo(Math.PI);
      expect(degreesToRadians(90)).toBeCloseTo(Math.PI / 2);
      expect(degreesToRadians(360)).toBeCloseTo(2 * Math.PI);
    });
  });
  
  describe('calculateHaversineDistance', () => {
    it('should calculate distance between two points correctly', () => {
      // New York City coordinates
      const nyc: LocationPoint = {
        latitude: 40.7128,
        longitude: -74.0060,
        timestamp: new Date(),
        accuracy: 10
      };
      
      // Los Angeles coordinates
      const la: LocationPoint = {
        latitude: 34.0522,
        longitude: -118.2437,
        timestamp: new Date(),
        accuracy: 10
      };
      
      // Expected distance between NYC and LA is roughly 3935 km
      const distance = calculateHaversineDistance(nyc, la);
      expect(distance).toBeGreaterThan(3900000); // 3900 km in meters
      expect(distance).toBeLessThan(4000000); // 4000 km in meters
    });
    
    it('should return 0 for identical points', () => {
      const point: LocationPoint = {
        latitude: 40.7128,
        longitude: -74.0060,
        timestamp: new Date(),
        accuracy: 10
      };
      
      const distance = calculateHaversineDistance(point, point);
      expect(distance).toBeCloseTo(0);
    });
    
    it('should handle points at opposite sides of the earth', () => {
      const northPole: LocationPoint = {
        latitude: 90,
        longitude: 0,
        timestamp: new Date(),
        accuracy: 10
      };
      
      const southPole: LocationPoint = {
        latitude: -90,
        longitude: 0,
        timestamp: new Date(),
        accuracy: 10
      };
      
      // Distance between poles should be roughly 20015 km (half the earth's circumference)
      const distance = calculateHaversineDistance(northPole, southPole);
      expect(distance).toBeGreaterThan(20000000); // 20000 km in meters
      expect(distance).toBeLessThan(20100000); // 20100 km in meters
    });
  });
  
  describe('calculatePathDistance', () => {
    it('should return 0 for empty path', () => {
      expect(calculatePathDistance([])).toBe(0);
    });
    
    it('should return 0 for single point path', () => {
      const point: LocationPoint = {
        latitude: 40.7128,
        longitude: -74.0060,
        timestamp: new Date(),
        accuracy: 10
      };
      
      expect(calculatePathDistance([point])).toBe(0);
    });
    
    it('should calculate total path distance correctly', () => {
      const path: LocationPoint[] = [
        {
          latitude: 40.7128,
          longitude: -74.0060,
          timestamp: new Date(),
          accuracy: 10
        },
        {
          latitude: 40.7129,
          longitude: -74.0065,
          timestamp: new Date(),
          accuracy: 10
        },
        {
          latitude: 40.7135,
          longitude: -74.0070,
          timestamp: new Date(),
          accuracy: 10
        }
      ];
      
      const distance = calculatePathDistance(path);
      expect(distance).toBeGreaterThan(0);
      
      // Sum of individual segments should equal total path distance
      const segment1 = calculateHaversineDistance(path[0], path[1]);
      const segment2 = calculateHaversineDistance(path[1], path[2]);
      expect(distance).toBeCloseTo(segment1 + segment2);
    });
  });
  
  describe('calculateSpeed', () => {
    it('should calculate speed correctly based on distance and time', () => {
      const point1: LocationPoint = {
        latitude: 40.7128,
        longitude: -74.0060,
        timestamp: new Date('2023-01-01T12:00:00Z'),
        accuracy: 10
      };
      
      const point2: LocationPoint = {
        latitude: 40.7138,
        longitude: -74.0070,
        timestamp: new Date('2023-01-01T12:00:10Z'), // 10 seconds later
        accuracy: 10
      };
      
      const distance = calculateHaversineDistance(point1, point2);
      const speed = calculateSpeed(point1, point2);
      
      // Speed should be distance divided by time (10 seconds)
      expect(speed).toBeCloseTo(distance / 10);
    });
    
    it('should return 0 for identical timestamps', () => {
      const timestamp = new Date();
      const point1: LocationPoint = {
        latitude: 40.7128,
        longitude: -74.0060,
        timestamp,
        accuracy: 10
      };
      
      const point2: LocationPoint = {
        latitude: 40.7138,
        longitude: -74.0070,
        timestamp, // Same timestamp
        accuracy: 10
      };
      
      expect(calculateSpeed(point1, point2)).toBe(0);
    });
  });
  
  describe('douglasPeuckerSimplify', () => {
    it('should not modify paths with 2 or fewer points', () => {
      const singlePoint: LocationPoint[] = [{
        latitude: 40.7128,
        longitude: -74.0060,
        timestamp: new Date(),
        accuracy: 10
      }];
      
      const twoPoints: LocationPoint[] = [
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
        }
      ];
      
      expect(douglasPeuckerSimplify(singlePoint, 10)).toEqual(singlePoint);
      expect(douglasPeuckerSimplify(twoPoints, 10)).toEqual(twoPoints);
    });
    
    it('should simplify a path by removing points within epsilon', () => {
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
      
      // With a large epsilon, the middle point should be removed
      const simplified = douglasPeuckerSimplify(path, 100);
      expect(simplified.length).toBe(2);
      expect(simplified[0]).toEqual(path[0]);
      expect(simplified[1]).toEqual(path[2]);
      
      // With a small epsilon, all points should be kept
      const notSimplified = douglasPeuckerSimplify(path, 0.1);
      expect(notSimplified.length).toBe(3);
    });
  });
  
  describe('KalmanFilter', () => {
    it('should filter noisy data', () => {
      const filter = new KalmanFilter();
      
      // Initialize with a value
      const initialValue = 100;
      filter.reset(initialValue);
      
      // Add some noise
      const noisyValues = [102, 95, 105, 98, 103];
      const filteredValues = noisyValues.map(value => filter.update(value));
      
      // Filtered values should be less extreme than noisy values
      expect(Math.max(...filteredValues)).toBeLessThan(Math.max(...noisyValues));
      expect(Math.min(...filteredValues)).toBeGreaterThan(Math.min(...noisyValues));
      
      // Filtered values should converge
      const differences = [];
      for (let i = 1; i < filteredValues.length; i++) {
        differences.push(Math.abs(filteredValues[i] - filteredValues[i-1]));
      }
      
      // Later differences should be smaller as the filter stabilizes
      expect(differences[differences.length - 1]).toBeLessThan(differences[0]);
    });
  });
  
  describe('applyKalmanFilter', () => {
    it('should not modify paths with 1 or fewer points', () => {
      const emptyPath: LocationPoint[] = [];
      expect(applyKalmanFilter(emptyPath)).toEqual(emptyPath);
      
      const singlePoint: LocationPoint[] = [{
        latitude: 40.7128,
        longitude: -74.0060,
        timestamp: new Date(),
        accuracy: 10
      }];
      
      expect(applyKalmanFilter(singlePoint)).toEqual(singlePoint);
    });
    
    it('should filter a path of points', () => {
      // Create a zigzag path with noise
      const path: LocationPoint[] = [
        {
          latitude: 40.7128,
          longitude: -74.0060,
          timestamp: new Date(),
          accuracy: 10
        },
        {
          latitude: 40.7130, // Slight zigzag
          longitude: -74.0062,
          timestamp: new Date(),
          accuracy: 10
        },
        {
          latitude: 40.7129, // Zigzag back
          longitude: -74.0064,
          timestamp: new Date(),
          accuracy: 10
        },
        {
          latitude: 40.7131, // Zigzag again
          longitude: -74.0066,
          timestamp: new Date(),
          accuracy: 10
        }
      ];
      
      const filtered = applyKalmanFilter(path);
      
      // Should have same number of points
      expect(filtered.length).toBe(path.length);
      
      // First point should be unchanged
      expect(filtered[0]).toEqual(path[0]);
      
      // Other points should be filtered (values changed)
      expect(filtered[1].latitude).not.toEqual(path[1].latitude);
      expect(filtered[1].longitude).not.toEqual(path[1].longitude);
      
      // Filtered path should be smoother (less zigzag)
      // Calculate zigzag as the sum of direction changes
      const calculateZigzag = (points: LocationPoint[]): number => {
        let zigzag = 0;
        for (let i = 2; i < points.length; i++) {
          const prev = points[i-2];
          const mid = points[i-1];
          const curr = points[i];
          
          const prevDeltaLat = mid.latitude - prev.latitude;
          const prevDeltaLon = mid.longitude - prev.longitude;
          const currDeltaLat = curr.latitude - mid.latitude;
          const currDeltaLon = curr.longitude - mid.longitude;
          
          // Dot product of direction vectors
          const dotProduct = prevDeltaLat * currDeltaLat + prevDeltaLon * currDeltaLon;
          
          // Magnitudes of direction vectors
          const prevMag = Math.sqrt(prevDeltaLat * prevDeltaLat + prevDeltaLon * prevDeltaLon);
          const currMag = Math.sqrt(currDeltaLat * currDeltaLat + currDeltaLon * currDeltaLon);
          
          // Angle between directions
          const cosAngle = dotProduct / (prevMag * currMag);
          const angle = Math.acos(Math.min(Math.max(cosAngle, -1), 1));
          
          zigzag += angle;
        }
        return zigzag;
      };
      
      const originalZigzag = calculateZigzag(path);
      const filteredZigzag = calculateZigzag(filtered);
      
      // Filtered path should have less zigzag
      expect(filteredZigzag).toBeLessThan(originalZigzag);
    });
  });
});
