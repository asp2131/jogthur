import { LocationPoint } from '../models';

/**
 * Interface for location tracking service.
 */
export interface LocationService {
  /**
   * Start tracking location.
   * @param options Configuration options for tracking.
   * @returns A promise that resolves when tracking has started.
   */
  startTracking(options?: LocationTrackingOptions): Promise<void>;
  
  /**
   * Stop tracking location.
   * @returns A promise that resolves when tracking has stopped.
   */
  stopTracking(): Promise<void>;
  
  /**
   * Get the current location.
   * @param highAccuracy Whether to use high accuracy mode.
   * @returns A promise that resolves with the current location.
   */
  getCurrentLocation(highAccuracy?: boolean): Promise<LocationPoint>;
  
  /**
   * Calculate distance between two location points using the Haversine formula.
   * @param point1 First location point.
   * @param point2 Second location point.
   * @returns Distance in meters.
   */
  calculateDistance(point1: LocationPoint, point2: LocationPoint): number;
  
  /**
   * Calculate total distance for an array of location points.
   * @param points Array of location points.
   * @returns Total distance in meters.
   */
  calculateTotalDistance(points: LocationPoint[]): number;
  
  /**
   * Filter location points to reduce noise.
   * @param points Array of location points to filter.
   * @param options Filtering options.
   * @returns Filtered array of location points.
   */
  filterPoints(points: LocationPoint[], options?: PointFilterOptions): LocationPoint[];
  
  /**
   * Check if location services are enabled on the device.
   * @returns A promise that resolves with a boolean indicating if location services are enabled.
   */
  isLocationEnabled(): Promise<boolean>;
  
  /**
   * Request location permissions from the user.
   * @param backgroundPermission Whether to request background location permission.
   * @returns A promise that resolves with a boolean indicating if permission was granted.
   */
  requestPermissions(backgroundPermission?: boolean): Promise<boolean>;
  
  /**
   * Subscribe to location updates.
   * @param callback Function to call with location updates.
   * @returns A function to unsubscribe from updates.
   */
  subscribeToLocationUpdates(callback: (location: LocationPoint) => void): () => void;
}

/**
 * Options for location tracking.
 */
export interface LocationTrackingOptions {
  /**
   * Interval between location updates in milliseconds.
   */
  updateInterval?: number;
  
  /**
   * Minimum distance (in meters) device must move before an update.
   */
  distanceFilter?: number;
  
  /**
   * Whether to use high accuracy mode (uses more battery).
   */
  highAccuracy?: boolean;
  
  /**
   * Whether to continue tracking in the background.
   */
  backgroundTracking?: boolean;
  
  /**
   * Whether to use the Kalman filter for noise reduction.
   */
  useKalmanFilter?: boolean;
}

/**
 * Options for filtering location points.
 */
export interface PointFilterOptions {
  /**
   * Maximum accuracy threshold in meters (points with higher values will be filtered out).
   */
  maxAccuracyThreshold?: number;
  
  /**
   * Maximum speed threshold in m/s (points with higher speeds will be filtered out).
   */
  maxSpeedThreshold?: number;
  
  /**
   * Whether to apply the Douglas-Peucker algorithm for path simplification.
   */
  applyDouglasPeucker?: boolean;
  
  /**
   * Epsilon value for Douglas-Peucker algorithm (higher values mean more simplification).
   */
  douglasPeuckerEpsilon?: number;
  
  /**
   * Whether to apply the Kalman filter for noise reduction.
   */
  applyKalmanFilter?: boolean;
}
