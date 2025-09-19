import { Workout, LocationPoint, ActivityType, UserPreferences } from '../models';

/**
 * Validates a LocationPoint object.
 * @param point The location point to validate.
 * @returns An object containing validation result and error message if invalid.
 */
export const validateLocationPoint = (point: LocationPoint): { isValid: boolean; error?: string } => {
  // Check if required fields exist
  if (point.latitude === undefined || point.longitude === undefined) {
    return { isValid: false, error: 'Location point must have latitude and longitude' };
  }

  // Validate latitude range (-90 to 90)
  if (point.latitude < -90 || point.latitude > 90) {
    return { isValid: false, error: 'Latitude must be between -90 and 90 degrees' };
  }

  // Validate longitude range (-180 to 180)
  if (point.longitude < -180 || point.longitude > 180) {
    return { isValid: false, error: 'Longitude must be between -180 and 180 degrees' };
  }

  // Validate timestamp
  if (!point.timestamp || !(point.timestamp instanceof Date)) {
    return { isValid: false, error: 'Location point must have a valid timestamp' };
  }

  // Validate accuracy (must be positive)
  if (point.accuracy !== undefined && point.accuracy < 0) {
    return { isValid: false, error: 'Accuracy must be a positive number' };
  }

  // Validate optional fields if present
  if (point.altitude !== undefined && typeof point.altitude !== 'number') {
    return { isValid: false, error: 'Altitude must be a number' };
  }

  if (point.speed !== undefined && (typeof point.speed !== 'number' || point.speed < 0)) {
    return { isValid: false, error: 'Speed must be a positive number' };
  }

  if (point.heading !== undefined && 
      (typeof point.heading !== 'number' || point.heading < 0 || point.heading > 360)) {
    return { isValid: false, error: 'Heading must be between 0 and 360 degrees' };
  }

  return { isValid: true };
};

/**
 * Validates an array of location points.
 * @param points Array of location points to validate.
 * @returns An object containing validation result and error message if invalid.
 */
export const validateLocationPoints = (points: LocationPoint[]): { isValid: boolean; error?: string } => {
  if (!Array.isArray(points)) {
    return { isValid: false, error: 'GPS points must be an array' };
  }

  // Check if array is empty
  if (points.length === 0) {
    return { isValid: true }; // Empty array is valid (e.g., for a new workout)
  }

  // Validate each point
  for (let i = 0; i < points.length; i++) {
    const validation = validateLocationPoint(points[i]);
    if (!validation.isValid) {
      return { isValid: false, error: `Invalid GPS point at index ${i}: ${validation.error}` };
    }
  }

  // Check for chronological order
  for (let i = 1; i < points.length; i++) {
    if (points[i].timestamp < points[i - 1].timestamp) {
      return { isValid: false, error: 'GPS points must be in chronological order' };
    }
  }

  return { isValid: true };
};

/**
 * Validates a workout activity type.
 * @param type The activity type to validate.
 * @returns An object containing validation result and error message if invalid.
 */
export const validateActivityType = (type: string): { isValid: boolean; error?: string } => {
  const validTypes: ActivityType[] = ['walk', 'run', 'bike'];
  if (!validTypes.includes(type as ActivityType)) {
    return { isValid: false, error: `Activity type must be one of: ${validTypes.join(', ')}` };
  }
  return { isValid: true };
};

/**
 * Validates a complete workout object.
 * @param workout The workout to validate.
 * @returns An object containing validation result and error message if invalid.
 */
export const validateWorkout = (workout: Workout): { isValid: boolean; error?: string } => {
  // Check required fields
  if (!workout.id) {
    return { isValid: false, error: 'Workout must have an ID' };
  }

  // Validate activity type
  const typeValidation = validateActivityType(workout.type);
  if (!typeValidation.isValid) {
    return typeValidation;
  }

  // Validate timestamps
  if (!workout.startTime || !(workout.startTime instanceof Date)) {
    return { isValid: false, error: 'Workout must have a valid start time' };
  }

  if (!workout.endTime || !(workout.endTime instanceof Date)) {
    return { isValid: false, error: 'Workout must have a valid end time' };
  }

  // End time must be after start time
  if (workout.endTime <= workout.startTime) {
    return { isValid: false, error: 'End time must be after start time' };
  }

  // Validate numeric fields
  if (typeof workout.distance !== 'number' || workout.distance < 0) {
    return { isValid: false, error: 'Distance must be a non-negative number' };
  }

  if (typeof workout.duration !== 'number' || workout.duration <= 0) {
    return { isValid: false, error: 'Duration must be a positive number' };
  }

  if (typeof workout.avgPace !== 'number' || workout.avgPace < 0) {
    return { isValid: false, error: 'Average pace must be a non-negative number' };
  }

  if (typeof workout.maxSpeed !== 'number' || workout.maxSpeed < 0) {
    return { isValid: false, error: 'Maximum speed must be a non-negative number' };
  }

  // Validate optional fields if present
  if (workout.calories !== undefined && (typeof workout.calories !== 'number' || workout.calories < 0)) {
    return { isValid: false, error: 'Calories must be a non-negative number' };
  }

  // Validate GPS points
  const pointsValidation = validateLocationPoints(workout.gpsPoints);
  if (!pointsValidation.isValid) {
    return pointsValidation;
  }

  // Validate consistency between duration and timestamps
  const calculatedDuration = (workout.endTime.getTime() - workout.startTime.getTime()) / 1000;
  const durationDiff = Math.abs(calculatedDuration - workout.duration);
  if (durationDiff > 1) { // Allow 1 second tolerance
    return { 
      isValid: false, 
      error: `Duration (${workout.duration}s) doesn't match time difference between start and end (${calculatedDuration}s)` 
    };
  }

  return { isValid: true };
};

/**
 * Validates user preferences.
 * @param prefs The user preferences to validate.
 * @returns An object containing validation result and error message if invalid.
 */
export const validateUserPreferences = (prefs: UserPreferences): { isValid: boolean; error?: string } => {
  // Validate units
  if (prefs.units !== 'metric' && prefs.units !== 'imperial') {
    return { isValid: false, error: 'Units must be either "metric" or "imperial"' };
  }

  // Validate default activity type
  const typeValidation = validateActivityType(prefs.defaultActivityType);
  if (!typeValidation.isValid) {
    return typeValidation;
  }

  // Validate boolean fields
  if (typeof prefs.autoBackgroundTracking !== 'boolean') {
    return { isValid: false, error: 'autoBackgroundTracking must be a boolean' };
  }

  if (typeof prefs.enableHapticFeedback !== 'boolean') {
    return { isValid: false, error: 'enableHapticFeedback must be a boolean' };
  }

  if (typeof prefs.enableAnimations !== 'boolean') {
    return { isValid: false, error: 'enableAnimations must be a boolean' };
  }

  // Validate theme
  if (prefs.theme !== 'light' && prefs.theme !== 'dark' && prefs.theme !== 'auto') {
    return { isValid: false, error: 'Theme must be "light", "dark", or "auto"' };
  }

  // Validate GPS update interval
  if (typeof prefs.gpsUpdateInterval !== 'number' || prefs.gpsUpdateInterval < 1) {
    return { isValid: false, error: 'GPS update interval must be a positive number' };
  }

  // Validate optional fields if present
  if (prefs.minDistanceFilter !== undefined && 
      (typeof prefs.minDistanceFilter !== 'number' || prefs.minDistanceFilter < 0)) {
    return { isValid: false, error: 'Minimum distance filter must be a non-negative number' };
  }

  if (prefs.showCharacter !== undefined && typeof prefs.showCharacter !== 'boolean') {
    return { isValid: false, error: 'showCharacter must be a boolean' };
  }

  return { isValid: true };
};

/**
 * Creates a default user preferences object.
 * @returns A default UserPreferences object.
 */
export const createDefaultUserPreferences = (): UserPreferences => {
  return {
    units: 'metric',
    defaultActivityType: 'walk',
    autoBackgroundTracking: true,
    gpsUpdateInterval: 5, // 5 seconds
    theme: 'auto',
    enableHapticFeedback: true,
    enableAnimations: true,
    minDistanceFilter: 5, // 5 meters
    showCharacter: true
  };
};
