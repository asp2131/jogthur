import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Animated,
  Easing
} from 'react-native';
import { router } from 'expo-router';
import { EnhancedWarioWareButton } from '@/src/components/EnhancedWarioWareButton';
import { ScreenTransition, useScreenShake } from '@/src/components/WarioWareAnimations';
import { 
  WarioWareColors, 
  TextStyles, 
  LayoutPresets,
  WarioWareSpacing,
  WarioWareBorderRadius,
  WarioWareShadows,
  getActivityColorScheme
} from '@/src/styles/WarioWareTheme';

type ActivityType = 'walk' | 'run' | 'bike';

interface ActivityOption {
  type: ActivityType;
  icon: string;
  name: string;
  description: string;
  color: string;
}

const activities: ActivityOption[] = [
  {
    type: 'walk',
    icon: '🚶',
    name: 'WALK',
    description: 'Casual stroll',
    color: getActivityColorScheme('walk').primary
  },
  {
    type: 'run',
    icon: '🏃',
    name: 'RUN',
    description: 'High intensity',
    color: getActivityColorScheme('run').primary
  },
  {
    type: 'bike',
    icon: '🚴',
    name: 'BIKE',
    description: 'Cycling adventure',
    color: getActivityColorScheme('bike').primary
  }
];

export default function HomeScreen() {
  const [selectedActivity, setSelectedActivity] = useState<ActivityType>('run');
  const [screenVisible, setScreenVisible] = useState(true);
  
  // Animation refs
  const headerAnim = useRef(new Animated.Value(0)).current;
  const activitySelectorAnim = useRef(new Animated.Value(0)).current;
  const startButtonAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  
  // Custom hooks
  const { shakeAnim, triggerShake } = useScreenShake();

  // Entry animations
  useEffect(() => {
    Animated.stagger(200, [
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.back(1.7)),
        useNativeDriver: true
      }),
      Animated.timing(activitySelectorAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true
      }),
      Animated.timing(startButtonAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true
      }),
      Animated.timing(statsAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true
      })
    ]).start();
  }, []);

  const handleActivitySelect = (activity: ActivityType) => {
    setSelectedActivity(activity);
    triggerShake(3, 150);
  };

  const handleStartWorkout = () => {
    triggerShake(8, 300);
    // Navigate to workout screen with selected activity
    router.push('/workout');
  };

  const handleViewHistory = () => {
    triggerShake(3, 150);
    router.push('/history');
  };

  const selectedActivityData = activities.find(a => a.type === selectedActivity)!;

  return (
    <ScreenTransition isVisible={screenVisible} transitionType="zoom">
      <SafeAreaView style={[styles.container, LayoutPresets.container]}>
        <StatusBar barStyle="light-content" backgroundColor="#000000" />
        
        <Animated.View
          style={[
            styles.content,
            {
              transform: [{ translateX: shakeAnim }]
            }
          ]}
        >
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
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
                      outputRange: [-100, 0]
                    })
                  }]
                }
              ]}
            >
              <Text style={[styles.title, { color: selectedActivityData.color }]}>
                FITTRACKER
              </Text>
              <Text style={styles.subtitle}>
                Ready to crush your fitness goals?
              </Text>
            </Animated.View>

            {/* Activity Selector */}
            <Animated.View
              style={[
                styles.activitySelector,
                {
                  opacity: activitySelectorAnim,
                  transform: [{
                    scale: activitySelectorAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1]
                    })
                  }]
                }
              ]}
            >
              <Text style={styles.sectionTitle}>CHOOSE YOUR ACTIVITY</Text>
              
              <View style={styles.activityGrid}>
                {activities.map((activity, index) => (
                  <EnhancedWarioWareButton
                    key={activity.type}
                    title={`${activity.icon}\n${activity.name}\n${activity.description}`}
                    onPress={() => handleActivitySelect(activity.type)}
                    variant={selectedActivity === activity.type ? 'primary' : 'secondary'}
                    size="large"
                    pulse={selectedActivity === activity.type}
                    bounce={selectedActivity === activity.type}
                    shakeOnPress={true}
                    style={{
                      ...styles.activityButton,
                      backgroundColor: selectedActivity === activity.type 
                        ? activity.color 
                        : WarioWareColors.neutral.darkGray
                    }}
                  />
                ))}
              </View>
            </Animated.View>

            {/* Start Workout Button */}
            <Animated.View
              style={[
                styles.startSection,
                {
                  opacity: startButtonAnim,
                  transform: [{
                    scale: startButtonAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1]
                    })
                  }]
                }
              ]}
            >
              <EnhancedWarioWareButton
                title={`START ${selectedActivity.toUpperCase()}`}
                onPress={handleStartWorkout}
                variant="neon"
                size="xlarge"
                pulse={true}
                explode={true}
                shakeOnPress={true}
                style={{
                  ...styles.startButton,
                  backgroundColor: selectedActivityData.color
                }}
              />
              
              <Text style={styles.startHint}>
                Tap to begin your {selectedActivityData.description.toLowerCase()}!
              </Text>
            </Animated.View>

            {/* Quick Stats */}
            <Animated.View
              style={[
                styles.quickStats,
                {
                  opacity: statsAnim,
                  transform: [{
                    translateY: statsAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0]
                    })
                  }]
                }
              ]}
            >
              <Text style={styles.sectionTitle}>THIS WEEK</Text>
              
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, { color: WarioWareColors.primary.green }]}>
                    12.5
                  </Text>
                  <Text style={styles.statLabel}>KM</Text>
                  <Text style={styles.statSubLabel}>Distance</Text>
                </View>
                
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, { color: WarioWareColors.primary.blue }]}>
                    5
                  </Text>
                  <Text style={styles.statLabel}>WORKOUTS</Text>
                  <Text style={styles.statSubLabel}>Completed</Text>
                </View>
                
                <View style={styles.statCard}>
                  <Text style={[styles.statValue, { color: WarioWareColors.primary.purple }]}>
                    2h 45m
                  </Text>
                  <Text style={styles.statLabel}>TIME</Text>
                  <Text style={styles.statSubLabel}>Active</Text>
                </View>
              </View>
              
              <EnhancedWarioWareButton
                title="VIEW FULL HISTORY"
                onPress={handleViewHistory}
                variant="secondary"
                size="medium"
                shakeOnPress={true}
                style={styles.historyButton}
              />
            </Animated.View>
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </ScreenTransition>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  content: {
    flex: 1
  },
  scrollContent: {
    paddingBottom: WarioWareSpacing.xl
  },
  header: {
    alignItems: 'center',
    padding: WarioWareSpacing.xl,
    paddingTop: WarioWareSpacing.lg
  },
  title: {
    ...TextStyles.title,
    fontSize: 36,
    marginBottom: WarioWareSpacing.sm,
    letterSpacing: 3,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4
  },
  subtitle: {
    ...TextStyles.body,
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 24
  },
  activitySelector: {
    padding: WarioWareSpacing.lg,
    marginBottom: WarioWareSpacing.lg
  },
  sectionTitle: {
    ...TextStyles.subtitle,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: WarioWareSpacing.lg,
    color: WarioWareColors.neutral.white,
    letterSpacing: 2
  },
  activityGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: WarioWareSpacing.md
  },
  activityButton: {
    flex: 1,
    minHeight: 120,
    borderRadius: WarioWareBorderRadius.large,
    ...WarioWareShadows.medium
  },
  startSection: {
    alignItems: 'center',
    padding: WarioWareSpacing.lg,
    marginBottom: WarioWareSpacing.lg
  },
  startButton: {
    width: '90%',
    marginBottom: WarioWareSpacing.md
  },
  startHint: {
    ...TextStyles.body,
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.8,
    fontStyle: 'italic'
  },
  quickStats: {
    padding: WarioWareSpacing.lg
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: WarioWareSpacing.lg,
    gap: WarioWareSpacing.sm
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: WarioWareBorderRadius.medium,
    padding: WarioWareSpacing.md,
    alignItems: 'center',
    ...WarioWareShadows.small
  },
  statValue: {
    ...TextStyles.stat,
    fontSize: 24,
    fontWeight: '900'
  },
  statLabel: {
    ...TextStyles.label,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
    letterSpacing: 1
  },
  statSubLabel: {
    ...TextStyles.label,
    fontSize: 8,
    opacity: 0.6,
    marginTop: 2
  },
  historyButton: {
    alignSelf: 'center',
    minWidth: 200
  }
});
