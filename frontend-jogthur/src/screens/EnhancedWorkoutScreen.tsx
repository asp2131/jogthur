import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Animated,
  Text,
  Platform
} from 'react-native';
import { FallbackMapView } from '../components/FallbackMapView';
import { SimpleCharacter3D } from '../components/SimpleCharacter3D';
import { EnhancedWarioWareButton } from '../components/EnhancedWarioWareButton';
import { EnhancedAnimatedStatsDisplay } from '../components/EnhancedAnimatedStatsDisplay';
import { 
  ConfettiAnimation, 
  ScreenTransition, 
  WarioWareLoading, 
  useScreenShake 
} from '../components/WarioWareAnimations';
import { useWorkoutStore, useCurrentWorkout, useWorkoutActions } from '../stores/workoutStore';
import { usePermissionAwareActions } from '../hooks/usePermissions';
import { ActivityType, LocationPoint } from '../models';
import { WorkoutState } from '../services/WorkoutManager';
import { 
  WarioWareColors, 
  LayoutPresets, 
  TextStyles, 
  getActivityColorScheme 
} from '../styles/WarioWareTheme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/**
 * Enhanced main workout screen component with WarioWare-style animations
 */
export const EnhancedWorkoutScreen: React.FC = () => {
  const [selectedActivity, setSelectedActivity] = useState<ActivityType>('run');
  const [routePoints, setRoutePoints] = useState<LocationPoint[]>([]);
  const [currentLocation, setCurrentLocation] = useState<LocationPoint | null>(null);
  const [celebrationTrigger, setCelebrationTrigger] = useState(false);
  const [confettiTrigger, setConfettiTrigger] = useState(false);
  const [screenVisible, setScreenVisible] = useState(true);

  // Workout store hooks
  const { session, stats, isActive, isPaused } = useCurrentWorkout();
  const { startWorkout, pauseWorkout, resumeWorkout, stopWorkout, isLoading, error } = useWorkoutActions();
  const { ensurePermissionsForWorkout } = usePermissionAwareActions();

  // Screen shake hook
  const { shakeAnim, triggerShake } = useScreenShake();

  // Animation refs
  const backgroundAnim = React.useRef(new Animated.Value(0)).current;
  const controlPanelAnim = React.useRef(new Animated.Value(1)).current;

  // Get activity color scheme
  const colorScheme = getActivityColorScheme(selectedActivity);

  // Live statistics
  const liveStats = useMemo(() => ({
    distance: stats?.distance || 0,
    duration: stats?.duration || 0,
    currentPace: stats?.currentPace || 0,
    averagePace: stats?.averagePace || 0,
    currentSpeed: stats?.currentSpeed || 0,
    calories: stats?.calories || 0
  }), [stats]);

  // Background color animation based on activity
  useEffect(() => {
    Animated.timing(backgroundAnim, {
      toValue: isActive ? 1 : 0,
      duration: 1000,
      useNativeDriver: false
    }).start();
  }, [isActive, backgroundAnim]);

  // Handle workout start with enhanced animations
  const handleStartWorkout = useCallback(async () => {
    try {
      const hasPermissions = await ensurePermissionsForWorkout(true);
      if (!hasPermissions) {
        console.warn('Insufficient permissions for workout');
        triggerShake(15, 800); // Strong shake for error
        return;
      }

      // Trigger screen shake for excitement
      triggerShake(8, 400);

      // Animate control panel
      Animated.timing(controlPanelAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true
      }).start(() => {
        Animated.spring(controlPanelAnim, {
          toValue: 1,
          tension: 300,
          friction: 8,
          useNativeDriver: true
        }).start();
      });

      await startWorkout(selectedActivity);
    } catch (error) {
      console.error('Failed to start workout:', error);
      triggerShake(12, 600); // Shake for error
    }
  }, [selectedActivity, startWorkout, ensurePermissionsForWorkout, triggerShake, controlPanelAnim]);

  // Handle workout pause
  const handlePauseWorkout = useCallback(async () => {
    try {
      triggerShake(5, 300);
      await pauseWorkout();
    } catch (error) {
      console.error('Failed to pause workout:', error);
      triggerShake(10, 500);
    }
  }, [pauseWorkout, triggerShake]);

  // Handle workout resume
  const handleResumeWorkout = useCallback(async () => {
    try {
      triggerShake(6, 350);
      await resumeWorkout();
    } catch (error) {
      console.error('Failed to resume workout:', error);
      triggerShake(10, 500);
    }
  }, [resumeWorkout, triggerShake]);

  // Handle workout stop with celebration
  const handleStopWorkout = useCallback(async () => {
    try {
      const completedWorkout = await stopWorkout();
      
      // Trigger massive celebration
      setCelebrationTrigger(true);
      setConfettiTrigger(true);
      triggerShake(20, 1000);
      
      setTimeout(() => {
        setCelebrationTrigger(false);
        setConfettiTrigger(false);
      }, 4000);
      
      console.log('Workout completed:', completedWorkout);
    } catch (error) {
      console.error('Failed to stop workout:', error);
      triggerShake(12, 600);
    }
  }, [stopWorkout, triggerShake]);

  // Handle character tap
  const handleCharacterTap = useCallback(() => {
    setCelebrationTrigger(true);
    triggerShake(4, 200);
    setTimeout(() => setCelebrationTrigger(false), 1000);
  }, [triggerShake]);

  // Handle activity selection with animations
  const handleActivitySelect = useCallback((activity: ActivityType) => {
    setSelectedActivity(activity);
    triggerShake(3, 150);
  }, [triggerShake]);

  // Update route points from session
  useEffect(() => {
    if (session?.gpsPoints) {
      setRoutePoints(session.gpsPoints);
      
      if (session.gpsPoints.length > 0) {
        setCurrentLocation(session.gpsPoints[session.gpsPoints.length - 1]);
      }
    }
  }, [session?.gpsPoints]);

  // Activity type from session
  const activityType = session?.type || selectedActivity;

  // Background color interpolation
  const backgroundColor = backgroundAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [WarioWareColors.neutral.background, colorScheme.dark]
  });

  return (
    <ScreenTransition isVisible={screenVisible} transitionType="zoom">
      <SafeAreaView style={[styles.container, LayoutPresets.container]}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        
        {/* Animated background */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor }
          ]}
        />

        {/* Screen shake container */}
        <Animated.View
          style={[
            styles.shakeContainer,
            {
              transform: [{ translateX: shakeAnim }]
            }
          ]}
        >
          {/* Top Half - Map View */}
          <View style={[styles.mapContainer, LayoutPresets.topHalf]}>
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
            
            {/* Enhanced Statistics Overlay */}
            <EnhancedAnimatedStatsDisplay
              distance={liveStats.distance}
              duration={liveStats.duration}
              currentPace={liveStats.currentPace}
              averagePace={liveStats.averagePace}
              currentSpeed={liveStats.currentSpeed}
              calories={liveStats.calories}
              activityType={activityType}
              isVisible={isActive || isPaused}
              celebrationTrigger={celebrationTrigger}
            />
          </View>

          {/* Bottom Half - Character and Controls */}
          <View style={[styles.bottomContainer, LayoutPresets.bottomHalf]}>
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

            {/* Enhanced Control Panel */}
            <Animated.View
              style={[
                styles.controlPanel,
                {
                  transform: [{ scale: controlPanelAnim }]
                }
              ]}
            >
              {!isActive && !isPaused && (
                <>
                  {/* Activity Selection with Enhanced Buttons */}
                  <View style={styles.activitySelector}>
                    <EnhancedWarioWareButton
                      title="WALK"
                      onPress={() => handleActivitySelect('walk')}
                      variant={selectedActivity === 'walk' ? 'success' : 'secondary'}
                      size="small"
                      pulse={selectedActivity === 'walk'}
                      rainbow={selectedActivity === 'walk'}
                      shakeOnPress={true}
                    />
                    <EnhancedWarioWareButton
                      title="RUN"
                      onPress={() => handleActivitySelect('run')}
                      variant={selectedActivity === 'run' ? 'primary' : 'secondary'}
                      size="small"
                      pulse={selectedActivity === 'run'}
                      rainbow={selectedActivity === 'run'}
                      shakeOnPress={true}
                    />
                    <EnhancedWarioWareButton
                      title="BIKE"
                      onPress={() => handleActivitySelect('bike')}
                      variant={selectedActivity === 'bike' ? 'neon' : 'secondary'}
                      size="small"
                      pulse={selectedActivity === 'bike'}
                      rainbow={selectedActivity === 'bike'}
                      shakeOnPress={true}
                    />
                  </View>

                  {/* Start Button */}
                  <EnhancedWarioWareButton
                    title="START WORKOUT!"
                    onPress={handleStartWorkout}
                    variant="success"
                    size="xlarge"
                    disabled={isLoading}
                    pulse={true}
                    bounce={true}
                    explode={true}
                    shakeOnPress={true}
                  />
                </>
              )}

              {isActive && (
                <View style={styles.activeControls}>
                  <EnhancedWarioWareButton
                    title="PAUSE"
                    onPress={handlePauseWorkout}
                    variant="warning"
                    size="large"
                    disabled={isLoading}
                    pulse={true}
                    shakeOnPress={true}
                  />
                  <EnhancedWarioWareButton
                    title="STOP"
                    onPress={handleStopWorkout}
                    variant="danger"
                    size="large"
                    disabled={isLoading}
                    explode={true}
                    shakeOnPress={true}
                  />
                </View>
              )}

              {isPaused && (
                <View style={styles.activeControls}>
                  <EnhancedWarioWareButton
                    title="RESUME"
                    onPress={handleResumeWorkout}
                    variant="success"
                    size="large"
                    disabled={isLoading}
                    pulse={true}
                    bounce={true}
                    shakeOnPress={true}
                  />
                  <EnhancedWarioWareButton
                    title="STOP"
                    onPress={handleStopWorkout}
                    variant="danger"
                    size="large"
                    disabled={isLoading}
                    explode={true}
                    shakeOnPress={true}
                  />
                </View>
              )}
            </Animated.View>
          </View>

          {/* Error Display with WarioWare styling */}
          {error && (
            <ScreenTransition isVisible={!!error} transitionType="whoosh">
              <View style={styles.errorContainer}>
                <Text style={[styles.errorText, TextStyles.button]}>
                  ⚠️ {error} ⚠️
                </Text>
              </View>
            </ScreenTransition>
          )}
        </Animated.View>

        {/* Loading overlay */}
        <WarioWareLoading
          isVisible={isLoading}
          size={80}
          colors={[
            colorScheme.primary,
            colorScheme.secondary,
            WarioWareColors.primary.yellow,
            WarioWareColors.primary.green
          ]}
        />

        {/* Confetti celebration */}
        <ConfettiAnimation
          trigger={confettiTrigger}
          particleCount={100}
          duration={4000}
          colors={[
            colorScheme.primary,
            WarioWareColors.primary.yellow,
            WarioWareColors.primary.green,
            WarioWareColors.primary.blue,
            WarioWareColors.primary.pink
          ]}
        />
      </SafeAreaView>
    </ScreenTransition>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  shakeContainer: {
    flex: 1
  },
  mapContainer: {
    flex: 1,
    position: 'relative'
  },
  bottomContainer: {
    flex: 1
  },
  characterContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  controlPanel: {
    padding: 20,
    alignItems: 'center',
    gap: 20
  },
  activitySelector: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20
  },
  activeControls: {
    flexDirection: 'row',
    gap: 24,
    justifyContent: 'center'
  },
  errorContainer: {
    position: 'absolute',
    bottom: 120,
    left: 16,
    right: 16,
    backgroundColor: WarioWareColors.primary.red,
    padding: 16,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: WarioWareColors.neutral.white,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12
  },
  errorText: {
    color: WarioWareColors.neutral.white,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4
  }
});

export default EnhancedWorkoutScreen;
