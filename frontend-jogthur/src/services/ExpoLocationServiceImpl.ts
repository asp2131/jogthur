import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { enhancedPermissionService, LocationPermissionType } from './PermissionService';
import { LocationPoint } from '../models';
import { 
  LocationService, 
  LocationTrackingOptions, 
  PointFilterOptions 
} from './LocationService';
import { 
  calculateHaversineDistance, 
  calculatePathDistance,
  douglasPeuckerSimplify,
  applyKalmanFilter
} from '../utils/geoUtils';

/**
 * Location service implementation using Expo Location
 */
export class ExpoLocationServiceImpl implements LocationService {
  private isTracking: boolean = false;
  private watchSubscription: Location.LocationSubscription | null = null;
  private lastKnownLocation: LocationPoint | null = null;
  private trackingOptions: LocationTrackingOptions = {
    highAccuracy: true,
    distanceFilter: 5,
    updateInterval: 1000
  };
  private pointFilters: PointFilterOptions = {
    maxAccuracyThreshold: 50,
    maxSpeedThreshold: 50
  };
  private locationCallbacks: Set<(location: LocationPoint) => void> = new Set();
  private errorCallbacks: Set<(error: Error) => void> = new Set();

  constructor() {
    this.setupLocationConfiguration();
  }

  /**
   * Setup location configuration
   */
  private setupLocationConfiguration(): void {
    // Expo Location doesn't require additional configuration
    // Configuration is handled through the tracking options
  }

  /**
   * Start location tracking
   */
  async startTracking(options?: Partial<LocationTrackingOptions>): Promise<void> {
    if (this.isTracking) {
      console.warn('Location tracking is already active');
      return;
    }

    try {
      // Check permissions
      const hasPermissions = await this.checkPermissions();
      if (!hasPermissions) {
        throw new Error('Location permissions not granted');
      }

      // Update tracking options
      if (options) {
        this.trackingOptions = { ...this.trackingOptions, ...options };
      }

      // Configure location tracking
      const locationOptions: Location.LocationOptions = {
        accuracy: this.trackingOptions.highAccuracy 
          ? Location.Accuracy.BestForNavigation 
          : Location.Accuracy.Balanced,
        timeInterval: this.trackingOptions.updateInterval,
        distanceInterval: this.trackingOptions.distanceFilter,
        mayShowUserSettingsDialog: true
      };

      // Start watching position
      this.watchSubscription = await Location.watchPositionAsync(
        locationOptions,
        (location) => this.handleLocationUpdate(location)
      );

      this.isTracking = true;
      console.log('Location tracking started with options:', this.trackingOptions);
    } catch (error) {
      console.error('Failed to start location tracking:', error);
      this.handleLocationError(error as Error);
      throw error;
    }
  }

  /**
   * Stop location tracking
   */
  async stopTracking(): Promise<void> {
    if (!this.isTracking) {
      console.warn('Location tracking is not active');
      return;
    }

    try {
      if (this.watchSubscription) {
        this.watchSubscription.remove();
        this.watchSubscription = null;
      }

      this.isTracking = false;
      console.log('Location tracking stopped');
    } catch (error) {
      console.error('Failed to stop location tracking:', error);
      throw error;
    }
  }

  /**
   * Get current location
   */
  async getCurrentLocation(highAccuracy?: boolean): Promise<LocationPoint> {
    try {
      // Check permissions
      const hasPermissions = await this.checkPermissions();
      if (!hasPermissions) {
        throw new Error('Location permissions not granted');
      }

      const useHighAccuracy = highAccuracy ?? this.trackingOptions.highAccuracy;
      const location = await Location.getCurrentPositionAsync({
        accuracy: useHighAccuracy 
          ? Location.Accuracy.BestForNavigation 
          : Location.Accuracy.Balanced,
        mayShowUserSettingsDialog: true
      });

      const locationPoint = this.convertExpoLocationToPoint(location);
      this.lastKnownLocation = locationPoint;
      
      return locationPoint;
    } catch (error) {
      console.error('Failed to get current location:', error);
      this.handleLocationError(error as Error);
      throw error;
    }
  }

  /**
   * Check if location tracking is active
   */
  isTrackingActive(): boolean {
    return this.isTracking;
  }

  /**
   * Get last known location
   */
  getLastKnownLocation(): LocationPoint | null {
    return this.lastKnownLocation;
  }

  /**
   * Add location update callback
   */
  addLocationCallback(callback: (location: LocationPoint) => void): void {
    this.locationCallbacks.add(callback);
  }

  /**
   * Remove location update callback
   */
  removeLocationCallback(callback: (location: LocationPoint) => void): void {
    this.locationCallbacks.delete(callback);
  }

  /**
   * Add error callback
   */
  addErrorCallback(callback: (error: Error) => void): void {
    this.errorCallbacks.add(callback);
  }

  /**
   * Remove error callback
   */
  removeErrorCallback(callback: (error: Error) => void): void {
    this.errorCallbacks.delete(callback);
  }

  /**
   * Update tracking options
   */
  updateTrackingOptions(options: Partial<LocationTrackingOptions>): void {
    this.trackingOptions = { ...this.trackingOptions, ...options };
    
    // If tracking is active, restart with new options
    if (this.isTracking) {
      this.restartTracking();
    }
  }

  /**
   * Update point filters
   */
  updatePointFilters(filters: Partial<PointFilterOptions>): void {
    this.pointFilters = { ...this.pointFilters, ...filters };
  }

  /**
   * Get current tracking options
   */
  getTrackingOptions(): LocationTrackingOptions {
    return { ...this.trackingOptions };
  }

  /**
   * Get current point filters
   */
  getPointFilters(): PointFilterOptions {
    return { ...this.pointFilters };
  }

  /**
   * Check location permissions
   */
  private async checkPermissions(): Promise<boolean> {
    try {
      const result = await enhancedPermissionService.checkLocationPermission();
      return result.granted;
    } catch (error) {
      console.error('Failed to check location permissions:', error);
      return false;
    }
  }

  /**
   * Handle location update from Expo Location
   */
  private handleLocationUpdate(location: Location.LocationObject): void {
    try {
      const locationPoint = this.convertExpoLocationToPoint(location);
      
      // Apply filters
      if (!this.shouldAcceptLocation(locationPoint)) {
        return;
      }

      // Update last known location
      this.lastKnownLocation = locationPoint;

      // Notify callbacks
      this.locationCallbacks.forEach(callback => {
        try {
          callback(locationPoint);
        } catch (error) {
          console.error('Error in location callback:', error);
        }
      });
    } catch (error) {
      console.error('Error handling location update:', error);
      this.handleLocationError(error as Error);
    }
  }

  /**
   * Handle location error
   */
  private handleLocationError(error: Error): void {
    console.error('Location error:', error);
    
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (callbackError) {
        console.error('Error in error callback:', callbackError);
      }
    });
  }

  /**
   * Convert Expo Location object to LocationPoint
   */
  private convertExpoLocationToPoint(location: Location.LocationObject): LocationPoint {
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      altitude: location.coords.altitude || undefined,
      accuracy: location.coords.accuracy || undefined,
      speed: location.coords.speed || undefined,
      heading: location.coords.heading || undefined,
      timestamp: new Date(location.timestamp || Date.now())
    };
  }

  /**
   * Check if location should be accepted based on filters
   */
  private shouldAcceptLocation(location: LocationPoint): boolean {
    // Check coordinate validity
    if (!this.isValidCoordinate(location.latitude, location.longitude)) {
      console.warn('Invalid coordinates received:', location.latitude, location.longitude);
      return false;
    }

    // Check accuracy filter
    if (location.accuracy && this.pointFilters.maxAccuracyThreshold && 
        location.accuracy > this.pointFilters.maxAccuracyThreshold) {
      console.warn('Location accuracy too low:', location.accuracy);
      return false;
    }

    // Check speed filter
    if (location.speed && this.pointFilters.maxSpeedThreshold && 
        location.speed > this.pointFilters.maxSpeedThreshold) {
      console.warn('Speed too high, likely GPS error:', location.speed);
      return false;
    }

    return true;
  }

  /**
   * Simple coordinate validation
   */
  private isValidCoordinate(latitude: number, longitude: number): boolean {
    return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
  }

  /**
   * Restart tracking with current options
   */
  private async restartTracking(): Promise<void> {
    if (!this.isTracking) return;

    try {
      await this.stopTracking();
      await this.startTracking();
    } catch (error) {
      console.error('Failed to restart tracking:', error);
    }
  }

  /**
   * Calculate distance between two location points
   */
  calculateDistance(point1: LocationPoint, point2: LocationPoint): number {
    return calculateHaversineDistance(point1, point2);
  }

  /**
   * Calculate total distance for an array of location points
   */
  calculateTotalDistance(points: LocationPoint[]): number {
    return calculatePathDistance(points);
  }

  /**
   * Filter location points to reduce noise
   */
  filterPoints(points: LocationPoint[], options?: PointFilterOptions): LocationPoint[] {
    let filteredPoints = [...points];
    const filterOptions = { ...this.pointFilters, ...options };

    // Apply accuracy filter
    if (filterOptions.maxAccuracyThreshold) {
      filteredPoints = filteredPoints.filter(point => 
        !point.accuracy || point.accuracy <= filterOptions.maxAccuracyThreshold!
      );
    }

    // Apply speed filter
    if (filterOptions.maxSpeedThreshold) {
      filteredPoints = filteredPoints.filter(point => 
        !point.speed || point.speed <= filterOptions.maxSpeedThreshold!
      );
    }

    // Apply Douglas-Peucker simplification
    if (filterOptions.applyDouglasPeucker && filterOptions.douglasPeuckerEpsilon) {
      filteredPoints = douglasPeuckerSimplify(filteredPoints, filterOptions.douglasPeuckerEpsilon);
    }

    // Apply Kalman filter
    if (filterOptions.applyKalmanFilter) {
      filteredPoints = applyKalmanFilter(filteredPoints);
    }

    return filteredPoints;
  }

  /**
   * Check if location services are enabled
   */
  async isLocationEnabled(): Promise<boolean> {
    try {
      return await enhancedPermissionService.isLocationEnabled();
    } catch (error) {
      console.error('Failed to check if location is enabled:', error);
      return false;
    }
  }

  /**
   * Request location permissions
   */
  async requestPermissions(backgroundPermission?: boolean): Promise<boolean> {
    try {
      const permissionType = backgroundPermission 
        ? LocationPermissionType.ALWAYS 
        : LocationPermissionType.WHEN_IN_USE;
      
      const result = await enhancedPermissionService.requestLocationPermissionWithGuidance(permissionType);
      return result.granted;
    } catch (error) {
      console.error('Failed to request permissions:', error);
      return false;
    }
  }

  /**
   * Subscribe to location updates
   */
  subscribeToLocationUpdates(callback: (location: LocationPoint) => void): () => void {
    this.addLocationCallback(callback);
    return () => this.removeLocationCallback(callback);
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.stopTracking();
    this.locationCallbacks.clear();
    this.errorCallbacks.clear();
    this.lastKnownLocation = null;
  }
}

// Export singleton instance
export const expoLocationService = new ExpoLocationServiceImpl();
