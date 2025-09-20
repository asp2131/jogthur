import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Text,
  Animated,
  RefreshControl,
  Alert
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Workout } from '../models/Workout';
import { AnimatedWorkoutCard } from '../components/AnimatedWorkoutCard';
import { WorkoutDetailView } from '../components/WorkoutDetailView';
import { WorkoutStatsSummary } from '../components/WorkoutStatsSummary';
import { EnhancedWarioWareButton } from '../components/EnhancedWarioWareButton';
import { 
  ScreenTransition, 
  ConfettiAnimation, 
  WarioWareLoading,
  useScreenShake 
} from '../components/WarioWareAnimations';
import { 
  WarioWareColors, 
  TextStyles, 
  LayoutPresets,
  WarioWareSpacing,
  getActivityColorScheme
} from '../styles/WarioWareTheme';

/**
 * Props for the workout history screen
 */
interface WorkoutHistoryScreenProps {
  workouts?: Workout[];
  onWorkoutEdit?: (workout: Workout) => void;
  onWorkoutDelete?: (workoutId: string) => void;
  onRefresh?: () => Promise<void>;
  isLoading?: boolean;
}

/**
 * Generate mock workout data for demonstration
 */
const generateMockWorkouts = (): Workout[] => {
  const activities: Array<'walk' | 'run' | 'bike'> = ['walk', 'run', 'bike'];
  const workouts: Workout[] = [];
  
  for (let i = 0; i < 25; i++) {
    const activity = activities[Math.floor(Math.random() * activities.length)];
    const baseDistance = activity === 'walk' ? 2000 : activity === 'run' ? 5000 : 15000;
    const distance = baseDistance + (Math.random() - 0.5) * baseDistance * 0.5;
    const baseDuration = activity === 'walk' ? 1800 : activity === 'run' ? 1800 : 2700;
    const duration = baseDuration + (Math.random() - 0.5) * baseDuration * 0.3;
    const avgPace = duration / (distance / 1000); // seconds per km
    
    const startTime = new Date();
    startTime.setDate(startTime.getDate() - Math.floor(Math.random() * 30));
    startTime.setHours(Math.floor(Math.random() * 12) + 6); // 6 AM to 6 PM
    
    const endTime = new Date(startTime.getTime() + duration * 1000);
    
    workouts.push({
      id: `workout-${i}`,
      type: activity,
      startTime,
      endTime,
      distance: Math.round(distance),
      duration: Math.round(duration),
      avgPace: Math.round(avgPace),
      maxSpeed: (distance / duration) * (1 + Math.random() * 0.3), // m/s
      calories: Math.round((distance / 1000) * (activity === 'walk' ? 50 : activity === 'run' ? 70 : 40)),
      gpsPoints: [], // Empty for mock data
      notes: Math.random() > 0.7 ? `Great ${activity} session!` : undefined,
      name: Math.random() > 0.8 ? `Morning ${activity}` : undefined
    });
  }
  
  return workouts.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
};

/**
 * Filter and sort options
 */
type SortOption = 'date' | 'distance' | 'duration' | 'pace';
type FilterOption = 'all' | 'walk' | 'run' | 'bike';

/**
 * Workout history screen component with FlashList performance optimization
 */
export const WorkoutHistoryScreen: React.FC<WorkoutHistoryScreenProps> = ({
  workouts: propWorkouts,
  onWorkoutEdit,
  onWorkoutDelete,
  onRefresh,
  isLoading = false
}) => {
  // State
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [deletingWorkouts, setDeletingWorkouts] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [celebrationTrigger, setCelebrationTrigger] = useState(false);
  const [confettiTrigger, setConfettiTrigger] = useState(false);
  const [screenVisible, setScreenVisible] = useState(true);

  // Animation refs
  const headerAnim = useRef(new Animated.Value(0)).current;
  const listAnim = useRef(new Animated.Value(0)).current;

  // Custom hooks
  const { shakeAnim, triggerShake } = useScreenShake();

  // Use mock data if no workouts provided
  const mockWorkouts = useMemo(() => generateMockWorkouts(), []);
  const workouts = propWorkouts || mockWorkouts;

  // Filter and sort workouts
  const processedWorkouts = useMemo(() => {
    let filtered = workouts;
    
    // Apply filter
    if (filterBy !== 'all') {
      filtered = workouts.filter(w => w.type === filterBy);
    }
    
    // Apply sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return b.startTime.getTime() - a.startTime.getTime();
        case 'distance':
          return b.distance - a.distance;
        case 'duration':
          return b.duration - a.duration;
        case 'pace':
          return a.avgPace - b.avgPace; // Faster pace first
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [workouts, sortBy, filterBy]);

  // Entry animation
  useEffect(() => {
    Animated.stagger(200, [
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true
      }),
      Animated.timing(listAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      })
    ]).start();
  }, [headerAnim, listAnim]);

  // Handle workout card press
  const handleWorkoutPress = useCallback((workout: Workout) => {
    setSelectedWorkout(workout);
    setShowDetail(true);
    triggerShake(3, 200);
  }, [triggerShake]);

  // Handle workout deletion
  const handleWorkoutDelete = useCallback(async (workout: Workout) => {
    setDeletingWorkouts(prev => new Set(prev).add(workout.id));
    
    // Trigger celebration
    setCelebrationTrigger(true);
    setConfettiTrigger(true);
    triggerShake(15, 800);
    
    setTimeout(async () => {
      try {
        if (onWorkoutDelete) {
          await onWorkoutDelete(workout.id);
        }
        
        setDeletingWorkouts(prev => {
          const newSet = new Set(prev);
          newSet.delete(workout.id);
          return newSet;
        });
        
        setCelebrationTrigger(false);
        setConfettiTrigger(false);
      } catch (error) {
        console.error('Failed to delete workout:', error);
        setDeletingWorkouts(prev => {
          const newSet = new Set(prev);
          newSet.delete(workout.id);
          return newSet;
        });
        triggerShake(10, 500);
      }
    }, 1500);
  }, [onWorkoutDelete, triggerShake]);

  // Handle detail view close
  const handleDetailClose = useCallback(() => {
    setShowDetail(false);
    setSelectedWorkout(null);
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    if (onRefresh) {
      setRefreshing(true);
      try {
        await onRefresh();
        setCelebrationTrigger(true);
        setTimeout(() => setCelebrationTrigger(false), 1000);
      } catch (error) {
        console.error('Failed to refresh:', error);
        triggerShake(8, 400);
      } finally {
        setRefreshing(false);
      }
    }
  }, [onRefresh, triggerShake]);

  // Handle sort change
  const handleSortChange = useCallback((newSort: SortOption) => {
    setSortBy(newSort);
    triggerShake(2, 100);
  }, [triggerShake]);

  // Handle filter change
  const handleFilterChange = useCallback((newFilter: FilterOption) => {
    setFilterBy(newFilter);
    triggerShake(2, 100);
  }, [triggerShake]);

  // Render workout card
  const renderWorkoutCard = useCallback(({ item, index }: { item: Workout; index: number }) => (
    <AnimatedWorkoutCard
      workout={item}
      onPress={handleWorkoutPress}
      onDelete={handleWorkoutDelete}
      index={index}
      isDeleting={deletingWorkouts.has(item.id)}
      celebrationTrigger={celebrationTrigger}
    />
  ), [handleWorkoutPress, handleWorkoutDelete, deletingWorkouts, celebrationTrigger]);

  // Get estimated item size for FlashList
  const getItemType = useCallback((item: Workout) => {
    // Different heights based on content
    if (item.name || item.notes) {
      return 'with-notes';
    }
    return 'standard';
  }, []);

  // Get dominant activity color
  const dominantActivity = useMemo(() => {
    const activityCounts = workouts.reduce((acc, w) => {
      acc[w.type] = (acc[w.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(activityCounts)
      .reduce((a, b) => activityCounts[a[0]] > activityCounts[b[0]] ? a : b)[0] as 'walk' | 'run' | 'bike';
  }, [workouts]);

  const primaryColor = getActivityColorScheme(dominantActivity).primary;

  return (
    <ScreenTransition isVisible={screenVisible} transitionType="zoom">
      <SafeAreaView style={[styles.container, LayoutPresets.container]}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        
        {/* Animated container with screen shake */}
        <Animated.View
          style={[
            styles.content,
            {
              transform: [{ translateX: shakeAnim }]
            }
          ]}
        >
          {/* Header */}
          <Animated.View
            style={[
              styles.header,
              {
                opacity: headerAnim,
                transform: [{
                  translateY: headerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-50, 0]
                  })
                }]
              }
            ]}
          >
            <Text style={[styles.title, { color: primaryColor }]}>
              WORKOUT HISTORY
            </Text>
            
            <Text style={styles.subtitle}>
              {processedWorkouts.length} workout{processedWorkouts.length !== 1 ? 's' : ''} found
            </Text>
          </Animated.View>

          {/* Filter and Sort Controls */}
          <Animated.View
            style={[
              styles.controls,
              { opacity: headerAnim }
            ]}
          >
            <View style={styles.filterControls}>
              <Text style={styles.controlLabel}>FILTER:</Text>
              <View style={styles.controlButtons}>
                {(['all', 'walk', 'run', 'bike'] as FilterOption[]).map(filter => (
                  <EnhancedWarioWareButton
                    key={filter}
                    title={filter.toUpperCase()}
                    onPress={() => handleFilterChange(filter)}
                    variant={filterBy === filter ? 'primary' : 'secondary'}
                    size="small"
                    pulse={filterBy === filter}
                    shakeOnPress={true}
                    style={styles.controlButton}
                  />
                ))}
              </View>
            </View>
            
            <View style={styles.sortControls}>
              <Text style={styles.controlLabel}>SORT:</Text>
              <View style={styles.controlButtons}>
                {(['date', 'distance', 'duration', 'pace'] as SortOption[]).map(sort => (
                  <EnhancedWarioWareButton
                    key={sort}
                    title={sort.toUpperCase()}
                    onPress={() => handleSortChange(sort)}
                    variant={sortBy === sort ? 'neon' : 'secondary'}
                    size="small"
                    pulse={sortBy === sort}
                    shakeOnPress={true}
                    style={styles.controlButton}
                  />
                ))}
              </View>
            </View>
          </Animated.View>

          {/* Statistics Summary */}
          <Animated.View
            style={[
              { opacity: listAnim }
            ]}
          >
            <WorkoutStatsSummary
              workouts={processedWorkouts}
              celebrationTrigger={celebrationTrigger}
            />
          </Animated.View>

          {/* Workout List */}
          <Animated.View
            style={[
              styles.listContainer,
              { opacity: listAnim }
            ]}
          >
            {processedWorkouts.length > 0 ? (
              <FlashList
                data={processedWorkouts}
                renderItem={renderWorkoutCard}
                getItemType={getItemType}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    tintColor={primaryColor}
                    colors={[primaryColor]}
                  />
                }
                contentContainerStyle={styles.listContent}
              />
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🏃‍♂️</Text>
                <Text style={styles.emptyTitle}>No Workouts Found</Text>
                <Text style={styles.emptySubtitle}>
                  {filterBy !== 'all' 
                    ? `No ${filterBy} workouts match your criteria`
                    : 'Start your fitness journey today!'
                  }
                </Text>
              </View>
            )}
          </Animated.View>
        </Animated.View>

        {/* Workout Detail View */}
        <WorkoutDetailView
          workout={selectedWorkout}
          isVisible={showDetail}
          onClose={handleDetailClose}
          onDelete={handleWorkoutDelete}
          onEdit={onWorkoutEdit}
        />

        {/* Loading overlay */}
        <WarioWareLoading
          isVisible={isLoading}
          size={80}
          colors={[
            primaryColor,
            WarioWareColors.primary.yellow,
            WarioWareColors.primary.green,
            WarioWareColors.primary.blue
          ]}
        />

        {/* Celebration confetti */}
        <ConfettiAnimation
          trigger={confettiTrigger}
          particleCount={80}
          duration={3000}
          colors={[
            primaryColor,
            WarioWareColors.primary.yellow,
            WarioWareColors.primary.green,
            WarioWareColors.primary.pink,
            WarioWareColors.primary.blue
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
  content: {
    flex: 1
  },
  header: {
    padding: WarioWareSpacing.lg,
    alignItems: 'center'
  },
  title: {
    ...TextStyles.title,
    fontSize: 28,
    marginBottom: WarioWareSpacing.sm,
    letterSpacing: 2
  },
  subtitle: {
    ...TextStyles.body,
    opacity: 0.8,
    textAlign: 'center'
  },
  controls: {
    paddingHorizontal: WarioWareSpacing.md,
    marginBottom: WarioWareSpacing.md
  },
  filterControls: {
    marginBottom: WarioWareSpacing.md
  },
  sortControls: {
    marginBottom: WarioWareSpacing.md
  },
  controlLabel: {
    ...TextStyles.label,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: WarioWareSpacing.sm,
    letterSpacing: 1
  },
  controlButtons: {
    flexDirection: 'row',
    gap: WarioWareSpacing.sm,
    flexWrap: 'wrap'
  },
  controlButton: {
    minWidth: 60
  },
  listContainer: {
    flex: 1
  },
  listContent: {
    paddingBottom: WarioWareSpacing.xl
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: WarioWareSpacing.xl
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: WarioWareSpacing.lg
  },
  emptyTitle: {
    ...TextStyles.title,
    fontSize: 24,
    marginBottom: WarioWareSpacing.md,
    color: WarioWareColors.neutral.white
  },
  emptySubtitle: {
    ...TextStyles.body,
    textAlign: 'center',
    opacity: 0.7,
    lineHeight: 24
  }
});

export default WorkoutHistoryScreen;
