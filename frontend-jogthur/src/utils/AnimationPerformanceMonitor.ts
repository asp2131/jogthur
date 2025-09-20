import { InteractionManager } from 'react-native';

/**
 * Animation performance monitoring utility
 * Helps ensure WarioWare-style animations maintain 60fps
 */

interface PerformanceMetrics {
  frameRate: number;
  droppedFrames: number;
  averageFrameTime: number;
  isPerformant: boolean;
}

interface AnimationTest {
  name: string;
  duration: number;
  expectedFrameRate: number;
  test: () => Promise<void>;
}

class AnimationPerformanceMonitor {
  private frameCount = 0;
  private startTime = 0;
  private lastFrameTime = 0;
  private droppedFrames = 0;
  private frameTimes: number[] = [];
  private isMonitoring = false;
  private animationFrameId: number | null = null;

  /**
   * Start monitoring animation performance
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.frameCount = 0;
    this.startTime = performance.now();
    this.lastFrameTime = this.startTime;
    this.droppedFrames = 0;
    this.frameTimes = [];

    this.monitorFrame();
  }

  /**
   * Stop monitoring and return metrics
   */
  stopMonitoring(): PerformanceMetrics {
    if (!this.isMonitoring) {
      return {
        frameRate: 0,
        droppedFrames: 0,
        averageFrameTime: 0,
        isPerformant: false
      };
    }

    this.isMonitoring = false;
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    const endTime = performance.now();
    const totalTime = endTime - this.startTime;
    const frameRate = (this.frameCount / totalTime) * 1000;
    const averageFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    
    // Consider performance good if frame rate is above 55fps (allowing some margin)
    const isPerformant = frameRate >= 55;

    return {
      frameRate,
      droppedFrames: this.droppedFrames,
      averageFrameTime,
      isPerformant
    };
  }

  /**
   * Monitor individual frame
   */
  private monitorFrame = (): void => {
    if (!this.isMonitoring) return;

    const currentTime = performance.now();
    const frameTime = currentTime - this.lastFrameTime;
    
    this.frameTimes.push(frameTime);
    this.frameCount++;

    // Consider frame dropped if it takes longer than ~17ms (60fps = 16.67ms per frame)
    if (frameTime > 20) {
      this.droppedFrames++;
    }

    this.lastFrameTime = currentTime;
    this.animationFrameId = requestAnimationFrame(this.monitorFrame);
  };

  /**
   * Test animation performance with a specific animation
   */
  async testAnimation(test: AnimationTest): Promise<PerformanceMetrics> {
    return new Promise((resolve) => {
      // Wait for any pending interactions to complete
      InteractionManager.runAfterInteractions(() => {
        this.startMonitoring();
        
        // Run the animation test
        test.test().then(() => {
          // Give a small buffer for animation to complete
          setTimeout(() => {
            const metrics = this.stopMonitoring();
            resolve(metrics);
          }, 100);
        });
      });
    });
  }

  /**
   * Run a comprehensive performance test suite
   */
  async runPerformanceTestSuite(tests: AnimationTest[]): Promise<{
    results: Array<{ test: string; metrics: PerformanceMetrics; passed: boolean }>;
    overallPassed: boolean;
  }> {
    const results = [];
    let overallPassed = true;

    for (const test of tests) {
      console.log(`Running animation performance test: ${test.name}`);
      
      const metrics = await this.testAnimation(test);
      const passed = metrics.frameRate >= test.expectedFrameRate;
      
      results.push({
        test: test.name,
        metrics,
        passed
      });

      if (!passed) {
        overallPassed = false;
        console.warn(`Performance test failed: ${test.name}`, {
          expected: `${test.expectedFrameRate}fps`,
          actual: `${metrics.frameRate.toFixed(2)}fps`,
          droppedFrames: metrics.droppedFrames
        });
      } else {
        console.log(`Performance test passed: ${test.name}`, {
          frameRate: `${metrics.frameRate.toFixed(2)}fps`,
          droppedFrames: metrics.droppedFrames
        });
      }

      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return { results, overallPassed };
  }

  /**
   * Get device performance category
   */
  static getDevicePerformanceCategory(): 'high' | 'medium' | 'low' {
    // This is a simplified heuristic - in a real app you might want to use
    // device-specific information or run actual performance benchmarks
    const startTime = performance.now();
    
    // Simple CPU test
    let iterations = 0;
    const testDuration = 10; // ms
    
    while (performance.now() - startTime < testDuration) {
      Math.random() * Math.random();
      iterations++;
    }

    // Rough categorization based on iterations per millisecond
    const iterationsPerMs = iterations / testDuration;
    
    if (iterationsPerMs > 50000) {
      return 'high';
    } else if (iterationsPerMs > 25000) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Get recommended animation settings based on device performance
   */
  static getRecommendedAnimationSettings(performanceCategory?: 'high' | 'medium' | 'low'): {
    enableAllAnimations: boolean;
    particleCount: number;
    animationDuration: string;
    enableScreenShake: boolean;
    enableConfetti: boolean;
    enableRainbow: boolean;
    maxConcurrentAnimations: number;
  } {
    const category = performanceCategory || this.getDevicePerformanceCategory();
    
    switch (category) {
      case 'high':
        return {
          enableAllAnimations: true,
          particleCount: 100,
          animationDuration: 'normal',
          enableScreenShake: true,
          enableConfetti: true,
          enableRainbow: true,
          maxConcurrentAnimations: 10
        };
      
      case 'medium':
        return {
          enableAllAnimations: true,
          particleCount: 50,
          animationDuration: 'fast',
          enableScreenShake: true,
          enableConfetti: true,
          enableRainbow: false,
          maxConcurrentAnimations: 6
        };
      
      case 'low':
        return {
          enableAllAnimations: false,
          particleCount: 20,
          animationDuration: 'fast',
          enableScreenShake: false,
          enableConfetti: false,
          enableRainbow: false,
          maxConcurrentAnimations: 3
        };
      
      default:
        return this.getRecommendedAnimationSettings('medium');
    }
  }
}

/**
 * Singleton instance
 */
export const animationPerformanceMonitor = new AnimationPerformanceMonitor();

/**
 * Performance test utilities
 */
export const createAnimationTest = (
  name: string,
  testFunction: () => Promise<void>,
  expectedFrameRate: number = 55,
  duration: number = 1000
): AnimationTest => ({
  name,
  test: testFunction,
  expectedFrameRate,
  duration
});

/**
 * Common performance tests for WarioWare animations
 */
export const WarioWareAnimationTests = {
  buttonPress: createAnimationTest(
    'Button Press Animation',
    async () => {
      // Simulate button press animations
      return new Promise(resolve => setTimeout(resolve, 500));
    },
    55
  ),
  
  screenShake: createAnimationTest(
    'Screen Shake Animation',
    async () => {
      // Simulate screen shake
      return new Promise(resolve => setTimeout(resolve, 800));
    },
    55
  ),
  
  confetti: createAnimationTest(
    'Confetti Animation',
    async () => {
      // Simulate confetti animation
      return new Promise(resolve => setTimeout(resolve, 3000));
    },
    50 // Slightly lower expectation for heavy particle animation
  ),
  
  statsDisplay: createAnimationTest(
    'Stats Display Animation',
    async () => {
      // Simulate stats display updates
      return new Promise(resolve => setTimeout(resolve, 800));
    },
    58
  ),
  
  screenTransition: createAnimationTest(
    'Screen Transition Animation',
    async () => {
      // Simulate screen transitions
      return new Promise(resolve => setTimeout(resolve, 500));
    },
    55
  )
};

export default AnimationPerformanceMonitor;
