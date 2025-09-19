import { useState, useEffect, useCallback } from 'react';
import { 
  enhancedPermissionService, 
  PermissionResult, 
  LocationPermissionType,
  PermissionStatus 
} from '../services/PermissionService';

/**
 * Permission hook state
 */
interface PermissionState {
  foregroundPermission: PermissionResult | null;
  backgroundPermission: PermissionResult | null;
  isLocationEnabled: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Permission hook return type
 */
interface UsePermissionsReturn extends PermissionState {
  requestForegroundPermission: () => Promise<boolean>;
  requestBackgroundPermission: () => Promise<boolean>;
  requestAllPermissions: () => Promise<{ foreground: boolean; background: boolean }>;
  checkPermissions: () => Promise<void>;
  openSettings: () => Promise<void>;
  resetError: () => void;
}

/**
 * Custom hook for managing location permissions
 */
export const usePermissions = (): UsePermissionsReturn => {
  const [state, setState] = useState<PermissionState>({
    foregroundPermission: null,
    backgroundPermission: null,
    isLocationEnabled: false,
    isLoading: false,
    error: null
  });

  /**
   * Check current permission status
   */
  const checkPermissions = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const [foregroundResult, locationEnabled] = await Promise.all([
        enhancedPermissionService.checkLocationPermission(),
        enhancedPermissionService.isLocationEnabled()
      ]);

      setState(prev => ({
        ...prev,
        foregroundPermission: foregroundResult,
        isLocationEnabled: locationEnabled,
        isLoading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to check permissions',
        isLoading: false
      }));
    }
  }, []);

  /**
   * Request foreground location permission
   */
  const requestForegroundPermission = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await enhancedPermissionService.requestLocationPermissionWithGuidance(
        LocationPermissionType.WHEN_IN_USE
      );
      
      setState(prev => ({
        ...prev,
        foregroundPermission: result,
        isLoading: false
      }));
      
      return result.granted;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to request foreground permission',
        isLoading: false
      }));
      return false;
    }
  }, []);

  /**
   * Request background location permission
   */
  const requestBackgroundPermission = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await enhancedPermissionService.requestLocationPermissionWithGuidance(
        LocationPermissionType.ALWAYS
      );
      
      setState(prev => ({
        ...prev,
        backgroundPermission: result,
        isLoading: false
      }));
      
      return result.granted;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to request background permission',
        isLoading: false
      }));
      return false;
    }
  }, []);

  /**
   * Request all necessary permissions for workout tracking
   */
  const requestAllPermissions = useCallback(async (): Promise<{ foreground: boolean; background: boolean }> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const results = await enhancedPermissionService.ensureWorkoutPermissions();
      
      setState(prev => ({
        ...prev,
        foregroundPermission: results.foreground,
        backgroundPermission: results.background || null,
        isLoading: false
      }));
      
      return {
        foreground: results.foreground.granted,
        background: results.background?.granted ?? false
      };
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to request permissions',
        isLoading: false
      }));
      return { foreground: false, background: false };
    }
  }, []);

  /**
   * Open app settings for manual permission management
   */
  const openSettings = useCallback(async (): Promise<void> => {
    try {
      await enhancedPermissionService.openAppSettings();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to open settings'
      }));
    }
  }, []);

  /**
   * Reset error state
   */
  const resetError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Check permissions on mount
  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  return {
    ...state,
    requestForegroundPermission,
    requestBackgroundPermission,
    requestAllPermissions,
    checkPermissions,
    openSettings,
    resetError
  };
};

/**
 * Hook for checking if all required permissions are granted
 */
export const usePermissionStatus = () => {
  const {
    foregroundPermission,
    backgroundPermission,
    isLocationEnabled
  } = usePermissions();

  const hasForegroundPermission = foregroundPermission?.status === PermissionStatus.GRANTED;
  const hasBackgroundPermission = backgroundPermission?.status === PermissionStatus.GRANTED;
  const hasAllPermissions = hasForegroundPermission && hasBackgroundPermission && isLocationEnabled;
  const hasMinimumPermissions = hasForegroundPermission && isLocationEnabled;

  return {
    hasForegroundPermission,
    hasBackgroundPermission,
    hasAllPermissions,
    hasMinimumPermissions,
    isLocationEnabled,
    canTrackWorkouts: hasMinimumPermissions,
    canTrackInBackground: hasAllPermissions
  };
};

/**
 * Hook for permission-aware workout actions
 */
export const usePermissionAwareActions = () => {
  const { requestAllPermissions } = usePermissions();
  const { hasMinimumPermissions, canTrackInBackground } = usePermissionStatus();

  /**
   * Ensure permissions before starting a workout
   */
  const ensurePermissionsForWorkout = useCallback(async (requireBackground: boolean = true): Promise<boolean> => {
    if (requireBackground && canTrackInBackground) {
      return true; // Already have all permissions
    }
    
    if (!requireBackground && hasMinimumPermissions) {
      return true; // Have minimum permissions
    }

    // Request permissions
    const results = await requestAllPermissions();
    
    if (requireBackground) {
      return results.foreground && results.background;
    } else {
      return results.foreground;
    }
  }, [requestAllPermissions, hasMinimumPermissions, canTrackInBackground]);

  return {
    ensurePermissionsForWorkout,
    hasMinimumPermissions,
    canTrackInBackground
  };
};
