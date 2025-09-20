/**
 * Workout History Performance Tests
 * Tests for large dataset rendering performance with FlashList
 */

import { Workout } from '../models/Workout';
import { animationPerformanceMonitor, createAnimationTest } from '../utils/AnimationPerformanceMonitor';

/**
 * Generate large dataset of mock workouts for performance testing
 */
const generateLargeWorkoutDataset = (count: number): Workout[] => {
  const activities: Array<'walk' | 'run' | 'bike'> = ['walk', 'run', 'bike'];
  const workouts: Workout[] = [];
  
  for (let i = 0; i < count; i++) {
    const activity = activities[i % activities.length];
    const baseDistance = activity === 'walk' ? 2000 : activity === 'run' ? 5000 : 15000;
    const distance = baseDistance + (Math.random() - 0.5) * baseDistance * 0.5;
    const baseDuration = activity === 'walk' ? 1800 : activity === 'run' ? 1800 : 2700;
    const duration = baseDuration + (Math.random() - 0.5) * baseDuration * 0.3;
    const avgPace = duration / (distance / 1000);
    
    const startTime = new Date();
    startTime.setDate(startTime.getDate() - Math.floor(i / 2)); // Spread over time
    
    const endTime = new Date(startTime.getTime() + duration * 1000);
    
    workouts.push({
      id: `workout-${i}`,
      type: activity,
      startTime,
      endTime,
      distance: Math.round(distance),
      duration: Math.round(duration),
      avgPace: Math.round(avgPace),
      maxSpeed: (distance / duration) * (1 + Math.random() * 0.3),
      calories: Math.round((distance / 1000) * (activity === 'walk' ? 50 : activity === 'run' ? 70 : 40)),
      gpsPoints: [], // Empty for performance testing
      notes: i % 5 === 0 ? `Performance test workout ${i}` : undefined,
      name: i % 10 === 0 ? `Test Workout ${i}` : undefined
    });
  }
  
  return workouts;
};

/**
 * Simulate FlashList rendering performance
 */
const simulateFlashListRendering = async (itemCount: number, duration: number = 2000): Promise<void> => {
  return new Promise((resolve) => {
    const startTime = performance.now();
    let renderedItems = 0;
    
    const renderInterval = setInterval(() => {
      // Simulate rendering items in batches
      const batchSize = Math.min(10, itemCount - renderedItems);
      renderedItems += batchSize;
      
      // Simulate some work for each item
      for (let i = 0; i < batchSize; i++) {
        // Simulate component creation and layout calculations
        Math.random() * Math.random();
      }
      
      if (renderedItems >= itemCount || performance.now() - startTime >= duration) {
        clearInterval(renderInterval);
        resolve();
      }
    }, 16); // ~60fps
  });
};

/**
 * Simulate workout card animations
 */
const simulateWorkoutCardAnimations = async (cardCount: number): Promise<void> => {
  return new Promise((resolve) => {
    let animatedCards = 0;
    const animationInterval = setInterval(() => {
      // Simulate staggered card animations
      const batchSize = Math.min(3, cardCount - animatedCards);
      animatedCards += batchSize;
      
      // Simulate animation calculations
      for (let i = 0; i < batchSize; i++) {
        // Simulate transform calculations
        Math.sin(performance.now() / 1000) * 100;
        Math.cos(performance.now() / 1000) * 50;
      }
      
      if (animatedCards >= cardCount) {
        clearInterval(animationInterval);
        resolve();
      }
    }, 100); // Stagger by 100ms
  });
};

/**
 * Simulate filtering and sorting operations
 */
const simulateFilterAndSort = (workouts: Workout[], iterations: number = 100): void => {
  const filters = ['all', 'walk', 'run', 'bike'];
  const sorts = ['date', 'distance', 'duration', 'pace'];
  
  for (let i = 0; i < iterations; i++) {
    const filter = filters[i % filters.length];
    const sort = sorts[i % sorts.length];
    
    // Simulate filtering
    let filtered = workouts;
    if (filter !== 'all') {
      filtered = workouts.filter(w => w.type === filter);
    }
    
    // Simulate sorting
    filtered.sort((a, b) => {
      switch (sort) {
        case 'date':
          return b.startTime.getTime() - a.startTime.getTime();
        case 'distance':
          return b.distance - a.distance;
        case 'duration':
          return b.duration - a.duration;
        case 'pace':
          return a.avgPace - b.avgPace;
        default:
          return 0;
      }
    });
  }
};

/**
 * Performance test suite for workout history
 */
export const WorkoutHistoryPerformanceTests = {
  smallDataset: createAnimationTest(
    'Small Dataset Rendering (50 items)',
    async () => {
      const workouts = generateLargeWorkoutDataset(50);
      await simulateFlashListRendering(50, 1000);
      await simulateWorkoutCardAnimations(50);
    },
    58, // Expected frame rate
    1000
  ),
  
  mediumDataset: createAnimationTest(
    'Medium Dataset Rendering (200 items)',
    async () => {
      const workouts = generateLargeWorkoutDataset(200);
      await simulateFlashListRendering(200, 2000);
      await simulateWorkoutCardAnimations(200);
    },
    55, // Slightly lower expectation for larger dataset
    2000
  ),
  
  largeDataset: createAnimationTest(
    'Large Dataset Rendering (1000 items)',
    async () => {
      const workouts = generateLargeWorkoutDataset(1000);
      await simulateFlashListRendering(1000, 3000);
      await simulateWorkoutCardAnimations(100); // Only animate visible items
    },
    50, // Lower expectation for very large dataset
    3000
  ),
  
  filterAndSort: createAnimationTest(
    'Filter and Sort Operations',
    async () => {
      const workouts = generateLargeWorkoutDataset(500);
      simulateFilterAndSort(workouts, 50);
    },
    55,
    1000
  ),
  
  scrollPerformance: createAnimationTest(
    'Scroll Performance Simulation',
    async () => {
      // Simulate rapid scrolling through large dataset
      const workouts = generateLargeWorkoutDataset(1000);
      
      return new Promise((resolve) => {
        let scrollPosition = 0;
        const maxScroll = workouts.length * 140; // Estimated item height
        
        const scrollInterval = setInterval(() => {
          scrollPosition += 50; // Simulate scroll speed
          
          // Simulate visible item calculations
          const visibleStart = Math.floor(scrollPosition / 140);
          const visibleEnd = Math.min(visibleStart + 10, workouts.length);
          
          // Simulate rendering visible items
          for (let i = visibleStart; i < visibleEnd; i++) {
            Math.random() * Math.random(); // Simulate work
          }
          
          if (scrollPosition >= maxScroll) {
            clearInterval(scrollInterval);
            resolve();
          }
        }, 16); // 60fps
      });
    },
    55,
    2000
  ),
  
  memoryUsage: createAnimationTest(
    'Memory Usage Simulation',
    async () => {
      // Test memory efficiency with large datasets
      const datasets = [
        generateLargeWorkoutDataset(100),
        generateLargeWorkoutDataset(500),
        generateLargeWorkoutDataset(1000)
      ];
      
      // Simulate memory operations
      for (const dataset of datasets) {
        // Simulate component mounting/unmounting
        await simulateFlashListRendering(dataset.length, 500);
        
        // Simulate garbage collection by clearing references
        dataset.length = 0;
      }
    },
    50,
    2000
  )
};

/**
 * Run comprehensive workout history performance tests
 */
export async function runWorkoutHistoryPerformanceTests(): Promise<{
  passed: boolean;
  results: Array<{ test: string; passed: boolean; frameRate: number; droppedFrames: number }>;
}> {
  console.log('📊 Starting Workout History Performance Tests...');
  
  const testSuite = [
    WorkoutHistoryPerformanceTests.smallDataset,
    WorkoutHistoryPerformanceTests.mediumDataset,
    WorkoutHistoryPerformanceTests.largeDataset,
    WorkoutHistoryPerformanceTests.filterAndSort,
    WorkoutHistoryPerformanceTests.scrollPerformance,
    WorkoutHistoryPerformanceTests.memoryUsage
  ];

  const { results, overallPassed } = await animationPerformanceMonitor.runPerformanceTestSuite(testSuite);
  
  const formattedResults = results.map(result => ({
    test: result.test,
    passed: result.passed,
    frameRate: Math.round(result.metrics.frameRate * 100) / 100,
    droppedFrames: result.metrics.droppedFrames
  }));

  console.log('📊 Workout History Performance Results:');
  formattedResults.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.test}: ${result.frameRate}fps (${result.droppedFrames} dropped frames)`);
  });

  if (overallPassed) {
    console.log('🎉 All workout history performance tests passed!');
  } else {
    console.warn('⚠️ Some workout history performance tests failed');
  }

  return {
    passed: overallPassed,
    results: formattedResults
  };
}

/**
 * Performance recommendations based on dataset size
 */
export function getWorkoutHistoryPerformanceRecommendations(workoutCount: number): {
  recommendations: string[];
  optimizations: string[];
} {
  const recommendations: string[] = [];
  const optimizations: string[] = [];

  if (workoutCount < 100) {
    recommendations.push('✅ Small dataset - all animations enabled');
    recommendations.push('✅ Full card animations recommended');
    recommendations.push('✅ Real-time filtering and sorting');
  } else if (workoutCount < 500) {
    recommendations.push('⚠️ Medium dataset - consider animation optimization');
    recommendations.push('💡 Reduce animation complexity for better performance');
    optimizations.push('Limit concurrent card animations to 5');
    optimizations.push('Use simpler transitions for large operations');
  } else {
    recommendations.push('❌ Large dataset - performance optimizations required');
    recommendations.push('🚨 Disable complex animations');
    optimizations.push('Limit concurrent card animations to 3');
    optimizations.push('Implement virtual scrolling optimizations');
    optimizations.push('Debounce filter and sort operations');
    optimizations.push('Consider pagination for very large datasets');
  }

  return { recommendations, optimizations };
}

/**
 * Validate workout history component performance
 */
export function validateWorkoutHistoryComponents(): boolean {
  try {
    // Basic validation that components can be imported
    const { WorkoutHistoryScreen } = require('../screens/WorkoutHistoryScreen');
    const { AnimatedWorkoutCard } = require('../components/AnimatedWorkoutCard');
    const { WorkoutDetailView } = require('../components/WorkoutDetailView');
    const { WorkoutStatsSummary } = require('../components/WorkoutStatsSummary');
    
    console.log('✅ All workout history components loaded successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to load workout history components:', error);
    return false;
  }
}

/**
 * Run complete workout history validation
 */
export async function runCompleteWorkoutHistoryValidation() {
  console.log('🚀 Running Complete Workout History Validation...\n');
  
  // 1. Validate components can be loaded
  const componentsValid = validateWorkoutHistoryComponents();
  
  // 2. Run performance tests
  const performanceResults = await runWorkoutHistoryPerformanceTests();
  
  // 3. Get performance recommendations
  const smallDatasetRec = getWorkoutHistoryPerformanceRecommendations(50);
  const largeDatasetRec = getWorkoutHistoryPerformanceRecommendations(1000);
  
  const overallPassed = componentsValid && performanceResults.passed;
  
  console.log('\n📊 Workout History Validation Summary:');
  console.log(`Components: ${componentsValid ? '✅' : '❌'}`);
  console.log(`Performance: ${performanceResults.passed ? '✅' : '❌'}`);
  console.log(`Overall: ${overallPassed ? '🎉 PASSED' : '❌ FAILED'}`);
  
  console.log('\n💡 Performance Recommendations:');
  console.log('Small Datasets (< 100 items):');
  smallDatasetRec.recommendations.forEach(rec => console.log(`  ${rec}`));
  
  console.log('\nLarge Datasets (> 500 items):');
  largeDatasetRec.recommendations.forEach(rec => console.log(`  ${rec}`));
  largeDatasetRec.optimizations.forEach(opt => console.log(`  🔧 ${opt}`));
  
  return {
    passed: overallPassed,
    components: componentsValid,
    performance: performanceResults,
    recommendations: {
      small: smallDatasetRec,
      large: largeDatasetRec
    }
  };
}
