import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Easing
} from 'react-native';
import { Workout } from '../models/Workout';
import { ScreenTransition, ConfettiAnimation } from './WarioWareAnimations';
import { EnhancedWarioWareButton } from './EnhancedWarioWareButton';
import { 
  WarioWareColors, 
  TextStyles, 
  WarioWareShadows,
  getActivityColorScheme,
  WarioWareBorderRadius,
  WarioWareSpacing,
  LayoutPresets
} from '../styles/WarioWareTheme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/**
 * Props for the workout detail view component
 */
interface WorkoutDetailViewProps {
  workout: Workout | null;
  isVisible: boolean;
  onClose: () => void;
  onDelete?: (workout: Workout) => void;
  onEdit?: (workout: Workout) => void;
}

/**
 * Activity type icons and descriptions
 */
const getActivityDetails = (type: string) => {
  switch (type) {
    case 'walk':
      return { icon: '🚶', name: 'Walking', description: 'A leisurely walk' };
    case 'run':
      return { icon: '🏃', name: 'Running', description: 'High-intensity run' };
    case 'bike':
      return { icon: '🚴', name: 'Cycling', description: 'Bike ride adventure' };
    default:
      return { icon: '🏃', name: 'Workout', description: 'Physical activity' };
  }
};

/**
 * Format duration with detailed breakdown
 */
const formatDetailedDuration = (seconds: number): { hours: number; minutes: number; seconds: number; formatted: string } => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  let formatted = '';
  if (hours > 0) {
    formatted = `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    formatted = `${minutes}m ${secs}s`;
  } else {
    formatted = `${secs}s`;
  }
  
  return { hours, minutes, seconds: secs, formatted };
};

/**
 * Format pace with min/km
 */
const formatPace = (pace: number): string => {
  if (pace === 0 || !isFinite(pace)) return '--:--';
  const minutes = Math.floor(pace / 60);
  const seconds = Math.floor(pace % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Format speed in km/h
 */
const formatSpeed = (speed: number): string => {
  return (speed * 3.6).toFixed(1);
};

/**
 * Calculate workout statistics
 */
const calculateWorkoutStats = (workout: Workout) => {
  const avgSpeed = workout.distance / workout.duration; // m/s
  const maxSpeedKmh = workout.maxSpeed * 3.6;
  const avgSpeedKmh = avgSpeed * 3.6;
  const distanceKm = workout.distance / 1000;
  
  return {
    avgSpeed: avgSpeedKmh,
    maxSpeedKmh,
    distanceKm,
    caloriesPerKm: workout.calories ? workout.calories / distanceKm : 0,
    paceVariation: 'Steady' // Could be calculated from GPS points
  };
};

/**
 * Detailed workout view component with slide-in animations
 */
export const WorkoutDetailView: React.FC<WorkoutDetailViewProps> = ({
  workout,
  isVisible,
  onClose,
  onDelete,
  onEdit
}) => {
  // Animation refs
  const slideAnim = useRef(new Animated.Value(screenWidth)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;
  const headerAnim = useRef(new Animated.Value(-100)).current;
  const statsAnim = useRef(new Animated.Value(50)).current;
  
  // State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [celebrationTrigger, setCelebrationTrigger] = useState(false);

  // Get activity details and color scheme
  const activityDetails = workout ? getActivityDetails(workout.type) : null;
  const colorScheme = workout ? getActivityColorScheme(workout.type) : null;
  const workoutStats = workout ? calculateWorkoutStats(workout) : null;
  const duration = workout ? formatDetailedDuration(workout.duration) : null;

  // Slide-in animation
  useEffect(() => {
    if (isVisible && workout) {
      // Reset animations
      slideAnim.setValue(screenWidth);
      overlayAnim.setValue(0);
      contentAnim.setValue(0);
      headerAnim.setValue(-100);
      statsAnim.setValue(50);
      
      // Start slide-in sequence
      Animated.parallel([
        Animated.timing(overlayAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.back(1.7)),
          useNativeDriver: true
        })
      ]).start(() => {
        // Animate content after slide-in
        Animated.stagger(100, [
          Animated.timing(headerAnim, {
            toValue: 0,
            duration: 400,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver: true
          }),
          Animated.timing(contentAnim, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true
          }),
          Animated.timing(statsAnim, {
            toValue: 0,
            duration: 400,
            easing: Easing.out(Easing.back(1.2)),
            useNativeDriver: true
          })
        ]).start();
      });
    } else if (!isVisible) {
      // Slide-out animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: screenWidth,
          duration: 300,
          easing: Easing.in(Easing.back(1.7)),
          useNativeDriver: true
        }),
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true
        })
      ]).start();
    }
  }, [isVisible, workout, slideAnim, overlayAnim, contentAnim, headerAnim, statsAnim]);

  // Handle delete confirmation
  const handleDeletePress = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    if (workout && onDelete) {
      setCelebrationTrigger(true);
      setTimeout(() => {
        onDelete(workout);
        onClose();
        setShowDeleteConfirm(false);
        setCelebrationTrigger(false);
      }, 1000);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  // Handle edit
  const handleEdit = () => {
    if (workout && onEdit) {
      onEdit(workout);
    }
  };

  if (!workout || !activityDetails || !colorScheme || !workoutStats || !duration) {
    return null;
  }

  return (
    <ScreenTransition isVisible={isVisible} transitionType="whoosh">
      <View style={styles.container}>
        {/* Overlay */}
        <Animated.View
          style={[
            styles.overlay,
            { opacity: overlayAnim }
          ]}
        >
          <TouchableOpacity
            style={styles.overlayTouch}
            onPress={onClose}
            activeOpacity={1}
          />
        </Animated.View>

        {/* Detail panel */}
        <Animated.View
          style={[
            styles.detailPanel,
            {
              backgroundColor: colorScheme.dark,
              transform: [{ translateX: slideAnim }]
            }
          ]}
        >
          {/* Header */}
          <Animated.View
            style={[
              styles.header,
              {
                transform: [{ translateY: headerAnim }]
              }
            ]}
          >
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
            
            <View style={styles.headerContent}>
              <Text style={styles.activityIcon}>{activityDetails.icon}</Text>
              <View style={styles.headerText}>
                <Text style={[styles.activityName, { color: colorScheme.primary }]}>
                  {activityDetails.name}
                </Text>
                <Text style={styles.activityDescription}>
                  {activityDetails.description}
                </Text>
              </View>
            </View>
            
            <Text style={styles.date}>
              {workout.startTime.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </Text>
          </Animated.View>

          {/* Content */}
          <Animated.View
            style={[
              styles.content,
              { opacity: contentAnim }
            ]}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Main stats */}
              <View style={styles.mainStats}>
                <View style={styles.primaryStat}>
                  <Text style={[styles.primaryValue, { color: colorScheme.primary }]}>
                    {workoutStats.distanceKm.toFixed(2)}
                  </Text>
                  <Text style={styles.primaryLabel}>KILOMETERS</Text>
                </View>
                
                <View style={styles.timeStats}>
                  <Text style={[styles.timeValue, { color: colorScheme.primary }]}>
                    {duration.formatted}
                  </Text>
                  <Text style={styles.timeLabel}>DURATION</Text>
                </View>
              </View>

              {/* Detailed stats grid */}
              <Animated.View
                style={[
                  styles.statsGrid,
                  {
                    transform: [{ translateY: statsAnim }]
                  }
                ]}
              >
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{formatPace(workout.avgPace)}</Text>
                  <Text style={styles.statLabel}>AVG PACE</Text>
                  <Text style={styles.statUnit}>min/km</Text>
                </View>
                
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{workoutStats.avgSpeed.toFixed(1)}</Text>
                  <Text style={styles.statLabel}>AVG SPEED</Text>
                  <Text style={styles.statUnit}>km/h</Text>
                </View>
                
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{workoutStats.maxSpeedKmh.toFixed(1)}</Text>
                  <Text style={styles.statLabel}>MAX SPEED</Text>
                  <Text style={styles.statUnit}>km/h</Text>
                </View>
                
                {workout.calories && (
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{Math.round(workout.calories)}</Text>
                    <Text style={styles.statLabel}>CALORIES</Text>
                    <Text style={styles.statUnit}>kcal</Text>
                  </View>
                )}
                
                {workoutStats.caloriesPerKm > 0 && (
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{Math.round(workoutStats.caloriesPerKm)}</Text>
                    <Text style={styles.statLabel}>CAL/KM</Text>
                    <Text style={styles.statUnit}>kcal</Text>
                  </View>
                )}
                
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{workout.gpsPoints.length}</Text>
                  <Text style={styles.statLabel}>GPS POINTS</Text>
                  <Text style={styles.statUnit}>recorded</Text>
                </View>
              </Animated.View>

              {/* Workout notes */}
              {(workout.name || workout.notes) && (
                <View style={styles.notesSection}>
                  <Text style={styles.sectionTitle}>NOTES</Text>
                  <View style={styles.notesCard}>
                    <Text style={styles.notesText}>
                      {workout.name || workout.notes}
                    </Text>
                  </View>
                </View>
              )}

              {/* Time breakdown */}
              <View style={styles.timeBreakdown}>
                <Text style={styles.sectionTitle}>TIME BREAKDOWN</Text>
                <View style={styles.timeCards}>
                  {duration.hours > 0 && (
                    <View style={styles.timeCard}>
                      <Text style={[styles.timeCardValue, { color: colorScheme.primary }]}>
                        {duration.hours}
                      </Text>
                      <Text style={styles.timeCardLabel}>HOURS</Text>
                    </View>
                  )}
                  
                  <View style={styles.timeCard}>
                    <Text style={[styles.timeCardValue, { color: colorScheme.primary }]}>
                      {duration.minutes}
                    </Text>
                    <Text style={styles.timeCardLabel}>MINUTES</Text>
                  </View>
                  
                  <View style={styles.timeCard}>
                    <Text style={[styles.timeCardValue, { color: colorScheme.primary }]}>
                      {duration.seconds}
                    </Text>
                    <Text style={styles.timeCardLabel}>SECONDS</Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </Animated.View>

          {/* Action buttons */}
          <View style={styles.actionButtons}>
            {!showDeleteConfirm ? (
              <>
                {onEdit && (
                  <EnhancedWarioWareButton
                    title="EDIT"
                    onPress={handleEdit}
                    variant="secondary"
                    size="medium"
                    pulse={true}
                    shakeOnPress={true}
                    style={styles.actionButton}
                  />
                )}
                
                {onDelete && (
                  <EnhancedWarioWareButton
                    title="DELETE"
                    onPress={handleDeletePress}
                    variant="danger"
                    size="medium"
                    shakeOnPress={true}
                    style={styles.actionButton}
                  />
                )}
              </>
            ) : (
              <>
                <EnhancedWarioWareButton
                  title="CANCEL"
                  onPress={handleDeleteCancel}
                  variant="secondary"
                  size="medium"
                  style={styles.actionButton}
                />
                
                <EnhancedWarioWareButton
                  title="CONFIRM DELETE"
                  onPress={handleDeleteConfirm}
                  variant="danger"
                  size="medium"
                  explode={true}
                  shakeOnPress={true}
                  style={styles.actionButton}
                />
              </>
            )}
          </View>
        </Animated.View>

        {/* Celebration confetti */}
        <ConfettiAnimation
          trigger={celebrationTrigger}
          particleCount={50}
          duration={2000}
          colors={[colorScheme.primary, colorScheme.secondary, WarioWareColors.primary.yellow]}
        />
      </View>
    </ScreenTransition>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)'
  },
  overlayTouch: {
    flex: 1
  },
  detailPanel: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: screenWidth * 0.9,
    borderTopLeftRadius: WarioWareBorderRadius.large,
    borderBottomLeftRadius: WarioWareBorderRadius.large,
    ...WarioWareShadows.large
  },
  header: {
    padding: WarioWareSpacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)'
  },
  closeButton: {
    position: 'absolute',
    top: WarioWareSpacing.md,
    right: WarioWareSpacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1
  },
  closeIcon: {
    color: WarioWareColors.neutral.white,
    fontSize: 18,
    fontWeight: 'bold'
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: WarioWareSpacing.md
  },
  activityIcon: {
    fontSize: 48,
    marginRight: WarioWareSpacing.md
  },
  headerText: {
    flex: 1
  },
  activityName: {
    ...TextStyles.title,
    fontSize: 24,
    marginBottom: 4
  },
  activityDescription: {
    ...TextStyles.body,
    opacity: 0.8
  },
  date: {
    ...TextStyles.label,
    textAlign: 'center',
    marginTop: WarioWareSpacing.sm
  },
  content: {
    flex: 1,
    padding: WarioWareSpacing.lg
  },
  mainStats: {
    alignItems: 'center',
    marginBottom: WarioWareSpacing.xl
  },
  primaryStat: {
    alignItems: 'center',
    marginBottom: WarioWareSpacing.md
  },
  primaryValue: {
    fontSize: 48,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4
  },
  primaryLabel: {
    ...TextStyles.label,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2
  },
  timeStats: {
    alignItems: 'center'
  },
  timeValue: {
    fontSize: 32,
    fontWeight: '800'
  },
  timeLabel: {
    ...TextStyles.label,
    fontSize: 12,
    fontWeight: '600'
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: WarioWareSpacing.xl
  },
  statCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: WarioWareBorderRadius.medium,
    padding: WarioWareSpacing.md,
    alignItems: 'center',
    marginBottom: WarioWareSpacing.md
  },
  statValue: {
    ...TextStyles.stat,
    fontSize: 20,
    color: WarioWareColors.neutral.white
  },
  statLabel: {
    ...TextStyles.label,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4
  },
  statUnit: {
    ...TextStyles.label,
    fontSize: 8,
    opacity: 0.6
  },
  notesSection: {
    marginBottom: WarioWareSpacing.xl
  },
  sectionTitle: {
    ...TextStyles.subtitle,
    fontSize: 16,
    marginBottom: WarioWareSpacing.md,
    color: WarioWareColors.neutral.white
  },
  notesCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: WarioWareBorderRadius.medium,
    padding: WarioWareSpacing.md
  },
  notesText: {
    ...TextStyles.body,
    fontStyle: 'italic'
  },
  timeBreakdown: {
    marginBottom: WarioWareSpacing.xl
  },
  timeCards: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  timeCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: WarioWareBorderRadius.medium,
    padding: WarioWareSpacing.md,
    minWidth: 80
  },
  timeCardValue: {
    fontSize: 24,
    fontWeight: '900'
  },
  timeCardLabel: {
    ...TextStyles.label,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4
  },
  actionButtons: {
    flexDirection: 'row',
    padding: WarioWareSpacing.lg,
    gap: WarioWareSpacing.md,
    borderTopWidth: 2,
    borderTopColor: 'rgba(255, 255, 255, 0.1)'
  },
  actionButton: {
    flex: 1
  }
});

export default WorkoutDetailView;
