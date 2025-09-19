import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Animated,
  Text,
  TouchableOpacity,
  Platform
} from 'react-native';
import { FallbackMapView } from '../components/FallbackMapView';
import { SimpleCharacter3D } from '../components/SimpleCharacter3D';
import { useWorkoutStore, useCurrentWorkout, useWorkoutActions } from '../stores/workoutStore';
import { usePermissionAwareActions } from '../hooks/usePermissions';
import { ActivityType, LocationPoint } from '../models';
import { WorkoutState } from '../services/WorkoutManager';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/**
 * Live statistics data
 */
interface LiveStats {
  distance: number;
  duration: number;
  currentPace: number;
  averagePace: number;
  currentSpeed: number;
  calories: number;
}

/**
 * Animated number component for smooth transitions
 */
interface AnimatedNumberProps {
  value: number;
  formatter?: (value: number) => string;
  style?: any;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ 
  value, 
  formatter = (v) => v.toFixed(0), 
  style 
}) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const listener = animatedValue.addListener(({ value }) => {
      setDisplayValue(value);
    });

    Animated.timing(animatedValue, {
      toValue: value,
      duration: 500,
      useNativeDriver: false
    }).start();

    return () => {
      animatedValue.removeListener(listener);
    };
  }, [value, animatedValue]);

  return (
    <Text style={style}>
      {formatter(displayValue)}
    </Text>
  );
};

/**
 * WarioWare-style control button
 */
interface ControlButtonProps {
  title: string;
  onPress: () => void;
  backgroundColor: string;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const ControlButton: React.FC<ControlButtonProps> = ({
  title,
  onPress,
  backgroundColor,
  disabled = false,
  size = 'medium'
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const rotateAnim = React.useRef(new Animated.Value(0)).current;

  const buttonSize = {
    small: 60,
    medium: 80,
    large: 100
  }[size];

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.9,
        useNativeDriver: true,
        tension: 300,
        friction: 10
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true
      })
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 10
      }),
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true
      })
    ]).start();
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '5deg']
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Animated.View
        style={[
          styles.controlButton,
          {
            backgroundColor: disabled ? '#cccccc' : backgroundColor,
            width: buttonSize,
            height: buttonSize,
            transform: [
              { scale: scaleAnim },
              { rotate }
            ]
          }
        ]}
      >
        <Text style={[
          styles.controlButtonText,
          { 
            fontSize: size === 'large' ? 18 : size === 'medium' ? 16 : 14,
            color: disabled ? '#666666' : '#ffffff'
          }
        ]}>
          {title}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

/**
 * Statistics overlay component
 */
interface StatsOverlayProps {
  stats: LiveStats;
  activityType: ActivityType;
  isVisible: boolean;
}

const StatsOverlay: React.FC<StatsOverlayProps> = ({ stats, activityType, isVisible }) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isVisible ? 1 : 0,
      duration: 300,
      useNativeDriver: true
    }).start();
  }, [isVisible, fadeAnim]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPace = (pace: number): string => {
    if (pace === 0 || !isFinite(pace)) return '--:--';
    const minutes = Math.floor(pace / 60);
    const seconds = Math.floor(pace % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDistance = (distance: number): string => {
    return (distance / 1000).toFixed(2);
  };

  const formatSpeed = (speed: number): string => {
    return (speed * 3.6).toFixed(1); // Convert m/s to km/h
  };

  return (
    <Animated.View style={[styles.statsOverlay, { opacity: fadeAnim }]}>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Distance</Text>
          <AnimatedNumber
            value={stats.distance}
            formatter={formatDistance}
            style={styles.statValue}
          />
          <Text style={styles.statUnit}>km</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Time</Text>
          <AnimatedNumber
            value={stats.duration}
            formatter={formatTime}
            style={styles.statValue}
          />
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Pace</Text>
          <AnimatedNumber
            value={stats.currentPace}
            formatter={formatPace}
            style={styles.statValue}
          />
          <Text style={styles.statUnit}>min/km</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Speed</Text>
          <AnimatedNumber
            value={stats.currentSpeed}
            formatter={formatSpeed}
            style={styles.statValue}
          />
          <Text style={styles.statUnit}>km/h</Text>
        </View>
        
        {stats.calories > 0 && (
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Calories</Text>
            <AnimatedNumber
              value={stats.calories}
              formatter={(v) => Math.round(v).toString()}
              style={styles.statValue}
            />
            <Text style={styles.statUnit}>kcal</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

/**
 * Main workout screen component
 */
export const WorkoutScreen: React.FC = () => {
  const [selectedActivity, setSelectedActivity] = useState<ActivityType>('run');
  const [routePoints, setRoutePoints] = useState<LocationPoint[]>([]);
  const [currentLocation, setCurrentLocation] = useState<LocationPoint | null>(null);
  const [celebrationTrigger, setCelebrationTrigger] = useState(false);

  // Workout store hooks
  const { session, stats, isActive, isPaused } = useCurrentWorkout();
  const { startWorkout, pauseWorkout, resumeWorkout, stopWorkout, isLoading, error } = useWorkoutActions();
  const { ensurePermissionsForWorkout } = usePermissionAwareActions();

  // Live statistics
  const liveStats: LiveStats = useMemo(() => ({
    distance: stats?.distance || 0,
    duration: stats?.duration || 0,
    currentPace: stats?.currentPace || 0,
    averagePace: stats?.averagePace || 0,
    currentSpeed: stats?.currentSpeed || 0,
    calories: stats?.calories || 0
  }), [stats]);

  // Handle workout start
  const handleStartWorkout = useCallback(async () => {
    try {
      const hasPermissions = await ensurePermissionsForWorkout(true);
      if (!hasPermissions) {
        console.warn('Insufficient permissions for workout');
        return;
      }

      await startWorkout(selectedActivity);
    } catch (error) {
      console.error('Failed to start workout:', error);
    }
  }, [selectedActivity, startWorkout, ensurePermissionsForWorkout]);

  // Handle workout pause
  const handlePauseWorkout = useCallback(async () => {
    try {
      await pauseWorkout();
    } catch (error) {
      console.error('Failed to pause workout:', error);
    }
  }, [pauseWorkout]);

  // Handle workout resume
  const handleResumeWorkout = useCallback(async () => {
    try {
      await resumeWorkout();
    } catch (error) {
      console.error('Failed to resume workout:', error);
    }
  }, [resumeWorkout]);

  // Handle workout stop
  const handleStopWorkout = useCallback(async () => {
    try {
      const completedWorkout = await stopWorkout();
      
      // Trigger celebration animation
      setCelebrationTrigger(true);
      setTimeout(() => setCelebrationTrigger(false), 3000);
      
      console.log('Workout completed:', completedWorkout);
    } catch (error) {
      console.error('Failed to stop workout:', error);
    }
  }, [stopWorkout]);

  // Handle character tap
  const handleCharacterTap = useCallback(() => {
    // Trigger a small celebration
    setCelebrationTrigger(true);
    setTimeout(() => setCelebrationTrigger(false), 1000);
  }, []);

  // Update route points from session
  useEffect(() => {
    if (session?.gpsPoints) {
      setRoutePoints(session.gpsPoints);
      
      // Update current location to the latest point
      if (session.gpsPoints.length > 0) {
        setCurrentLocation(session.gpsPoints[session.gpsPoints.length - 1]);
      }
    }
  }, [session?.gpsPoints]);

  // Activity type from session
  const activityType = session?.type || selectedActivity;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Top Half - Map View */}
      <View style={styles.mapContainer}>
        <FallbackMapView
          routePoints={routePoints}
          currentLocation={currentLocation || undefined}
          activityType={activityType}
          showUserLocation={true}
          followUserLocation={isActive}
          mapTheme="standard"
          showZoomControls={true}
          enableOfflineCache={true}
          width={screenWidth}
          height={screenHeight * 0.5}
        />
        
        {/* Statistics Overlay */}
        <StatsOverlay
          stats={liveStats}
          activityType={activityType}
          isVisible={isActive || isPaused}
        />
      </View>

      {/* Bottom Half - Character and Controls */}
      <View style={styles.bottomContainer}>
        {/* Character Display */}
        <View style={styles.characterContainer}>
          <SimpleCharacter3D
            activityType={activityType}
            currentSpeed={liveStats.currentSpeed}
            celebrationTrigger={celebrationTrigger}
            onCharacterTap={handleCharacterTap}
            width={screenWidth}
            height={screenHeight * 0.3}
            animationsEnabled={true}
          />
        </View>

        {/* Control Panel */}
        <View style={styles.controlPanel}>
          {!isActive && !isPaused && (
            <>
              {/* Activity Selection */}
              <View style={styles.activitySelector}>
                <ControlButton
                  title="Walk"
                  onPress={() => setSelectedActivity('walk')}
                  backgroundColor={selectedActivity === 'walk' ? '#00D4AA' : '#666666'}
                  size="small"
                />
                <ControlButton
                  title="Run"
                  onPress={() => setSelectedActivity('run')}
                  backgroundColor={selectedActivity === 'run' ? '#FF6B35' : '#666666'}
                  size="small"
                />
                <ControlButton
                  title="Bike"
                  onPress={() => setSelectedActivity('bike')}
                  backgroundColor={selectedActivity === 'bike' ? '#C724B1' : '#666666'}
                  size="small"
                />
              </View>

              {/* Start Button */}
              <ControlButton
                title="START"
                onPress={handleStartWorkout}
                backgroundColor="#4CAF50"
                disabled={isLoading}
                size="large"
              />
            </>
          )}

          {isActive && (
            <View style={styles.activeControls}>
              <ControlButton
                title="PAUSE"
                onPress={handlePauseWorkout}
                backgroundColor="#FF9800"
                disabled={isLoading}
                size="medium"
              />
              <ControlButton
                title="STOP"
                onPress={handleStopWorkout}
                backgroundColor="#F44336"
                disabled={isLoading}
                size="medium"
              />
            </View>
          )}

          {isPaused && (
            <View style={styles.activeControls}>
              <ControlButton
                title="RESUME"
                onPress={handleResumeWorkout}
                backgroundColor="#4CAF50"
                disabled={isLoading}
                size="medium"
              />
              <ControlButton
                title="STOP"
                onPress={handleStopWorkout}
                backgroundColor="#F44336"
                disabled={isLoading}
                size="medium"
              />
            </View>
          )}
        </View>
      </View>

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000'
  },
  mapContainer: {
    flex: 1,
    position: 'relative'
  },
  bottomContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a'
  },
  characterContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  controlPanel: {
    padding: 20,
    alignItems: 'center',
    gap: 16
  },
  activitySelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16
  },
  activeControls: {
    flexDirection: 'row',
    gap: 20
  },
  controlButton: {
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#ffffff'
  },
  controlButtonText: {
    fontWeight: 'bold',
    textAlign: 'center'
  },
  statsOverlay: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    padding: 16
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  statItem: {
    alignItems: 'center',
    minWidth: '30%',
    marginBottom: 8
  },
  statLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.8
  },
  statValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 2
  },
  statUnit: {
    color: '#ffffff',
    fontSize: 10,
    opacity: 0.6
  },
  errorContainer: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: '#F44336',
    padding: 12,
    borderRadius: 8
  },
  errorText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '500'
  }
});

export default WorkoutScreen;
