import Geolocation, { 
  GeolocationResponse, 
  GeolocationError 
} from '@react-native-community/geolocation';
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
 * Implementation of the LocationService interface using React Native Geolocation.
 */
export class LocationServiceImpl implements LocationService {
  private watchId: number | null = null;
  private subscribers: Map<string, (location: LocationPoint) => void> = new Map();
  private lastLocation: LocationPoint | null = null;
  private trackingOptions: LocationTrackingOptions = {
    updateInterval: 5000,     // 5 seconds
    distanceFilter: 5,        // 5 meters
    highAccuracy: true,
    backgroundTracking: false,
    useKalmanFilter: true
  };

  constructor() {
    // Configure geolocation
    Geolocation.setRNConfiguration({
      skipPermissionRequests: false,
      authorizationLevel: 'whenInUse',
      locationProvider: 'auto'
    });
  }

  /**
   * Start tracking location.
   * @param options Configuration options for tracking.
   * @returns A promise that resolves when tracking has started.
   */
  async startTracking(options?: LocationTrackingOptions): Promise<void> {
    if (this.watchId !== null) {
      // Already tracking, stop first
      await this.stopTracking();
    }

    // Merge default options with provided options
    this.trackingOptions = {
      ...this.trackingOptions,
      ...options
    };

    // Request permissions if needed
    const hasPermission = await this.requestPermissions(
      this.trackingOptions.backgroundTracking
    );

    if (!hasPermission) {
      throw new Error('Location permission denied');
    }

    return new Promise((resolve, reject) => {
      try {
        // Start watching position
        this.watchId = Geolocation.watchPosition(
          (position: GeolocationResponse) => {
            const locationPoint: LocationPoint = this.convertToLocationPoint(position);
            
            // Apply distance filter if needed
            if (this.shouldUpdateLocation(locationPoint)) {
              this.lastLocation = locationPoint;
              
              // Notify subscribers
              this.notifySubscribers(locationPoint);
            }
          },
          (error: GeolocationError) => {
            console.error('Geolocation error:', error);
          },
          {
            enableHighAccuracy: this.trackingOptions.highAccuracy,
            distanceFilter: this.trackingOptions.distanceFilter,
            interval: this.trackingOptions.updateInterval,
            fastestInterval: Math.floor(this.trackingOptions.updateInterval! / 2),
          }
        );
        
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop tracking location.
   * @returns A promise that resolves when tracking has stopped.
   */
  async stopTracking(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (this.watchId !== null) {
        Geolocation.clearWatch(this.watchId);
        this.watchId = null;
      }
      resolve();
    });
  }

  /**
   * Get the current location.
   * @param highAccuracy Whether to use high accuracy mode.
   * @returns A promise that resolves with the current location.
   */
  async getCurrentLocation(highAccuracy: boolean = true): Promise<LocationPoint> {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position: GeolocationResponse) => {
          resolve(this.convertToLocationPoint(position));
        },
        (error: GeolocationError) => {
          reject(error);
        },
        {
          enableHighAccuracy: highAccuracy,
          timeout: 15000,
          maximumAge: 10000,
        }
      );
    });
  }

  /**
   * Calculate distance between two location points using the Haversine formula.
   * @param point1 First location point.
   * @param point2 Second location point.
   * @returns Distance in meters.
   */
  calculateDistance(point1: LocationPoint, point2: LocationPoint): number {
    return calculateHaversineDistance(point1, point2);
  }

  /**
   * Calculate total distance for an array of location points.
   * @param points Array of location points.
   * @returns Total distance in meters.
   */
  calculateTotalDistance(points: LocationPoint[]): number {
    return calculatePathDistance(points);
  }

  /**
   * Filter location points to reduce noise.
   * @param points Array of location points to filter.
   * @param options Filtering options.
   * @returns Filtered array of location points.
   */
  filterPoints(points: LocationPoint[], options?: PointFilterOptions): LocationPoint[] {
    if (!points || points.length === 0) {
      return [];
    }

    let filteredPoints = [...points];

    // Filter by accuracy if threshold provided
    if (options?.maxAccuracyThreshold !== undefined) {
      filteredPoints = filteredPoints.filter(
        point => point.accuracy <= options.maxAccuracyThreshold!
      );
    }

    // Filter by speed if threshold provided
    if (options?.maxSpeedThreshold !== undefined && filteredPoints.length > 1) {
      filteredPoints = filteredPoints.filter((point, index) => {
        if (index === 0) return true;
        
        const prevPoint = filteredPoints[index - 1];
        const distance = this.calculateDistance(prevPoint, point);
        const timeDiff = (point.timestamp.getTime() - prevPoint.timestamp.getTime()) / 1000;
        
        if (timeDiff <= 0) return true;
        
        const speed = distance / timeDiff;
        return speed <= options.maxSpeedThreshold!;
      });
    }

    // Apply Kalman filter if requested
    if (options?.applyKalmanFilter) {
      filteredPoints = applyKalmanFilter(filteredPoints);
    }

    // Apply Douglas-Peucker algorithm if requested
    if (options?.applyDouglasPeucker && options?.douglasPeuckerEpsilon) {
      filteredPoints = douglasPeuckerSimplify(
        filteredPoints, 
        options.douglasPeuckerEpsilon
      );
    }

    return filteredPoints;
  }

  /**
   * Check if location services are enabled on the device.
   * @returns A promise that resolves with a boolean indicating if location services are enabled.
   */
  async isLocationEnabled(): Promise<boolean> {
    try {
      return await enhancedPermissionService.isLocationEnabled();
    } catch (error) {
      console.error('Error checking location services:', error);
      return false;
    }
  }

  /**
   * Request location permissions from the user.
   * @param backgroundPermission Whether to request background location permission.
   * @returns A promise that resolves with a boolean indicating if permission was granted.
   */
  async requestPermissions(backgroundPermission: boolean = false): Promise<boolean> {
    try {
      if (backgroundPermission) {
        // Request both foreground and background permissions
        const permissions = await enhancedPermissionService.ensureWorkoutPermissions();
        return permissions.foreground.granted && (permissions.background?.granted ?? false);
      } else {
        // Request only foreground permission
        const result = await enhancedPermissionService.requestLocationPermissionWithGuidance(
          LocationPermissionType.WHEN_IN_USE
        );
        return result.granted;
      }
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  }

  /**
   * Subscribe to location updates.
   * @param callback Function to call with location updates.
   * @returns A function to unsubscribe from updates.
   */
  subscribeToLocationUpdates(callback: (location: LocationPoint) => void): () => void {
    const id = Math.random().toString(36).substring(2, 15);
    this.subscribers.set(id, callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(id);
    };
  }

  /**
   * Convert GeolocationResponse to LocationPoint.
   * @param position Geolocation response
   * @returns LocationPoint object
   */
  private convertToLocationPoint(position: GeolocationResponse): LocationPoint {
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      timestamp: new Date(position.timestamp),
      accuracy: position.coords.accuracy || 0,
      altitude: position.coords.altitude !== null ? position.coords.altitude : undefined,
      speed: position.coords.speed !== null ? position.coords.speed : undefined,
      heading: position.coords.heading !== null ? position.coords.heading : undefined
    };
  }

  /**
   * Determine if we should update location based on distance filter.
   * @param newLocation New location point
   * @returns True if location should be updated
   */
  private shouldUpdateLocation(newLocation: LocationPoint): boolean {
    // If this is the first location, always update
    if (!this.lastLocation) {
      return true;
    }
    
    // If distance filter is not set, always update
    if (!this.trackingOptions.distanceFilter) {
      return true;
    }
    
    // Calculate distance between last location and new location
    const distance = this.calculateDistance(this.lastLocation, newLocation);
    
    // Update if distance is greater than the filter
    return distance >= this.trackingOptions.distanceFilter;
  }

  /**
   * Notify all subscribers of a new location.
   * @param location New location point
   */
  private notifySubscribers(location: LocationPoint): void {
    this.subscribers.forEach(callback => {
      try {
        callback(location);
      } catch (error) {
        console.error('Error in location subscriber:', error);
      }
    });
  }
}
