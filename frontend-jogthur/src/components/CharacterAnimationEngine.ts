import { ActivityType } from '../models';

/**
 * Animation keyframe for character movements
 */
export interface AnimationKeyframe {
  time: number; // 0-1 normalized time
  bodyBounce: number;
  armLeftRotation: number;
  armRightRotation: number;
  legLeftRotation: number;
  legRightRotation: number;
  headBob: number;
  scale: number;
}

/**
 * Animation sequence for different activities
 */
export interface AnimationSequence {
  name: string;
  duration: number; // in seconds
  keyframes: AnimationKeyframe[];
  looping: boolean;
}

/**
 * Character animation engine for managing complex animations
 */
export class CharacterAnimationEngine {
  private currentTime: number = 0;
  private animationSpeed: number = 1;
  private currentSequence: AnimationSequence | null = null;
  
  // Pre-defined animation sequences
  private static readonly ANIMATIONS: Record<string, AnimationSequence> = {
    idle: {
      name: 'idle',
      duration: 2,
      looping: true,
      keyframes: [
        {
          time: 0,
          bodyBounce: 0,
          armLeftRotation: 0,
          armRightRotation: 0,
          legLeftRotation: 0,
          legRightRotation: 0,
          headBob: 0,
          scale: 1
        },
        {
          time: 0.5,
          bodyBounce: -2,
          armLeftRotation: 2,
          armRightRotation: -2,
          legLeftRotation: 0,
          legRightRotation: 0,
          headBob: -1,
          scale: 1
        },
        {
          time: 1,
          bodyBounce: 0,
          armLeftRotation: 0,
          armRightRotation: 0,
          legLeftRotation: 0,
          legRightRotation: 0,
          headBob: 0,
          scale: 1
        }
      ]
    },
    
    walking: {
      name: 'walking',
      duration: 1,
      looping: true,
      keyframes: [
        {
          time: 0,
          bodyBounce: 0,
          armLeftRotation: 20,
          armRightRotation: -20,
          legLeftRotation: 15,
          legRightRotation: -15,
          headBob: 0,
          scale: 1
        },
        {
          time: 0.25,
          bodyBounce: -3,
          armLeftRotation: 10,
          armRightRotation: -10,
          legLeftRotation: 25,
          legRightRotation: -25,
          headBob: -2,
          scale: 1.02
        },
        {
          time: 0.5,
          bodyBounce: 0,
          armLeftRotation: -20,
          armRightRotation: 20,
          legLeftRotation: -15,
          legRightRotation: 15,
          headBob: 0,
          scale: 1
        },
        {
          time: 0.75,
          bodyBounce: -3,
          armLeftRotation: -10,
          armRightRotation: 10,
          legLeftRotation: -25,
          legRightRotation: 25,
          headBob: -2,
          scale: 1.02
        },
        {
          time: 1,
          bodyBounce: 0,
          armLeftRotation: 20,
          armRightRotation: -20,
          legLeftRotation: 15,
          legRightRotation: -15,
          headBob: 0,
          scale: 1
        }
      ]
    },
    
    running: {
      name: 'running',
      duration: 0.6,
      looping: true,
      keyframes: [
        {
          time: 0,
          bodyBounce: 0,
          armLeftRotation: 45,
          armRightRotation: -45,
          legLeftRotation: 30,
          legRightRotation: -30,
          headBob: 0,
          scale: 1
        },
        {
          time: 0.2,
          bodyBounce: -8,
          armLeftRotation: 25,
          armRightRotation: -25,
          legLeftRotation: 50,
          legRightRotation: -50,
          headBob: -4,
          scale: 1.05
        },
        {
          time: 0.3,
          bodyBounce: -12,
          armLeftRotation: 0,
          armRightRotation: 0,
          legLeftRotation: 60,
          legRightRotation: -60,
          headBob: -6,
          scale: 1.08
        },
        {
          time: 0.5,
          bodyBounce: 0,
          armLeftRotation: -45,
          armRightRotation: 45,
          legLeftRotation: -30,
          legRightRotation: 30,
          headBob: 0,
          scale: 1
        },
        {
          time: 0.7,
          bodyBounce: -8,
          armLeftRotation: -25,
          armRightRotation: 25,
          legLeftRotation: -50,
          legRightRotation: 50,
          headBob: -4,
          scale: 1.05
        },
        {
          time: 0.8,
          bodyBounce: -12,
          armLeftRotation: 0,
          armRightRotation: 0,
          legLeftRotation: -60,
          legRightRotation: 60,
          headBob: -6,
          scale: 1.08
        },
        {
          time: 1,
          bodyBounce: 0,
          armLeftRotation: 45,
          armRightRotation: -45,
          legLeftRotation: 30,
          legRightRotation: -30,
          headBob: 0,
          scale: 1
        }
      ]
    },
    
    cycling: {
      name: 'cycling',
      duration: 0.8,
      looping: true,
      keyframes: [
        {
          time: 0,
          bodyBounce: -5,
          armLeftRotation: 10,
          armRightRotation: 10,
          legLeftRotation: 0,
          legRightRotation: 45,
          headBob: -3,
          scale: 1
        },
        {
          time: 0.25,
          bodyBounce: -3,
          armLeftRotation: 8,
          armRightRotation: 8,
          legLeftRotation: 45,
          legRightRotation: 90,
          headBob: -2,
          scale: 1.01
        },
        {
          time: 0.5,
          bodyBounce: -5,
          armLeftRotation: 10,
          armRightRotation: 10,
          legLeftRotation: 90,
          legRightRotation: 0,
          headBob: -3,
          scale: 1
        },
        {
          time: 0.75,
          bodyBounce: -3,
          armLeftRotation: 8,
          armRightRotation: 8,
          legLeftRotation: 45,
          legRightRotation: -45,
          headBob: -2,
          scale: 1.01
        },
        {
          time: 1,
          bodyBounce: -5,
          armLeftRotation: 10,
          armRightRotation: 10,
          legLeftRotation: 0,
          legRightRotation: 45,
          headBob: -3,
          scale: 1
        }
      ]
    },
    
    celebrating: {
      name: 'celebrating',
      duration: 2,
      looping: false,
      keyframes: [
        {
          time: 0,
          bodyBounce: 0,
          armLeftRotation: 0,
          armRightRotation: 0,
          legLeftRotation: 0,
          legRightRotation: 0,
          headBob: 0,
          scale: 1
        },
        {
          time: 0.1,
          bodyBounce: -15,
          armLeftRotation: 90,
          armRightRotation: 90,
          legLeftRotation: 0,
          legRightRotation: 0,
          headBob: -8,
          scale: 1.2
        },
        {
          time: 0.3,
          bodyBounce: -25,
          armLeftRotation: 120,
          armRightRotation: 120,
          legLeftRotation: -10,
          legRightRotation: -10,
          headBob: -12,
          scale: 1.3
        },
        {
          time: 0.5,
          bodyBounce: -15,
          armLeftRotation: 90,
          armRightRotation: 90,
          legLeftRotation: 0,
          legRightRotation: 0,
          headBob: -8,
          scale: 1.2
        },
        {
          time: 0.7,
          bodyBounce: -25,
          armLeftRotation: 120,
          armRightRotation: 120,
          legLeftRotation: -10,
          legRightRotation: -10,
          headBob: -12,
          scale: 1.3
        },
        {
          time: 0.9,
          bodyBounce: -10,
          armLeftRotation: 45,
          armRightRotation: 45,
          legLeftRotation: 0,
          legRightRotation: 0,
          headBob: -5,
          scale: 1.1
        },
        {
          time: 1,
          bodyBounce: 0,
          armLeftRotation: 0,
          armRightRotation: 0,
          legLeftRotation: 0,
          legRightRotation: 0,
          headBob: 0,
          scale: 1
        }
      ]
    }
  };
  
  /**
   * Set the current animation sequence
   */
  setAnimation(animationName: string, speed: number = 1): void {
    const animation = CharacterAnimationEngine.ANIMATIONS[animationName];
    if (animation) {
      this.currentSequence = animation;
      this.animationSpeed = speed;
      this.currentTime = 0;
    }
  }
  
  /**
   * Update animation time
   */
  update(deltaTime: number): void {
    if (!this.currentSequence) return;
    
    this.currentTime += (deltaTime * this.animationSpeed) / this.currentSequence.duration;
    
    if (this.currentSequence.looping) {
      this.currentTime = this.currentTime % 1;
    } else {
      this.currentTime = Math.min(this.currentTime, 1);
    }
  }
  
  /**
   * Get current animation frame by interpolating between keyframes
   */
  getCurrentFrame(): AnimationKeyframe {
    if (!this.currentSequence || this.currentSequence.keyframes.length === 0) {
      return this.getDefaultFrame();
    }
    
    const keyframes = this.currentSequence.keyframes;
    const normalizedTime = this.currentTime;
    
    // Find the two keyframes to interpolate between
    let startFrame = keyframes[0];
    let endFrame = keyframes[0];
    
    for (let i = 0; i < keyframes.length - 1; i++) {
      if (normalizedTime >= keyframes[i].time && normalizedTime <= keyframes[i + 1].time) {
        startFrame = keyframes[i];
        endFrame = keyframes[i + 1];
        break;
      }
    }
    
    // Handle edge case where time is beyond last keyframe
    if (normalizedTime > keyframes[keyframes.length - 1].time) {
      return keyframes[keyframes.length - 1];
    }
    
    // Interpolate between keyframes
    const timeDiff = endFrame.time - startFrame.time;
    const t = timeDiff === 0 ? 0 : (normalizedTime - startFrame.time) / timeDiff;
    
    return this.interpolateKeyframes(startFrame, endFrame, t);
  }
  
  /**
   * Interpolate between two keyframes
   */
  private interpolateKeyframes(start: AnimationKeyframe, end: AnimationKeyframe, t: number): AnimationKeyframe {
    // Use easing for smoother animations
    const easedT = this.easeInOutQuad(t);
    
    return {
      time: start.time + (end.time - start.time) * easedT,
      bodyBounce: start.bodyBounce + (end.bodyBounce - start.bodyBounce) * easedT,
      armLeftRotation: start.armLeftRotation + (end.armLeftRotation - start.armLeftRotation) * easedT,
      armRightRotation: start.armRightRotation + (end.armRightRotation - start.armRightRotation) * easedT,
      legLeftRotation: start.legLeftRotation + (end.legLeftRotation - start.legLeftRotation) * easedT,
      legRightRotation: start.legRightRotation + (end.legRightRotation - start.legRightRotation) * easedT,
      headBob: start.headBob + (end.headBob - start.headBob) * easedT,
      scale: start.scale + (end.scale - start.scale) * easedT
    };
  }
  
  /**
   * Easing function for smoother animations
   */
  private easeInOutQuad(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }
  
  /**
   * Get default animation frame
   */
  private getDefaultFrame(): AnimationKeyframe {
    return {
      time: 0,
      bodyBounce: 0,
      armLeftRotation: 0,
      armRightRotation: 0,
      legLeftRotation: 0,
      legRightRotation: 0,
      headBob: 0,
      scale: 1
    };
  }
  
  /**
   * Get animation based on activity type and speed
   */
  static getAnimationForActivity(activityType: ActivityType, speed: number): string {
    if (speed < 0.5) return 'idle';
    
    switch (activityType) {
      case 'walk':
        return 'walking';
      case 'run':
        return 'running';
      case 'bike':
        return 'cycling';
      default:
        return 'idle';
    }
  }
  
  /**
   * Calculate animation speed based on user's actual speed
   */
  static calculateAnimationSpeed(activityType: ActivityType, userSpeed: number): number {
    const baseSpeed = {
      walk: 1.0,
      run: 1.5,
      bike: 2.0
    }[activityType] || 1.0;
    
    // Scale animation speed based on user's actual speed
    const speedMultiplier = Math.max(userSpeed * 0.3, 0.5);
    return baseSpeed * speedMultiplier;
  }
  
  /**
   * Check if current animation is complete (for non-looping animations)
   */
  isAnimationComplete(): boolean {
    if (!this.currentSequence || this.currentSequence.looping) {
      return false;
    }
    
    return this.currentTime >= 1;
  }
  
  /**
   * Reset animation to beginning
   */
  reset(): void {
    this.currentTime = 0;
  }
  
  /**
   * Get available animation names
   */
  static getAvailableAnimations(): string[] {
    return Object.keys(CharacterAnimationEngine.ANIMATIONS);
  }
}
