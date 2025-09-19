import * as Location from 'expo-location';
import { Platform, Alert, Linking } from 'react-native';

/**
 * Permission status enum
 */
export enum PermissionStatus {
  GRANTED = 'granted',
  DENIED = 'denied',
  RESTRICTED = 'restricted',
  UNDETERMINED = 'undetermined'
}

/**
 * Location permission types
 */
export enum LocationPermissionType {
  WHEN_IN_USE = 'whenInUse',
  ALWAYS = 'always'
}

/**
 * Permission request result
 */
export interface PermissionResult {
  status: PermissionStatus;
  canAskAgain: boolean;
  granted: boolean;
}

/**
 * Permission explanation configuration
 */
export interface PermissionExplanation {
  title: string;
  message: string;
  buttonText: string;
  cancelText?: string;
}

/**
 * Permission service interface
 */
export interface IPermissionService {
  /**
   * Check current location permission status
   */
  checkLocationPermission(): Promise<PermissionResult>;
  
  /**
   * Request location permission
   */
  requestLocationPermission(type?: LocationPermissionType): Promise<PermissionResult>;
  
  /**
   * Check if location services are enabled on the device
   */
  isLocationEnabled(): Promise<boolean>;
  
  /**
   * Show permission explanation dialog
   */
  showPermissionExplanation(explanation: PermissionExplanation): Promise<boolean>;
  
  /**
   * Open app settings for manual permission grant
   */
  openAppSettings(): Promise<void>;
  
  /**
   * Get permission explanation text for the current platform
   */
  getPermissionExplanation(type: LocationPermissionType): PermissionExplanation;
}

/**
 * Cross-platform permission service implementation
 */
export class PermissionService implements IPermissionService {
  
  /**
   * Check current location permission status
   */
  async checkLocationPermission(): Promise<PermissionResult> {
    try {
      const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
      
      return {
        status: this.mapExpoStatusToPermissionStatus(status),
        canAskAgain: canAskAgain ?? true,
        granted: status === Location.PermissionStatus.GRANTED
      };
    } catch (error) {
      console.error('Error checking location permission:', error);
      return {
        status: PermissionStatus.DENIED,
        canAskAgain: false,
        granted: false
      };
    }
  }
  
  /**
   * Request location permission
   */
  async requestLocationPermission(type: LocationPermissionType = LocationPermissionType.WHEN_IN_USE): Promise<PermissionResult> {
    try {
      // First check if location services are enabled
      const locationEnabled = await this.isLocationEnabled();
      if (!locationEnabled) {
        await this.showLocationServicesDisabledAlert();
        return {
          status: PermissionStatus.DENIED,
          canAskAgain: false,
          granted: false
        };
      }
      
      // Request appropriate permission based on type
      let result;
      if (type === LocationPermissionType.ALWAYS) {
        result = await Location.requestBackgroundPermissionsAsync();
      } else {
        result = await Location.requestForegroundPermissionsAsync();
      }
      
      const permissionResult: PermissionResult = {
        status: this.mapExpoStatusToPermissionStatus(result.status),
        canAskAgain: result.canAskAgain ?? true,
        granted: result.status === Location.PermissionStatus.GRANTED
      };
      
      // If permission was denied and can't ask again, show settings dialog
      if (!permissionResult.granted && !permissionResult.canAskAgain) {
        const shouldOpenSettings = await this.showPermissionDeniedAlert(type);
        if (shouldOpenSettings) {
          await this.openAppSettings();
        }
      }
      
      return permissionResult;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return {
        status: PermissionStatus.DENIED,
        canAskAgain: false,
        granted: false
      };
    }
  }
  
  /**
   * Check if location services are enabled on the device
   */
  async isLocationEnabled(): Promise<boolean> {
    try {
      return await Location.hasServicesEnabledAsync();
    } catch (error) {
      console.error('Error checking location services:', error);
      return false;
    }
  }
  
  /**
   * Show permission explanation dialog
   */
  async showPermissionExplanation(explanation: PermissionExplanation): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        explanation.title,
        explanation.message,
        [
          {
            text: explanation.cancelText || 'Cancel',
            style: 'cancel',
            onPress: () => resolve(false)
          },
          {
            text: explanation.buttonText,
            onPress: () => resolve(true)
          }
        ]
      );
    });
  }
  
  /**
   * Open app settings for manual permission grant
   */
  async openAppSettings(): Promise<void> {
    try {
      await Linking.openSettings();
    } catch (error) {
      console.error('Error opening app settings:', error);
      // Fallback: try to open general settings
      if (Platform.OS === 'ios') {
        Linking.openURL('app-settings:');
      } else {
        Linking.openURL('package:' + 'com.fittracker'); // Replace with actual package name
      }
    }
  }
  
  /**
   * Get permission explanation text for the current platform
   */
  getPermissionExplanation(type: LocationPermissionType): PermissionExplanation {
    const isBackground = type === LocationPermissionType.ALWAYS;
    
    if (Platform.OS === 'ios') {
      return {
        title: isBackground ? 'Background Location Access' : 'Location Access Required',
        message: isBackground 
          ? 'FitTracker needs access to your location even when the app is closed to continue tracking your workouts. This ensures your exercise data is recorded accurately throughout your entire workout session.'
          : 'FitTracker needs access to your location to track your workouts and calculate distance, pace, and route information. Your location data is stored locally on your device and is never shared.',
        buttonText: 'Grant Permission',
        cancelText: 'Not Now'
      };
    } else {
      return {
        title: isBackground ? 'Background Location Permission' : 'Location Permission Required',
        message: isBackground
          ? 'To track your workouts when the app is in the background, FitTracker needs "Allow all the time" location permission. This lets us continue recording your route even when you switch to other apps.'
          : 'FitTracker uses your location to track workout distance, pace, and routes. All location data is stored securely on your device and is never shared with third parties.',
        buttonText: 'Allow Location',
        cancelText: 'Deny'
      };
    }
  }
  
  /**
   * Map Expo permission status to our permission status enum
   */
  private mapExpoStatusToPermissionStatus(status: Location.PermissionStatus): PermissionStatus {
    switch (status) {
      case Location.PermissionStatus.GRANTED:
        return PermissionStatus.GRANTED;
      case Location.PermissionStatus.DENIED:
        return PermissionStatus.DENIED;
      case Location.PermissionStatus.UNDETERMINED:
        return PermissionStatus.UNDETERMINED;
      default:
        return PermissionStatus.DENIED;
    }
  }
  
  /**
   * Show alert when location services are disabled
   */
  private async showLocationServicesDisabledAlert(): Promise<void> {
    return new Promise((resolve) => {
      const title = 'Location Services Disabled';
      const message = Platform.OS === 'ios'
        ? 'Location Services are turned off. Please enable Location Services in Settings > Privacy & Security > Location Services to use workout tracking.'
        : 'Location Services are disabled. Please enable Location Services in your device settings to track workouts.';
      
      Alert.alert(
        title,
        message,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve()
          },
          {
            text: 'Open Settings',
            onPress: async () => {
              await this.openDeviceLocationSettings();
              resolve();
            }
          }
        ]
      );
    });
  }
  
  /**
   * Show alert when permission is permanently denied
   */
  private async showPermissionDeniedAlert(type: LocationPermissionType): Promise<boolean> {
    return new Promise((resolve) => {
      const isBackground = type === LocationPermissionType.ALWAYS;
      const title = 'Location Permission Required';
      const message = isBackground
        ? 'Background location permission is required to track workouts when the app is closed. Please enable "Allow all the time" in app settings.'
        : 'Location permission is required to track your workouts. Please enable location access in app settings.';
      
      Alert.alert(
        title,
        message,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => resolve(false)
          },
          {
            text: 'Open Settings',
            onPress: () => resolve(true)
          }
        ]
      );
    });
  }
  
  /**
   * Open device location settings
   */
  private async openDeviceLocationSettings(): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        await Linking.openURL('App-Prefs:Privacy&path=LOCATION');
      } else {
        await Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS');
      }
    } catch (error) {
      console.error('Error opening location settings:', error);
      // Fallback to general settings
      await Linking.openSettings();
    }
  }
}

/**
 * Permission service with enhanced error handling and user guidance
 */
export class EnhancedPermissionService extends PermissionService {
  private permissionAttempts: Map<LocationPermissionType, number> = new Map();
  private readonly MAX_ATTEMPTS = 3;
  
  /**
   * Request location permission with enhanced user guidance
   */
  async requestLocationPermissionWithGuidance(type: LocationPermissionType = LocationPermissionType.WHEN_IN_USE): Promise<PermissionResult> {
    const attempts = this.permissionAttempts.get(type) || 0;
    
    // Show explanation before first request
    if (attempts === 0) {
      const explanation = this.getPermissionExplanation(type);
      const shouldProceed = await this.showPermissionExplanation(explanation);
      
      if (!shouldProceed) {
        return {
          status: PermissionStatus.DENIED,
          canAskAgain: true,
          granted: false
        };
      }
    }
    
    // Request permission
    const result = await this.requestLocationPermission(type);
    
    // Track attempts
    this.permissionAttempts.set(type, attempts + 1);
    
    // If denied and we haven't reached max attempts, show guidance
    if (!result.granted && result.canAskAgain && attempts < this.MAX_ATTEMPTS - 1) {
      await this.showPermissionGuidance(type, attempts + 1);
    }
    
    return result;
  }
  
  /**
   * Show guidance based on permission attempt number
   */
  private async showPermissionGuidance(type: LocationPermissionType, attemptNumber: number): Promise<void> {
    const isBackground = type === LocationPermissionType.ALWAYS;
    
    let title: string;
    let message: string;
    
    if (attemptNumber === 1) {
      title = 'Permission Still Needed';
      message = isBackground
        ? 'Background location access is essential for tracking your complete workout, even when you switch apps or lock your phone. This ensures no part of your exercise is missed.'
        : 'Location access is required to track your workout distance and route. Without this permission, we cannot provide accurate fitness tracking.';
    } else {
      title = 'Help Us Help You';
      message = isBackground
        ? 'For the best workout tracking experience, please select "Allow all the time" when prompted. This lets us track your entire workout route automatically.'
        : 'To track your workouts accurately, please tap "Allow" when the location permission dialog appears. Your privacy is protected - location data stays on your device.';
    }
    
    return new Promise((resolve) => {
      Alert.alert(
        title,
        message,
        [
          {
            text: 'I Understand',
            onPress: () => resolve()
          }
        ]
      );
    });
  }
  
  /**
   * Check and request all necessary permissions for workout tracking
   */
  async ensureWorkoutPermissions(): Promise<{
    foreground: PermissionResult;
    background?: PermissionResult;
  }> {
    // First request foreground permission
    const foregroundResult = await this.requestLocationPermissionWithGuidance(LocationPermissionType.WHEN_IN_USE);
    
    if (!foregroundResult.granted) {
      return { foreground: foregroundResult };
    }
    
    // If foreground is granted, request background permission
    const backgroundResult = await this.requestLocationPermissionWithGuidance(LocationPermissionType.ALWAYS);
    
    return {
      foreground: foregroundResult,
      background: backgroundResult
    };
  }
  
  /**
   * Reset permission attempt counters
   */
  resetAttemptCounters(): void {
    this.permissionAttempts.clear();
  }
}

// Export singleton instances
export const permissionService = new PermissionService();
export const enhancedPermissionService = new EnhancedPermissionService();
