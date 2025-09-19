import { LocationPoint } from '../models';

/**
 * Earth radius in meters
 */
const EARTH_RADIUS = 6371000; // meters

/**
 * Converts degrees to radians
 * @param degrees Angle in degrees
 * @returns Angle in radians
 */
export const degreesToRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Calculates the distance between two points using the Haversine formula.
 * This formula provides the great-circle distance between two points on a sphere
 * given their longitudes and latitudes.
 * 
 * @param point1 First location point
 * @param point2 Second location point
 * @returns Distance in meters
 */
export const calculateHaversineDistance = (point1: LocationPoint, point2: LocationPoint): number => {
  const lat1 = degreesToRadians(point1.latitude);
  const lon1 = degreesToRadians(point1.longitude);
  const lat2 = degreesToRadians(point2.latitude);
  const lon2 = degreesToRadians(point2.longitude);

  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;

  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS * c;
  
  return distance;
};

/**
 * Calculates the total distance of a path defined by an array of location points.
 * 
 * @param points Array of location points
 * @returns Total distance in meters
 */
export const calculatePathDistance = (points: LocationPoint[]): number => {
  if (points.length < 2) {
    return 0;
  }

  let totalDistance = 0;
  
  for (let i = 1; i < points.length; i++) {
    totalDistance += calculateHaversineDistance(points[i - 1], points[i]);
  }
  
  return totalDistance;
};

/**
 * Calculates the current speed based on distance and time difference.
 * 
 * @param point1 First location point
 * @param point2 Second location point
 * @returns Speed in meters per second
 */
export const calculateSpeed = (point1: LocationPoint, point2: LocationPoint): number => {
  const distance = calculateHaversineDistance(point1, point2);
  const timeDiff = (point2.timestamp.getTime() - point1.timestamp.getTime()) / 1000; // in seconds
  
  if (timeDiff <= 0) {
    return 0;
  }
  
  return distance / timeDiff;
};

/**
 * Applies the Douglas-Peucker algorithm to simplify a path.
 * This reduces the number of points in a curve while preserving its shape.
 * 
 * @param points Array of location points
 * @param epsilon Tolerance value (higher values result in more simplification)
 * @returns Simplified array of location points
 */
export const douglasPeuckerSimplify = (points: LocationPoint[], epsilon: number): LocationPoint[] => {
  if (points.length <= 2) {
    return [...points];
  }
  
  // Find the point with the maximum distance
  let maxDistance = 0;
  let index = 0;
  
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  
  for (let i = 1; i < points.length - 1; i++) {
    const distance = perpendicularDistance(points[i], firstPoint, lastPoint);
    
    if (distance > maxDistance) {
      maxDistance = distance;
      index = i;
    }
  }
  
  // If max distance is greater than epsilon, recursively simplify
  if (maxDistance > epsilon) {
    // Recursive call
    const firstHalf = douglasPeuckerSimplify(points.slice(0, index + 1), epsilon);
    const secondHalf = douglasPeuckerSimplify(points.slice(index), epsilon);
    
    // Concatenate the results
    return [...firstHalf.slice(0, -1), ...secondHalf];
  } else {
    // Base case - return just the endpoints
    return [firstPoint, lastPoint];
  }
};

/**
 * Calculates the perpendicular distance from a point to a line defined by two points.
 * Used by the Douglas-Peucker algorithm.
 * 
 * @param point The point to calculate distance from
 * @param lineStart Start point of the line
 * @param lineEnd End point of the line
 * @returns Perpendicular distance in meters
 */
const perpendicularDistance = (point: LocationPoint, lineStart: LocationPoint, lineEnd: LocationPoint): number => {
  // Convert to Cartesian coordinates for simplicity
  // This is an approximation that works for small distances
  const x = degreesToRadians(point.longitude) * Math.cos(degreesToRadians(point.latitude)) * EARTH_RADIUS;
  const y = degreesToRadians(point.latitude) * EARTH_RADIUS;
  
  const x1 = degreesToRadians(lineStart.longitude) * Math.cos(degreesToRadians(lineStart.latitude)) * EARTH_RADIUS;
  const y1 = degreesToRadians(lineStart.latitude) * EARTH_RADIUS;
  
  const x2 = degreesToRadians(lineEnd.longitude) * Math.cos(degreesToRadians(lineEnd.latitude)) * EARTH_RADIUS;
  const y2 = degreesToRadians(lineEnd.latitude) * EARTH_RADIUS;
  
  // Line length
  const lineLength = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  
  if (lineLength === 0) {
    return Math.sqrt(Math.pow(x - x1, 2) + Math.pow(y - y1, 2));
  }
  
  // Calculate perpendicular distance
  const t = ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / (lineLength * lineLength);
  
  if (t < 0) {
    return Math.sqrt(Math.pow(x - x1, 2) + Math.pow(y - y1, 2));
  }
  
  if (t > 1) {
    return Math.sqrt(Math.pow(x - x2, 2) + Math.pow(y - y2, 2));
  }
  
  const projX = x1 + t * (x2 - x1);
  const projY = y1 + t * (y2 - y1);
  
  return Math.sqrt(Math.pow(x - projX, 2) + Math.pow(y - projY, 2));
};

/**
 * Simple Kalman filter implementation for GPS coordinates.
 * This helps reduce noise in GPS readings.
 */
export class KalmanFilter {
  private q: number; // Process noise
  private r: number; // Measurement noise
  private x: number = 0; // Estimated value
  private p: number = 0; // Estimation error
  private k: number = 0; // Kalman gain
  
  constructor(q: number = 0.01, r: number = 0.1) {
    this.q = q;
    this.r = r;
  }
  
  /**
   * Updates the filter with a new measurement.
   * @param measurement New measurement value
   * @returns Filtered value
   */
  update(measurement: number): number {
    // Prediction update
    this.p = this.p + this.q;
    
    // Measurement update
    this.k = this.p / (this.p + this.r);
    this.x = this.x + this.k * (measurement - this.x);
    this.p = (1 - this.k) * this.p;
    
    return this.x;
  }
  
  /**
   * Resets the filter.
   * @param initialValue Optional initial value
   */
  reset(initialValue: number = 0): void {
    this.x = initialValue;
    this.p = 0;
  }
}

/**
 * Applies a Kalman filter to GPS coordinates to reduce noise.
 * 
 * @param points Array of location points
 * @returns Filtered array of location points
 */
export const applyKalmanFilter = (points: LocationPoint[]): LocationPoint[] => {
  if (points.length <= 1) {
    return [...points];
  }
  
  const latFilter = new KalmanFilter();
  const lonFilter = new KalmanFilter();
  
  // Initialize with first point
  latFilter.reset(points[0].latitude);
  lonFilter.reset(points[0].longitude);
  
  return points.map((point, index) => {
    // First point remains unchanged
    if (index === 0) {
      return { ...point };
    }
    
    // Apply filter to subsequent points
    const filteredLat = latFilter.update(point.latitude);
    const filteredLon = lonFilter.update(point.longitude);
    
    return {
      ...point,
      latitude: filteredLat,
      longitude: filteredLon
    };
  });
};
