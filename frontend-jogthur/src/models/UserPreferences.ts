import { ActivityType } from './Workout';

/**
 * Represents the measurement unit system.
 */
export type UnitSystem = 'metric' | 'imperial';

/**
 * Represents the app theme mode.
 */
export type ThemeMode = 'light' | 'dark' | 'auto';

/**
 * Represents user preferences and settings.
 */
export interface UserPreferences {
  /**
   * Preferred unit system for measurements.
   */
  units: UnitSystem;
  
  /**
   * Default activity type for new workouts.
   */
  defaultActivityType: ActivityType;
  
  /**
   * Whether to automatically continue tracking in the background.
   */
  autoBackgroundTracking: boolean;
  
  /**
   * GPS update interval in seconds.
   */
  gpsUpdateInterval: number;
  
  /**
   * App theme preference.
   */
  theme: ThemeMode;
  
  /**
   * Whether haptic feedback is enabled.
   */
  enableHapticFeedback: boolean;
  
  /**
   * Whether animations are enabled.
   */
  enableAnimations: boolean;
  
  /**
   * Minimum distance (in meters) to record a new GPS point.
   */
  minDistanceFilter?: number;
  
  /**
   * Whether to show the 3D character during workouts.
   */
  showCharacter?: boolean;
}
