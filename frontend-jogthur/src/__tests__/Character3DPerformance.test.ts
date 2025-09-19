import { CharacterAnimationEngine } from '../components/CharacterAnimationEngine';

// Mock React Native Skia for testing
jest.mock('@shopify/react-native-skia', () => ({
  Canvas: 'Canvas',
  Group: 'Group',
  Circle: 'Circle',
  RoundedRect: 'RoundedRect',
  useValue: jest.fn(() => ({ current: 0 })),
  useFrameCallback: jest.fn(),
  runTiming: jest.fn(),
  Easing: {
    linear: jest.fn(),
    out: jest.fn(() => jest.fn()),
    quad: jest.fn(),
    elastic: jest.fn(() => jest.fn())
  },
  Skia: {
    Paint: jest.fn(() => ({
      setColor: jest.fn(),
      setAntiAlias: jest.fn()
    })),
    Color: jest.fn()
  }
}));

describe('Character3D Performance Tests', () => {
  let animationEngine: CharacterAnimationEngine;
  
  beforeEach(() => {
    animationEngine = new CharacterAnimationEngine();
    jest.clearAllMocks();
  });

  describe('Animation Engine Performance', () => {
    it('should handle 60fps animation updates efficiently', () => {
      const frameTime = 1000 / 60; // 16.67ms per frame
      const testDuration = 1000; // 1 second
      const expectedFrames = Math.floor(testDuration / frameTime);
      
      animationEngine.setAnimation('running', 1);
      
      const startTime = performance.now();
      
      // Simulate 60fps for 1 second
      for (let i = 0; i < expectedFrames; i++) {
        animationEngine.update(frameTime / 1000); // Convert to seconds
        animationEngine.getCurrentFrame();
      }
      
      const endTime = performance.now();
      const actualDuration = endTime - startTime;
      
      // Should complete well under the target time (allowing for some overhead)
      expect(actualDuration).toBeLessThan(testDuration / 2);
    });
    
    it('should maintain consistent frame times under load', () => {
      const frameTimes: number[] = [];
      const frameTime = 1000 / 60;
      
      animationEngine.setAnimation('celebrating', 1);
      
      // Measure frame processing times
      for (let i = 0; i < 60; i++) {
        const frameStart = performance.now();
        
        animationEngine.update(frameTime / 1000);
        animationEngine.getCurrentFrame();
        
        const frameEnd = performance.now();
        frameTimes.push(frameEnd - frameStart);
      }
      
      // Calculate statistics
      const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
      const maxFrameTime = Math.max(...frameTimes);
      const minFrameTime = Math.min(...frameTimes);
      
      // Frame times should be consistent and fast
      expect(avgFrameTime).toBeLessThan(5); // Average under 5ms
      expect(maxFrameTime).toBeLessThan(10); // Max under 10ms
      expect(maxFrameTime - minFrameTime).toBeLessThan(8); // Variance under 8ms
    });
    
    it('should efficiently interpolate between keyframes', () => {
      animationEngine.setAnimation('walking', 1);
      
      const interpolationTimes: number[] = [];
      
      // Test interpolation at various points in the animation
      for (let t = 0; t <= 1; t += 0.01) {
        const start = performance.now();
        
        // Manually set time and get frame
        (animationEngine as any).currentTime = t;
        animationEngine.getCurrentFrame();
        
        const end = performance.now();
        interpolationTimes.push(end - start);
      }
      
      const avgInterpolationTime = interpolationTimes.reduce((a, b) => a + b, 0) / interpolationTimes.length;
      const maxInterpolationTime = Math.max(...interpolationTimes);
      
      // Interpolation should be very fast
      expect(avgInterpolationTime).toBeLessThan(1); // Average under 1ms
      expect(maxInterpolationTime).toBeLessThan(3); // Max under 3ms
    });
    
    it('should handle rapid animation switches efficiently', () => {
      const animations = ['idle', 'walking', 'running', 'cycling', 'celebrating'];
      const switchTimes: number[] = [];
      
      for (let i = 0; i < 100; i++) {
        const animationName = animations[i % animations.length];
        const speed = 0.5 + Math.random() * 2; // Random speed between 0.5 and 2.5
        
        const start = performance.now();
        animationEngine.setAnimation(animationName, speed);
        const end = performance.now();
        
        switchTimes.push(end - start);
      }
      
      const avgSwitchTime = switchTimes.reduce((a, b) => a + b, 0) / switchTimes.length;
      const maxSwitchTime = Math.max(...switchTimes);
      
      // Animation switches should be very fast
      expect(avgSwitchTime).toBeLessThan(0.5); // Average under 0.5ms
      expect(maxSwitchTime).toBeLessThan(2); // Max under 2ms
    });
  });
  
  describe('Memory Usage', () => {
    it('should not leak memory during long animations', () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      animationEngine.setAnimation('running', 1);
      
      // Run animation for extended period
      for (let i = 0; i < 3600; i++) { // Simulate 1 minute at 60fps
        animationEngine.update(1/60);
        animationEngine.getCurrentFrame();
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be minimal (less than 1MB)
      if (initialMemory > 0) {
        expect(memoryIncrease).toBeLessThan(1024 * 1024);
      }
    });
    
    it('should efficiently reuse animation objects', () => {
      const framesBefore = animationEngine.getCurrentFrame();
      
      // Run many animation cycles
      for (let cycle = 0; cycle < 100; cycle++) {
        animationEngine.setAnimation('walking', 1);
        
        for (let frame = 0; frame < 60; frame++) {
          animationEngine.update(1/60);
          animationEngine.getCurrentFrame();
        }
      }
      
      const framesAfter = animationEngine.getCurrentFrame();
      
      // Objects should have the same structure (indicating reuse)
      expect(Object.keys(framesBefore)).toEqual(Object.keys(framesAfter));
    });
  });
  
  describe('Animation Quality vs Performance', () => {
    it('should provide smooth transitions between keyframes', () => {
      animationEngine.setAnimation('running', 1);
      
      const frames: any[] = [];
      
      // Capture frames over a complete animation cycle
      for (let i = 0; i < 60; i++) {
        animationEngine.update(1/60);
        frames.push(animationEngine.getCurrentFrame());
      }
      
      // Check for smooth transitions (no sudden jumps)
      for (let i = 1; i < frames.length; i++) {
        const prev = frames[i - 1];
        const curr = frames[i];
        
        // Body bounce should change smoothly
        const bounceDiff = Math.abs(curr.bodyBounce - prev.bodyBounce);
        expect(bounceDiff).toBeLessThan(5); // No sudden jumps > 5 units
        
        // Arm rotations should change smoothly
        const armDiff = Math.abs(curr.armLeftRotation - prev.armLeftRotation);
        expect(armDiff).toBeLessThan(15); // No sudden jumps > 15 degrees
      }
    });
    
    it('should maintain animation fidelity at different speeds', () => {
      const speeds = [0.5, 1.0, 1.5, 2.0, 3.0];
      const results: { [speed: number]: any[] } = {};
      
      speeds.forEach(speed => {
        animationEngine.setAnimation('walking', speed);
        const frames: any[] = [];
        
        // Capture one complete cycle
        const cycleDuration = 1 / speed; // seconds
        const frameCount = Math.ceil(cycleDuration * 60); // 60fps
        
        for (let i = 0; i < frameCount; i++) {
          animationEngine.update(1/60);
          frames.push(animationEngine.getCurrentFrame());
        }
        
        results[speed] = frames;
      });
      
      // All speeds should produce valid animation sequences
      speeds.forEach(speed => {
        const frames = results[speed];
        expect(frames.length).toBeGreaterThan(0);
        
        // Should have variation in animation values
        const bounceValues = frames.map(f => f.bodyBounce);
        const minBounce = Math.min(...bounceValues);
        const maxBounce = Math.max(...bounceValues);
        expect(maxBounce - minBounce).toBeGreaterThan(1); // Should have movement
      });
    });
  });
  
  describe('Edge Cases and Stress Tests', () => {
    it('should handle zero and negative speeds gracefully', () => {
      expect(() => {
        animationEngine.setAnimation('walking', 0);
        animationEngine.update(1/60);
        animationEngine.getCurrentFrame();
      }).not.toThrow();
      
      expect(() => {
        animationEngine.setAnimation('running', -1);
        animationEngine.update(1/60);
        animationEngine.getCurrentFrame();
      }).not.toThrow();
    });
    
    it('should handle very large time deltas', () => {
      animationEngine.setAnimation('cycling', 1);
      
      expect(() => {
        animationEngine.update(10); // 10 second jump
        animationEngine.getCurrentFrame();
      }).not.toThrow();
      
      expect(() => {
        animationEngine.update(0.001); // Very small delta
        animationEngine.getCurrentFrame();
      }).not.toThrow();
    });
    
    it('should handle rapid animation changes', () => {
      const animations = ['idle', 'walking', 'running', 'cycling', 'celebrating'];
      
      expect(() => {
        for (let i = 0; i < 1000; i++) {
          const randomAnimation = animations[Math.floor(Math.random() * animations.length)];
          const randomSpeed = Math.random() * 3 + 0.5;
          
          animationEngine.setAnimation(randomAnimation, randomSpeed);
          animationEngine.update(1/60);
          animationEngine.getCurrentFrame();
        }
      }).not.toThrow();
    });
    
    it('should maintain performance with concurrent instances', () => {
      const engines = Array.from({ length: 10 }, () => new CharacterAnimationEngine());
      
      // Set different animations on each engine
      engines.forEach((engine, index) => {
        const animations = ['walking', 'running', 'cycling'];
        engine.setAnimation(animations[index % animations.length], 1 + index * 0.1);
      });
      
      const start = performance.now();
      
      // Update all engines for 60 frames
      for (let frame = 0; frame < 60; frame++) {
        engines.forEach(engine => {
          engine.update(1/60);
          engine.getCurrentFrame();
        });
      }
      
      const end = performance.now();
      const duration = end - start;
      
      // Should handle multiple instances efficiently
      expect(duration).toBeLessThan(100); // Under 100ms for 10 instances
    });
  });
  
  describe('Animation Completeness', () => {
    it('should provide all required animation states', () => {
      const requiredAnimations = ['idle', 'walking', 'running', 'cycling', 'celebrating'];
      const availableAnimations = CharacterAnimationEngine.getAvailableAnimations();
      
      requiredAnimations.forEach(animation => {
        expect(availableAnimations).toContain(animation);
      });
    });
    
    it('should calculate appropriate speeds for different activities', () => {
      const walkSpeed = CharacterAnimationEngine.calculateAnimationSpeed('walk', 1.5);
      const runSpeed = CharacterAnimationEngine.calculateAnimationSpeed('run', 3.0);
      const bikeSpeed = CharacterAnimationEngine.calculateAnimationSpeed('bike', 8.0);
      
      expect(walkSpeed).toBeGreaterThan(0);
      expect(runSpeed).toBeGreaterThan(walkSpeed);
      expect(bikeSpeed).toBeGreaterThan(runSpeed);
    });
    
    it('should provide appropriate animations for activity and speed combinations', () => {
      expect(CharacterAnimationEngine.getAnimationForActivity('walk', 0.3)).toBe('idle');
      expect(CharacterAnimationEngine.getAnimationForActivity('walk', 1.5)).toBe('walking');
      expect(CharacterAnimationEngine.getAnimationForActivity('run', 2.5)).toBe('running');
      expect(CharacterAnimationEngine.getAnimationForActivity('bike', 5.0)).toBe('cycling');
    });
  });
});
