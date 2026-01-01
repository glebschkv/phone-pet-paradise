import { AnimationMixer, AnimationAction, AnimationClip } from 'three';
import { logger } from "@/lib/logger";

export interface AnimationState {
  current: string;
  speed: number;
  isTransitioning: boolean;
  context: 'moving' | 'idle' | 'special';
}

export class AnimationController {
  private mixer: AnimationMixer;
  private actions: { [name: string]: AnimationAction } = {};
  private currentAction: AnimationAction | null = null;
  private animationMap: { [key: string]: string[] };
  private state: AnimationState;

  constructor(mixer: AnimationMixer, animations: AnimationClip[], animationMap: { [key: string]: string[] }) {
    this.mixer = mixer;
    this.animationMap = animationMap;
    this.state = {
      current: 'idle',
      speed: 0,
      isTransitioning: false,
      context: 'idle'
    };

    // Create actions for all animations
    animations.forEach(clip => {
      const action = mixer.clipAction(clip);
      this.actions[clip.name] = action;
    });
  }

  /**
   * Update animation based on movement speed and context
   */
  updateAnimation(speed: number, context: 'moving' | 'idle' | 'special', delta: number) {
    this.state.speed = speed;
    this.state.context = context;

    const targetAnimation = this.selectAnimation(speed, context);
    
    if (targetAnimation !== this.state.current && !this.state.isTransitioning) {
      this.transitionToAnimation(targetAnimation);
    }

    // Update mixer
    this.mixer.update(delta);
  }

  /**
   * Select appropriate animation based on speed and context
   */
  private selectAnimation(speed: number, context: 'moving' | 'idle' | 'special'): string {
    if (context === 'special' && this.animationMap.special) {
      return this.findBestMatch(this.animationMap.special) || 'idle';
    }

    if (speed < 0.1) {
      // Stationary - use idle animations
      return this.findBestMatch(this.animationMap.idle) || 'idle';
    } else if (speed < 0.5) {
      // Slow movement - prefer walk animations
      return this.findBestMatch(this.animationMap.walk) || 
             this.findBestMatch(['walk', 'walking', 'slow']) || 'walk';
    } else {
      // Fast movement - prefer run animations
      return this.findBestMatch(['run', 'running', 'fast', 'trot']) ||
             this.findBestMatch(this.animationMap.walk) || 'walk';
    }
  }

  /**
   * Find best matching animation from available clips
   */
  private findBestMatch(candidates: string[]): string | null {
    // Try exact matches first
    for (const candidate of candidates) {
      const exact = Object.keys(this.actions).find(name => 
        name.toLowerCase() === candidate.toLowerCase()
      );
      if (exact) return exact;
    }

    // Try partial matches
    for (const candidate of candidates) {
      const partial = Object.keys(this.actions).find(name => 
        name.toLowerCase().includes(candidate.toLowerCase()) ||
        candidate.toLowerCase().includes(name.toLowerCase())
      );
      if (partial) return partial;
    }

    return null;
  }

  /**
   * Smoothly transition between animations
   */
  private transitionToAnimation(targetName: string) {
    const targetAction = this.actions[targetName];
    if (!targetAction) return;

    this.state.isTransitioning = true;

    // Fade out current animation
    if (this.currentAction && this.currentAction.isRunning()) {
      this.currentAction.fadeOut(0.3);
    }

    // Fade in new animation
    targetAction.reset();
    targetAction.fadeIn(0.3);
    targetAction.play();

    this.currentAction = targetAction;
    this.state.current = targetName;

    // Clear transition flag after fade duration
    setTimeout(() => {
      this.state.isTransitioning = false;
    }, 300);

    logger.debug(`🎬 Animation transition: ${this.state.current} → ${targetName}`);
  }

  /**
   * Force play a specific animation
   */
  playAnimation(name: string, loop = true, fadeTime = 0.3) {
    const action = this.actions[name];
    if (!action) {
      logger.warn(`Animation "${name}" not found`);
      return;
    }

    if (this.currentAction) {
      this.currentAction.fadeOut(fadeTime);
    }

    action.reset();
    action.setLoop(loop ? 2201 : 2200, loop ? Infinity : 1); // LoopRepeat : LoopOnce
    action.fadeIn(fadeTime);
    action.play();

    this.currentAction = action;
    this.state.current = name;
  }

  /**
   * Get current animation state
   */
  getState(): AnimationState {
    return { ...this.state };
  }

  /**
   * Stop all animations
   */
  stopAll() {
    Object.values(this.actions).forEach(action => {
      if (action.isRunning()) {
        action.stop();
      }
    });
    this.currentAction = null;
  }

  /**
   * Dispose of resources
   */
  dispose() {
    this.stopAll();
    this.mixer.uncacheRoot(this.mixer.getRoot());
  }
}