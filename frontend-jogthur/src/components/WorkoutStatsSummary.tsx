import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing
} from 'react-native';
import { Workout } from '../models/Workout';
import { useBouncySpring } from './WarioWareAnimations';
import { 
  WarioWareColors, 
  TextStyles, 
  WarioWareShadows,
  WarioWareBorderRadius,
  WarioWareSpacing,
  getActivityColorScheme
} from '../styles/WarioWareTheme';

/**
 * Props for the workout statistics summary component
 */
interface WorkoutStatsSummaryProps {
  workouts: Workout[];
  celebrationTrigger?: boolean;
}

/**
 * Calculate comprehensive workout statistics
 */
const calculateWorkoutStatistics = (workouts: Workout[]) => {
  if (workouts.length === 0) {
    return {
      totalWorkouts: 0,
      totalDistance: 0,
      totalDuration: 0,
      totalCalories: 0,
      avgDistance: 0,
      avgDuration: 0,
      avgPace: 0,
      longestWorkout: 0,
      fastestPace: 0,
      activityBreakdown: { walk: 0, run: 0, bike: 0 },
      weeklyAverage: 0,
      monthlyGoalProgress: 0
    };
  }

  const totalDistance = workouts.reduce((sum, w) => sum + w.distance, 0);
  const totalDuration = workouts.reduce((sum, w) => sum + w.duration, 0);
  const totalCalories = workouts.reduce((sum, w) => sum + (w.calories || 0), 0);
  
  const avgDistance = totalDistance / workouts.length;
  const avgDuration = totalDuration / workouts.length;
  
  // Calculate average pace (weighted by distance)
  const totalPaceDistance = workouts.reduce((sum, w) => sum + (w.avgPace * w.distance), 0);
  const avgPace = totalPaceDistance / totalDistance;
  
  // Find longest workout and fastest pace
  const longestWorkout = Math.max(...workouts.map(w => w.distance));
  const fastestPace = Math.min(...workouts.map(w => w.avgPace).filter(p => p > 0));
  
  // Activity breakdown
  const activityBreakdown = workouts.reduce((acc, w) => {
    acc[w.type] = (acc[w.type] || 0) + 1;
    return acc;
  }, { walk: 0, run: 0, bike: 0 } as Record<string, number>);
  
  // Weekly average (assuming workouts span multiple weeks)
  const oldestWorkout = new Date(Math.min(...workouts.map(w => w.startTime.getTime())));
  const newestWorkout = new Date(Math.max(...workouts.map(w => w.startTime.getTime())));
  const weeksDiff = Math.max(1, Math.ceil((newestWorkout.getTime() - oldestWorkout.getTime()) / (7 * 24 * 60 * 60 * 1000)));
  const weeklyAverage = workouts.length / weeksDiff;
  
  // Monthly goal progress (assuming 100km monthly goal)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const currentMonthWorkouts = workouts.filter(w => 
    w.startTime.getMonth() === currentMonth && w.startTime.getFullYear() === currentYear
  );
  const currentMonthDistance = currentMonthWorkouts.reduce((sum, w) => sum + w.distance, 0);
  const monthlyGoalProgress = (currentMonthDistance / 100000) * 100; // 100km goal
  
  return {
    totalWorkouts: workouts.length,
    totalDistance,
    totalDuration,
    totalCalories,
    avgDistance,
    avgDuration,
    avgPace: isFinite(avgPace) ? avgPace : 0,
    longestWorkout,
    fastestPace: isFinite(fastestPace) ? fastestPace : 0,
    activityBreakdown,
    weeklyAverage,
    monthlyGoalProgress: Math.min(100, monthlyGoalProgress)
  };
};

/**
 * Format large numbers with appropriate units
 */
const formatLargeNumber = (num: number, unit: string): { value: string; unit: string } => {
  if (unit === 'm' && num >= 1000) {
    return { value: (num / 1000).toFixed(1), unit: 'km' };
  }
  if (unit === 's' && num >= 3600) {
    const hours = Math.floor(num / 3600);
    const minutes = Math.floor((num % 3600) / 60);
    return { value: `${hours}h ${minutes}m`, unit: '' };
  }
  if (unit === 's' && num >= 60) {
    const minutes = Math.floor(num / 60);
    const seconds = Math.floor(num % 60);
    return { value: `${minutes}m ${seconds}s`, unit: '' };
  }
  return { value: num.toFixed(0), unit };
};

/**
 * Format pace
 */
const formatPace = (pace: number): string => {
  if (pace === 0 || !isFinite(pace)) return '--:--';
  const minutes = Math.floor(pace / 60);
  const seconds = Math.floor(pace % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Animated stat item component
 */
interface AnimatedStatItemProps {
  label: string;
  value: string;
  unit: string;
  color: string;
  delay: number;
  celebrationTrigger?: boolean;
}

const AnimatedStatItem: React.FC<AnimatedStatItemProps> = ({
  label,
  value,
  unit,
  color,
  delay,
  celebrationTrigger = false
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const { springAnim, triggerBounce, resetBounce } = useBouncySpring();

  useEffect(() => {
    setTimeout(() => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 300,
        friction: 8,
        useNativeDriver: true
      }).start();
    }, delay);
  }, [scaleAnim, delay]);

  useEffect(() => {
    if (celebrationTrigger) {
      triggerBounce(1.2);
      setTimeout(() => resetBounce(), 600);
      
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 500,
          easing: Easing.in(Easing.quad),
          useNativeDriver: false
        })
      ]).start();
    }
  }, [celebrationTrigger, triggerBounce, resetBounce, glowAnim]);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.8]
  });

  return (
    <Animated.View
      style={[
        styles.statItem,
        {
          transform: [
            { scale: scaleAnim },
            { scale: springAnim }
          ]
        }
      ]}
    >
      <Animated.View
        style={[
          styles.statGlow,
          {
            backgroundColor: color,
            opacity: glowOpacity
          }
        ]}
      />
      
      <View style={styles.statContent}>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
        {unit && <Text style={styles.statUnit}>{unit}</Text>}
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </Animated.View>
  );
};

/**
 * Progress bar component
 */
interface ProgressBarProps {
  progress: number;
  color: string;
  label: string;
  delay: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, color, label, delay }) => {
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setTimeout(() => {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 300,
          friction: 8,
          useNativeDriver: true
        }),
        Animated.timing(progressAnim, {
          toValue: progress,
          duration: 1500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false
        })
      ]).start();
    }, delay);
  }, [progressAnim, scaleAnim, progress, delay]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp'
  });

  return (
    <Animated.View
      style={[
        styles.progressContainer,
        {
          transform: [{ scale: scaleAnim }]
        }
      ]}
    >
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={[styles.progressValue, { color }]}>
          {Math.round(progress)}%
        </Text>
      </View>
      
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              backgroundColor: color,
              width: progressWidth
            }
          ]}
        />
      </View>
    </Animated.View>
  );
};

/**
 * Workout statistics summary component
 */
export const WorkoutStatsSummary: React.FC<WorkoutStatsSummaryProps> = ({
  workouts,
  celebrationTrigger = false
}) => {
  const stats = calculateWorkoutStatistics(workouts);
  
  // Format values
  const totalDistance = formatLargeNumber(stats.totalDistance, 'm');
  const totalDuration = formatLargeNumber(stats.totalDuration, 's');
  const avgDistance = formatLargeNumber(stats.avgDistance, 'm');
  const longestWorkout = formatLargeNumber(stats.longestWorkout, 'm');

  // Get dominant activity color
  const dominantActivity = Object.entries(stats.activityBreakdown)
    .reduce((a, b) => stats.activityBreakdown[a[0]] > stats.activityBreakdown[b[0]] ? a : b)[0] as 'walk' | 'run' | 'bike';
  const primaryColor = getActivityColorScheme(dominantActivity).primary;

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: primaryColor }]}>
        WORKOUT STATISTICS
      </Text>
      
      {/* Main stats grid */}
      <View style={styles.statsGrid}>
        <AnimatedStatItem
          label="TOTAL WORKOUTS"
          value={stats.totalWorkouts.toString()}
          unit=""
          color={primaryColor}
          delay={0}
          celebrationTrigger={celebrationTrigger}
        />
        
        <AnimatedStatItem
          label="TOTAL DISTANCE"
          value={totalDistance.value}
          unit={totalDistance.unit}
          color={WarioWareColors.primary.green}
          delay={100}
          celebrationTrigger={celebrationTrigger}
        />
        
        <AnimatedStatItem
          label="TOTAL TIME"
          value={totalDuration.value}
          unit={totalDuration.unit}
          color={WarioWareColors.primary.blue}
          delay={200}
          celebrationTrigger={celebrationTrigger}
        />
        
        <AnimatedStatItem
          label="CALORIES BURNED"
          value={Math.round(stats.totalCalories).toString()}
          unit="kcal"
          color={WarioWareColors.primary.red}
          delay={300}
          celebrationTrigger={celebrationTrigger}
        />
        
        <AnimatedStatItem
          label="AVG DISTANCE"
          value={avgDistance.value}
          unit={avgDistance.unit}
          color={WarioWareColors.primary.yellow}
          delay={400}
          celebrationTrigger={celebrationTrigger}
        />
        
        <AnimatedStatItem
          label="BEST PACE"
          value={formatPace(stats.fastestPace)}
          unit="min/km"
          color={WarioWareColors.primary.purple}
          delay={500}
          celebrationTrigger={celebrationTrigger}
        />
      </View>

      {/* Activity breakdown */}
      <View style={styles.activityBreakdown}>
        <Text style={styles.sectionTitle}>ACTIVITY BREAKDOWN</Text>
        <View style={styles.activityStats}>
          {Object.entries(stats.activityBreakdown).map(([activity, count], index) => {
            const colorScheme = getActivityColorScheme(activity as 'walk' | 'run' | 'bike');
            const percentage = stats.totalWorkouts > 0 ? (count / stats.totalWorkouts) * 100 : 0;
            
            return (
              <AnimatedStatItem
                key={activity}
                label={activity.toUpperCase()}
                value={count.toString()}
                unit={`${Math.round(percentage)}%`}
                color={colorScheme.primary}
                delay={600 + index * 100}
                celebrationTrigger={celebrationTrigger}
              />
            );
          })}
        </View>
      </View>

      {/* Progress indicators */}
      <View style={styles.progressSection}>
        <Text style={styles.sectionTitle}>PROGRESS</Text>
        
        <ProgressBar
          progress={stats.monthlyGoalProgress}
          color={primaryColor}
          label="Monthly Goal (100km)"
          delay={900}
        />
        
        <ProgressBar
          progress={Math.min(100, (stats.weeklyAverage / 3) * 100)} // Goal: 3 workouts per week
          color={WarioWareColors.primary.green}
          label="Weekly Frequency Goal"
          delay={1000}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: WarioWareColors.neutral.surface,
    borderRadius: WarioWareBorderRadius.large,
    padding: WarioWareSpacing.lg,
    margin: WarioWareSpacing.md,
    ...WarioWareShadows.large
  },
  title: {
    ...TextStyles.title,
    fontSize: 20,
    textAlign: 'center',
    marginBottom: WarioWareSpacing.lg,
    letterSpacing: 2
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: WarioWareSpacing.xl
  },
  statItem: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: WarioWareBorderRadius.medium,
    padding: WarioWareSpacing.md,
    marginBottom: WarioWareSpacing.md,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden'
  },
  statGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: WarioWareBorderRadius.medium,
    opacity: 0
  },
  statContent: {
    alignItems: 'center',
    zIndex: 1
  },
  statValue: {
    ...TextStyles.stat,
    fontSize: 24,
    fontWeight: '900'
  },
  statUnit: {
    ...TextStyles.label,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2
  },
  statLabel: {
    ...TextStyles.label,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
    letterSpacing: 1
  },
  activityBreakdown: {
    marginBottom: WarioWareSpacing.xl
  },
  sectionTitle: {
    ...TextStyles.subtitle,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: WarioWareSpacing.md,
    color: WarioWareColors.neutral.white,
    letterSpacing: 1
  },
  activityStats: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },
  progressSection: {
    marginTop: WarioWareSpacing.md
  },
  progressContainer: {
    marginBottom: WarioWareSpacing.md
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: WarioWareSpacing.sm
  },
  progressLabel: {
    ...TextStyles.body,
    fontSize: 14,
    fontWeight: '600'
  },
  progressValue: {
    ...TextStyles.body,
    fontSize: 14,
    fontWeight: '900'
  },
  progressTrack: {
    height: 8,
    backgroundColor: WarioWareColors.neutral.darkGray,
    borderRadius: 4,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    borderRadius: 4
  }
});

export default WorkoutStatsSummary;
