import { PermissionService, EnhancedPermissionService, PermissionStatus, LocationPermissionType } from '../services/PermissionService';
import { Platform, Alert, Linking } from 'react-native';

// Mock expo-location
const mockLocation = {
  PermissionStatus: {
    GRANTED: 'granted',
    DENIED: 'denied',
    UNDETERMINED: 'undetermined'
  },
  getForegroundPermissionsAsync: jest.fn(),
  requestForegroundPermissionsAsync: jest.fn(),
  requestBackgroundPermissionsAsync: jest.fn(),
  hasServicesEnabledAsync: jest.fn()
};

jest.mock('expo-location', () => mockLocation);

// Mock React Native modules
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios'
  },
  Alert: {
    alert: jest.fn()
  },
  Linking: {
    openSettings: jest.fn(),
    openURL: jest.fn(),
    sendIntent: jest.fn()
  }
}));

describe('PermissionService', () => {
  let permissionService: PermissionService;
  
  beforeEach(() => {
    permissionService = new PermissionService();
    jest.clearAllMocks();
    
    // Reset platform to iOS by default
    (Platform as any).OS = 'ios';
  });

  describe('checkLocationPermission', () => {
    it('should return granted status when permission is granted', async () => {
      mockLocation.getForegroundPermissionsAsync.mockResolvedValue({
        status: 'granted',
        canAskAgain: true
      });

      const result = await permissionService.checkLocationPermission();

      expect(result.status).toBe(PermissionStatus.GRANTED);
      expect(result.granted).toBe(true);
      expect(result.canAskAgain).toBe(true);
    });

    it('should return denied status when permission is denied', async () => {
      mockLocation.getForegroundPermissionsAsync.mockResolvedValue({
        status: 'denied',
        canAskAgain: false
      });

      const result = await permissionService.checkLocationPermission();

      expect(result.status).toBe(PermissionStatus.DENIED);
      expect(result.granted).toBe(false);
      expect(result.canAskAgain).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      mockLocation.getForegroundPermissionsAsync.mockRejectedValue(new Error('Permission check failed'));

      const result = await permissionService.checkLocationPermission();

      expect(result.status).toBe(PermissionStatus.DENIED);
      expect(result.granted).toBe(false);
      expect(result.canAskAgain).toBe(false);
    });
  });

  describe('requestLocationPermission', () => {
    beforeEach(() => {
      mockLocation.hasServicesEnabledAsync.mockResolvedValue(true);
    });

    it('should request foreground permission by default', async () => {
      mockLocation.requestForegroundPermissionsAsync.mockResolvedValue({
        status: 'granted',
        canAskAgain: true
      });

      const result = await permissionService.requestLocationPermission();

      expect(mockLocation.requestForegroundPermissionsAsync).toHaveBeenCalled();
      expect(mockLocation.requestBackgroundPermissionsAsync).not.toHaveBeenCalled();
      expect(result.granted).toBe(true);
    });

    it('should request background permission when specified', async () => {
      mockLocation.requestBackgroundPermissionsAsync.mockResolvedValue({
        status: 'granted',
        canAskAgain: true
      });

      const result = await permissionService.requestLocationPermission(LocationPermissionType.ALWAYS);

      expect(mockLocation.requestBackgroundPermissionsAsync).toHaveBeenCalled();
      expect(result.granted).toBe(true);
    });

    it('should show location services disabled alert when services are off', async () => {
      mockLocation.hasServicesEnabledAsync.mockResolvedValue(false);
      
      // Mock Alert.alert to resolve immediately
      (Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
        // Simulate user pressing cancel
        if (buttons && buttons[0]) {
          buttons[0].onPress();
        }
      });

      const result = await permissionService.requestLocationPermission();

      expect(Alert.alert).toHaveBeenCalledWith(
        'Location Services Disabled',
        expect.stringContaining('Location Services are turned off'),
        expect.any(Array)
      );
      expect(result.granted).toBe(false);
    });

    it('should show settings dialog when permission is permanently denied', async () => {
      mockLocation.requestForegroundPermissionsAsync.mockResolvedValue({
        status: 'denied',
        canAskAgain: false
      });

      // Mock Alert.alert to simulate user choosing to open settings
      (Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
        if (buttons && buttons[1]) {
          buttons[1].onPress();
        }
      });

      const result = await permissionService.requestLocationPermission();

      expect(Alert.alert).toHaveBeenCalledWith(
        'Location Permission Required',
        expect.stringContaining('Location permission is required'),
        expect.any(Array)
      );
      expect(result.granted).toBe(false);
    });
  });

  describe('isLocationEnabled', () => {
    it('should return true when location services are enabled', async () => {
      mockLocation.hasServicesEnabledAsync.mockResolvedValue(true);

      const result = await permissionService.isLocationEnabled();

      expect(result).toBe(true);
      expect(mockLocation.hasServicesEnabledAsync).toHaveBeenCalled();
    });

    it('should return false when location services are disabled', async () => {
      mockLocation.hasServicesEnabledAsync.mockResolvedValue(false);

      const result = await permissionService.isLocationEnabled();

      expect(result).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      mockLocation.hasServicesEnabledAsync.mockRejectedValue(new Error('Service check failed'));

      const result = await permissionService.isLocationEnabled();

      expect(result).toBe(false);
    });
  });

  describe('showPermissionExplanation', () => {
    it('should show alert with provided explanation', async () => {
      const explanation = {
        title: 'Test Title',
        message: 'Test Message',
        buttonText: 'Allow',
        cancelText: 'Cancel'
      };

      // Mock Alert.alert to simulate user accepting
      (Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
        expect(title).toBe(explanation.title);
        expect(message).toBe(explanation.message);
        if (buttons && buttons[1]) {
          buttons[1].onPress();
        }
      });

      const result = await permissionService.showPermissionExplanation(explanation);

      expect(result).toBe(true);
      expect(Alert.alert).toHaveBeenCalled();
    });

    it('should return false when user cancels', async () => {
      const explanation = {
        title: 'Test Title',
        message: 'Test Message',
        buttonText: 'Allow'
      };

      // Mock Alert.alert to simulate user canceling
      (Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
        if (buttons && buttons[0]) {
          buttons[0].onPress();
        }
      });

      const result = await permissionService.showPermissionExplanation(explanation);

      expect(result).toBe(false);
    });
  });

  describe('openAppSettings', () => {
    it('should open app settings', async () => {
      (Linking.openSettings as jest.Mock).mockResolvedValue(undefined);

      await permissionService.openAppSettings();

      expect(Linking.openSettings).toHaveBeenCalled();
    });

    it('should fallback to platform-specific settings on error', async () => {
      (Linking.openSettings as jest.Mock).mockRejectedValue(new Error('Settings failed'));
      (Linking.openURL as jest.Mock).mockResolvedValue(undefined);

      await permissionService.openAppSettings();

      expect(Linking.openURL).toHaveBeenCalledWith('app-settings:');
    });
  });

  describe('getPermissionExplanation', () => {
    it('should return iOS-specific explanation for foreground permission', () => {
      (Platform as any).OS = 'ios';

      const explanation = permissionService.getPermissionExplanation(LocationPermissionType.WHEN_IN_USE);

      expect(explanation.title).toBe('Location Access Required');
      expect(explanation.message).toContain('FitTracker needs access to your location');
      expect(explanation.message).toContain('stored locally on your device');
    });

    it('should return iOS-specific explanation for background permission', () => {
      (Platform as any).OS = 'ios';

      const explanation = permissionService.getPermissionExplanation(LocationPermissionType.ALWAYS);

      expect(explanation.title).toBe('Background Location Access');
      expect(explanation.message).toContain('even when the app is closed');
    });

    it('should return Android-specific explanation for foreground permission', () => {
      (Platform as any).OS = 'android';

      const explanation = permissionService.getPermissionExplanation(LocationPermissionType.WHEN_IN_USE);

      expect(explanation.title).toBe('Location Permission Required');
      expect(explanation.message).toContain('stored securely on your device');
    });

    it('should return Android-specific explanation for background permission', () => {
      (Platform as any).OS = 'android';

      const explanation = permissionService.getPermissionExplanation(LocationPermissionType.ALWAYS);

      expect(explanation.title).toBe('Background Location Permission');
      expect(explanation.message).toContain('Allow all the time');
    });
  });
});

describe('EnhancedPermissionService', () => {
  let enhancedService: EnhancedPermissionService;
  
  beforeEach(() => {
    enhancedService = new EnhancedPermissionService();
    jest.clearAllMocks();
    
    // Mock location services as enabled
    mockLocation.hasServicesEnabledAsync.mockResolvedValue(true);
  });

  describe('requestLocationPermissionWithGuidance', () => {
    it('should show explanation before first request', async () => {
      mockLocation.requestForegroundPermissionsAsync.mockResolvedValue({
        status: 'granted',
        canAskAgain: true
      });

      // Mock Alert.alert to simulate user accepting explanation
      (Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
        if (buttons && buttons[1]) {
          buttons[1].onPress();
        }
      });

      const result = await enhancedService.requestLocationPermissionWithGuidance();

      expect(Alert.alert).toHaveBeenCalledWith(
        'Location Access Required',
        expect.any(String),
        expect.any(Array)
      );
      expect(result.granted).toBe(true);
    });

    it('should return denied if user declines explanation', async () => {
      // Mock Alert.alert to simulate user declining explanation
      (Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
        if (buttons && buttons[0]) {
          buttons[0].onPress();
        }
      });

      const result = await enhancedService.requestLocationPermissionWithGuidance();

      expect(result.granted).toBe(false);
      expect(result.status).toBe(PermissionStatus.DENIED);
      expect(mockLocation.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
    });

    it('should show guidance after failed attempts', async () => {
      mockLocation.requestForegroundPermissionsAsync.mockResolvedValue({
        status: 'denied',
        canAskAgain: true
      });

      // Mock Alert.alert to handle both explanation and guidance
      let alertCallCount = 0;
      (Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
        alertCallCount++;
        if (alertCallCount === 1) {
          // Accept initial explanation
          if (buttons && buttons[1]) {
            buttons[1].onPress();
          }
        } else {
          // Acknowledge guidance
          if (buttons && buttons[0]) {
            buttons[0].onPress();
          }
        }
      });

      const result = await enhancedService.requestLocationPermissionWithGuidance();

      expect(Alert.alert).toHaveBeenCalledTimes(2);
      expect(Alert.alert).toHaveBeenLastCalledWith(
        'Permission Still Needed',
        expect.any(String),
        expect.any(Array)
      );
    });

    it('should not show guidance after max attempts', async () => {
      enhancedService.resetAttemptCounters();
      
      mockLocation.requestForegroundPermissionsAsync.mockResolvedValue({
        status: 'denied',
        canAskAgain: true
      });

      // Mock multiple requests
      for (let i = 0; i < 3; i++) {
        (Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
          if (buttons && buttons[1]) {
            buttons[1].onPress();
          }
        });

        await enhancedService.requestLocationPermissionWithGuidance();
      }

      // On the 3rd attempt, should not show guidance
      expect(Alert.alert).toHaveBeenCalledTimes(5); // 3 explanations + 2 guidance messages
    });
  });

  describe('ensureWorkoutPermissions', () => {
    it('should request both foreground and background permissions', async () => {
      mockLocation.requestForegroundPermissionsAsync.mockResolvedValue({
        status: 'granted',
        canAskAgain: true
      });
      
      mockLocation.requestBackgroundPermissionsAsync.mockResolvedValue({
        status: 'granted',
        canAskAgain: true
      });

      // Mock Alert.alert to accept all explanations
      (Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
        if (buttons && buttons[1]) {
          buttons[1].onPress();
        }
      });

      const result = await enhancedService.ensureWorkoutPermissions();

      expect(result.foreground.granted).toBe(true);
      expect(result.background?.granted).toBe(true);
      expect(mockLocation.requestForegroundPermissionsAsync).toHaveBeenCalled();
      expect(mockLocation.requestBackgroundPermissionsAsync).toHaveBeenCalled();
    });

    it('should not request background if foreground is denied', async () => {
      mockLocation.requestForegroundPermissionsAsync.mockResolvedValue({
        status: 'denied',
        canAskAgain: false
      });

      // Mock Alert.alert to accept explanation but permission still denied
      (Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
        if (buttons && buttons[1]) {
          buttons[1].onPress();
        }
      });

      const result = await enhancedService.ensureWorkoutPermissions();

      expect(result.foreground.granted).toBe(false);
      expect(result.background).toBeUndefined();
      expect(mockLocation.requestBackgroundPermissionsAsync).not.toHaveBeenCalled();
    });
  });

  describe('resetAttemptCounters', () => {
    it('should reset attempt counters', async () => {
      // Make a request to increment counter
      mockLocation.requestForegroundPermissionsAsync.mockResolvedValue({
        status: 'denied',
        canAskAgain: true
      });

      (Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
        if (buttons && buttons[1]) {
          buttons[1].onPress();
        }
      });

      await enhancedService.requestLocationPermissionWithGuidance();

      // Reset counters
      enhancedService.resetAttemptCounters();

      // Next request should show explanation again (as if first time)
      await enhancedService.requestLocationPermissionWithGuidance();

      // Should have shown explanation twice (once before reset, once after)
      const explanationCalls = (Alert.alert as jest.Mock).mock.calls.filter(
        call => call[0] === 'Location Access Required'
      );
      expect(explanationCalls.length).toBe(2);
    });
  });
});

describe('Platform-specific behavior', () => {
  let permissionService: PermissionService;
  
  beforeEach(() => {
    permissionService = new PermissionService();
    jest.clearAllMocks();
  });

  describe('iOS', () => {
    beforeEach(() => {
      (Platform as any).OS = 'ios';
    });

    it('should use iOS-specific settings URL', async () => {
      (Linking.openSettings as jest.Mock).mockRejectedValue(new Error('Failed'));
      (Linking.openURL as jest.Mock).mockResolvedValue(undefined);

      await permissionService.openAppSettings();

      expect(Linking.openURL).toHaveBeenCalledWith('app-settings:');
    });
  });

  describe('Android', () => {
    beforeEach(() => {
      (Platform as any).OS = 'android';
    });

    it('should use Android-specific package URL for fallback', async () => {
      (Linking.openSettings as jest.Mock).mockRejectedValue(new Error('Failed'));
      (Linking.openURL as jest.Mock).mockResolvedValue(undefined);

      await permissionService.openAppSettings();

      expect(Linking.openURL).toHaveBeenCalledWith('package:com.fittracker');
    });
  });
});
