/**
 * WarioWare Animation Performance Validation
 * Simple performance validation utility for WarioWare-style animations
 */

import { animationPerformanceMonitor, WarioWareAnimationTests } from '../utils/AnimationPerformanceMonitor';
import AnimationPerformanceMonitor from '../utils/AnimationPerformanceMonitor';

/**
 * Run performance validation for WarioWare animations
 * Call this function to validate that animations maintain 60fps
 */
export async function validateWarioWareAnimationPerformance(): Promise<{
  passed: boolean;
  results: Array<{ test: string; passed: boolean; frameRate: number; droppedFrames: number }>;
}> {
  console.log('🎮 Starting WarioWare Animation Performance Validation...');
  
  const testSuite = [
    WarioWareAnimationTests.buttonPress,
    WarioWareAnimationTests.screenShake,
    WarioWareAnimationTests.confetti,
    WarioWareAnimationTests.statsDisplay,
    WarioWareAnimationTests.screenTransition
  ];

  const { results, overallPassed } = await animationPerformanceMonitor.runPerformanceTestSuite(testSuite);
  
  const formattedResults = results.map(result => ({
    test: result.test,
    passed: result.passed,
    frameRate: Math.round(result.metrics.frameRate * 100) / 100,
    droppedFrames: result.metrics.droppedFrames
  }));

  console.log('🎮 WarioWare Animation Performance Results:');
  formattedResults.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.test}: ${result.frameRate}fps (${result.droppedFrames} dropped frames)`);
  });

  if (overallPassed) {
    console.log('🎉 All WarioWare animations passed performance validation!');
  } else {
    console.warn('⚠️ Some WarioWare animations failed performance validation');
  }

  return {
    passed: overallPassed,
    results: formattedResults
  };
}

/**
 * Get device performance recommendations
 */
export function getDevicePerformanceRecommendations() {
  const category = AnimationPerformanceMonitor.getDevicePerformanceCategory();
  const settings = AnimationPerformanceMonitor.getRecommendedAnimationSettings(category);
  
  console.log(`📱 Device Performance Category: ${category.toUpperCase()}`);
  console.log('🎨 Recommended Animation Settings:', settings);
  
  return { category, settings };
}

/**
 * Simple animation component validation
 */
export function validateAnimationComponents(): boolean {
  try {
    // Basic validation that components can be imported
    const { EnhancedWarioWareButton } = require('../components/EnhancedWarioWareButton');
    const { EnhancedAnimatedStatsDisplay } = require('../components/EnhancedAnimatedStatsDisplay');
    const { ConfettiAnimation, WarioWareLoading, ScreenTransition } = require('../components/WarioWareAnimations');
    
    console.log('✅ All WarioWare animation components loaded successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to load WarioWare animation components:', error);
    return false;
  }
}

/**
 * Run complete WarioWare animation validation
 */
export async function runCompleteWarioWareValidation() {
  console.log('🚀 Running Complete WarioWare Animation Validation...\n');
  
  // 1. Validate components can be loaded
  const componentsValid = validateAnimationComponents();
  
  // 2. Get device performance recommendations
  const { category, settings } = getDevicePerformanceRecommendations();
  
  // 3. Run performance tests
  const performanceResults = await validateWarioWareAnimationPerformance();
  
  const overallPassed = componentsValid && performanceResults.passed;
  
  console.log('\n🎮 WarioWare Animation Validation Summary:');
  console.log(`Components: ${componentsValid ? '✅' : '❌'}`);
  console.log(`Performance: ${performanceResults.passed ? '✅' : '❌'}`);
  console.log(`Device Category: ${category}`);
  console.log(`Overall: ${overallPassed ? '🎉 PASSED' : '❌ FAILED'}`);
  
  return {
    passed: overallPassed,
    components: componentsValid,
    performance: performanceResults,
    deviceCategory: category,
    recommendedSettings: settings
  };
}
