import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Easing,
  Dimensions
} from 'react-native';
import { Workout, ActivityType } from '../models/Workout';
import { ExaggeratedPress, useBouncySpring } from './WarioWareAnimations';
import { 
  WarioWareColors, 
  TextStyles, 
  WarioWareShadows,
  getActivityColorScheme,
  WarioWareBorderRadius,
  WarioWareSpacing 
} from '../styles/WarioWareTheme';

const { width: screenWidth } = Dimensions.get('window');

/**
 * Props for the animated workout card component
 */
interface AnimatedWorkoutCardProps {
  workout: Workout;
  onPress: (workout: Workout) => void;
  onDelete?: (workout: Workout) => void;
  index: number;
  isDeleting?: boolean;
  celebrationTrigger?: boolean;
}

/**
 * Activity type icons (using emoji for now, could be replaced with custom icons)
 */
const getActivityIcon = (type: ActivityType): string => {
  switch (type) {
    case 'walk':
      return '🚶';
    case 'run':
      return '🏃';
    case 'bike':
      return '🚴';
    default:
      return '🏃';
  }
};

/**
 * Format duration from seconds to readable string
 */
const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m ${secs}s`;
};

/**
 * Format pace from seconds per km to readable string
 */
const formatPace = (pace: number): string => {
  if (pace === 0 || !isFinite(pace)) return '--:--';
  const minutes = Math.floor(pace / 60);
  const seconds = Math.floor(pace % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Format distance from meters to kilometers
 */
const formatDistance = (distance: number): string => {
  return (distance / 1000).toFixed(2);
};

/**
 * Format date to readable string
 */
const formatDate = (date: Date): string => {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) {
    return 'Today';
  } else if (diffDays === 2) {
    return 'Yesterday';
  } else if (diffDays <= 7) {
    return `${diffDays - 1} days ago`;
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }
};

/**
 * Animated workout card component with WarioWare styling
 */
export const AnimatedWorkoutCard: React.FC<AnimatedWorkoutCardProps> = ({
  workout,
  onPress,
  onDelete,
  index,
  isDeleting = false,
  celebrationTrigger = false
}) => {
  // Animation refs
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const deleteAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  // State
  const [isPressed, setIsPressed] = useState(false);
  
  // Custom hooks
  const { springAnim, triggerBounce, resetBounce } = useBouncySpring();
  
  // Get activity color scheme
  const colorScheme = getActivityColorScheme(workout.type);

  // Entry animation
  useEffect(() => {
    const delay = index * 100; // Stagger animation based on index
    
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.back(1.7)),
          useNativeDriver: true
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.elastic(1.2),
          useNativeDriver: true
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true
        })
      ]).start();
    }, delay);
  }, [index, slideAnim, scaleAnim, opacityAnim]);

  // Delete animation
  useEffect(() => {
    if (isDeleting) {
      Animated.parallel([
        Animated.timing(deleteAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true
        })
      ]).start();
    }
  }, [isDeleting, deleteAnim, rotateAnim]);

  // Celebration animation
  useEffect(() => {
    if (celebrationTrigger) {
      triggerBounce(1.1);
      setTimeout(() => resetBounce(), 500);
      
      // Glow effect
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.in(Easing.quad),
          useNativeDriver: false
        })
      ]).start();
    }
  }, [celebrationTrigger, triggerBounce, resetBounce, glowAnim]);

  // Handle press
  const handlePress = () => {
    setIsPressed(true);
    triggerBounce(0.95);
    setTimeout(() => {
      setIsPressed(false);
      resetBounce();
      onPress(workout);
    }, 150);
  };

  // Handle delete
  const handleDelete = () => {
    if (onDelete) {
      onDelete(workout);
    }
  };

  // Interpolated values
  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [screenWidth, 0]
  });

  const deleteScale = deleteAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1]
  });

  const deleteRotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '10deg']
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.6]
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: opacityAnim,
          transform: [
            { translateX },
            { scale: scaleAnim },
            { scale: springAnim },
            { scale: deleteScale },
            { rotate: deleteRotate }
          ]
        }
      ]}
    >
      {/* Glow effect */}
      <Animated.View
        style={[
          styles.glowEffect,
          {
            backgroundColor: colorScheme.primary,
            opacity: glowOpacity
          }
        ]}
      />
      
      <ExaggeratedPress
        onPress={handlePress}
        pressScale={0.98}
        pressRotation={2}
        shakeIntensity={3}
        style={styles.pressContainer}
      >
        <View
          style={[
            styles.card,
            {
              borderColor: colorScheme.primary,
              backgroundColor: isPressed 
                ? colorScheme.secondary 
                : WarioWareColors.neutral.surface
            }
          ]}
        >
          {/* Header with activity icon and type */}
          <View style={styles.header}>
            <View style={styles.activityInfo}>
              <Text style={styles.activityIcon}>
                {getActivityIcon(workout.type)}
              </Text>
              <Text style={[styles.activityType, { color: colorScheme.primary }]}>
                {workout.type.toUpperCase()}
              </Text>
            </View>
            
            <Text style={styles.date}>
              {formatDate(workout.startTime)}
            </Text>
            
            {onDelete && (
              <TouchableOpacity
                onPress={handleDelete}
                style={styles.deleteButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.deleteIcon}>🗑️</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Main stats */}
          <View style={styles.statsContainer}>
            <View style={styles.primaryStat}>
              <Text style={[styles.primaryValue, { color: colorScheme.primary }]}>
                {formatDistance(workout.distance)}
              </Text>
              <Text style={styles.primaryLabel}>km</Text>
            </View>
            
            <View style={styles.secondaryStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {formatDuration(workout.duration)}
                </Text>
                <Text style={styles.statLabel}>TIME</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {formatPace(workout.avgPace)}
                </Text>
                <Text style={styles.statLabel}>PACE</Text>
              </View>
              
              {workout.calories && (
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {Math.round(workout.calories)}
                  </Text>
                  <Text style={styles.statLabel}>CAL</Text>
                </View>
              )}
            </View>
          </View>

          {/* Progress bar */}
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressBar,
                {
                  backgroundColor: colorScheme.primary,
                  width: `${Math.min((workout.distance / 5000) * 100, 100)}%` // Progress based on 5km goal
                }
              ]}
            />
          </View>

          {/* Workout name or notes */}
          {(workout.name || workout.notes) && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesText} numberOfLines={1}>
                {workout.name || workout.notes}
              </Text>
            </View>
          )}
        </View>
      </ExaggeratedPress>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: WarioWareSpacing.md,
    marginVertical: WarioWareSpacing.sm,
    position: 'relative'
  },
  glowEffect: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: WarioWareBorderRadius.large + 4,
    opacity: 0
  },
  pressContainer: {
    flex: 1
  },
  card: {
    backgroundColor: WarioWareColors.neutral.surface,
    borderRadius: WarioWareBorderRadius.large,
    borderWidth: 3,
    padding: WarioWareSpacing.md,
    ...WarioWareShadows.medium
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: WarioWareSpacing.md
  },
  activityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  activityIcon: {
    fontSize: 24,
    marginRight: WarioWareSpacing.sm
  },
  activityType: {
    ...TextStyles.subtitle,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1
  },
  date: {
    ...TextStyles.label,
    fontSize: 12,
    opacity: 0.8
  },
  deleteButton: {
    padding: WarioWareSpacing.xs,
    marginLeft: WarioWareSpacing.sm
  },
  deleteIcon: {
    fontSize: 18
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: WarioWareSpacing.md
  },
  primaryStat: {
    alignItems: 'center',
    marginRight: WarioWareSpacing.lg
  },
  primaryValue: {
    ...TextStyles.stat,
    fontSize: 32,
    fontWeight: '900'
  },
  primaryLabel: {
    ...TextStyles.label,
    fontSize: 14,
    fontWeight: '700',
    marginTop: -4
  },
  secondaryStats: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  statItem: {
    alignItems: 'center'
  },
  statValue: {
    ...TextStyles.body,
    fontSize: 16,
    fontWeight: '700',
    color: WarioWareColors.neutral.white
  },
  statLabel: {
    ...TextStyles.label,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2
  },
  progressContainer: {
    height: 4,
    backgroundColor: WarioWareColors.neutral.darkGray,
    borderRadius: 2,
    marginBottom: WarioWareSpacing.sm,
    overflow: 'hidden'
  },
  progressBar: {
    height: '100%',
    borderRadius: 2
  },
  notesContainer: {
    marginTop: WarioWareSpacing.xs
  },
  notesText: {
    ...TextStyles.body,
    fontSize: 14,
    fontStyle: 'italic',
    opacity: 0.8
  }
});

export default AnimatedWorkoutCard;
