import { Vector3, Mesh, Raycaster } from 'three';

export interface SmartWaypoint {
  position: Vector3;
  type: 'rest' | 'lookout' | 'explore' | 'social';
  duration: number; // How long to stay at this waypoint
  lookAt?: Vector3; // Optional look direction
  behavior?: AnimalBehavior;
}

export interface AnimalBehavior {
  preferredHeight: 'low' | 'medium' | 'high';
  movementPattern: 'circular' | 'linear' | 'random';
  socialTendency: number; // 0-1, how much they like to be near other animals
  explorationRadius: number;
}

export class ImprovedWaypointGenerator {
  private raycaster: Raycaster;

  constructor() {
    this.raycaster = new Raycaster();
  }

  /**
   * Generate smart waypoints based on animal behavior and terrain
   */
  generateWaypoints(
    animalData: any, 
    animalIndex: number, 
    islandMeshes: Mesh[]
  ): SmartWaypoint[] {

    const behavior = this.getAnimalBehavior(animalData);
    const baseRadius = behavior.explorationRadius;
    const waypoints: SmartWaypoint[] = [];

    // Generate different types of waypoints based on animal behavior
    const waypointTypes = this.getWaypointTypes(behavior);

    for (let i = 0; i < 6; i++) { // 6 waypoints per animal
      const angle = (i * Math.PI * 2 / 6) + (animalIndex * 0.3); // Spread animals
      const radius = baseRadius * (0.5 + Math.random() * 0.5); // Vary radius

      // Add some randomness to avoid perfect circles
      const offsetAngle = (Math.random() - 0.5) * Math.PI * 0.3;
      const finalAngle = angle + offsetAngle;

      const targetX = Math.cos(finalAngle) * radius;
      const targetZ = Math.sin(finalAngle) * radius;

      // Find ground position at target location
      const groundPosition = this.findGroundPosition(
        new Vector3(targetX, 5, targetZ), // Start high
        islandMeshes,
        behavior.preferredHeight
      );

      if (groundPosition) {
        const waypointType = waypointTypes[i % waypointTypes.length];
        const waypoint: SmartWaypoint = {
          position: groundPosition,
          type: waypointType,
          duration: this.getWaypointDuration(waypointType),
          behavior
        };

        // Add look direction for lookout points
        if (waypointType === 'lookout') {
          waypoint.lookAt = this.generateLookDirection(groundPosition);
        }

        waypoints.push(waypoint);
      }
    }

    // Ensure we have at least some waypoints
    if (waypoints.length === 0) {
      // Fallback: create basic waypoints around center
      waypoints.push(...this.generateFallbackWaypoints(animalIndex, baseRadius));
    }

    // Sort waypoints to create a logical path
    return this.optimizeWaypointOrder(waypoints);
  }

  /**
   * Determine animal behavior based on database data
   */
  private getAnimalBehavior(animalData: any): AnimalBehavior {
    const name = animalData.name.toLowerCase();

    // Define behaviors for different animal types
    const behaviors: Record<string, Partial<AnimalBehavior>> = {
      // Small animals - stay closer, more cautious
      rabbit: { 
        preferredHeight: 'low', 
        movementPattern: 'random', 
        socialTendency: 0.6, 
        explorationRadius: 1.2 
      },
      squirrel: { 
        preferredHeight: 'medium', 
        movementPattern: 'random', 
        socialTendency: 0.4, 
        explorationRadius: 1.0 
      },

      // Medium animals - balanced behavior
      cat: { 
        preferredHeight: 'low', 
        movementPattern: 'circular', 
        socialTendency: 0.3, 
        explorationRadius: 1.8 
      },
      dog: { 
        preferredHeight: 'low', 
        movementPattern: 'linear', 
        socialTendency: 0.8, 
        explorationRadius: 2.0 
      },

      // Large animals - wide roaming
      bear: { 
        preferredHeight: 'low', 
        movementPattern: 'linear', 
        socialTendency: 0.2, 
        explorationRadius: 2.5 
      },
      elephant: { 
        preferredHeight: 'low', 
        movementPattern: 'circular', 
        socialTendency: 0.7, 
        explorationRadius: 2.8 
      }
    };

    // Find matching behavior or use default
    let matchedBehavior: Partial<AnimalBehavior> | undefined;

    for (const [key, behavior] of Object.entries(behaviors)) {
      if (name.includes(key)) {
        matchedBehavior = behavior;
        break;
      }
    }

    // Default behavior for unknown animals
    const defaultBehavior: AnimalBehavior = {
      preferredHeight: 'medium',
      movementPattern: 'circular',
      socialTendency: 0.5,
      explorationRadius: 1.5
    };

    return { ...defaultBehavior, ...matchedBehavior };
  }

  /**
   * Find valid ground position using raycasting
   */
  private findGroundPosition(
    startPosition: Vector3, 
    meshes: Mesh[], 
    preferredHeight: 'low' | 'medium' | 'high'
  ): Vector3 | null {

    this.raycaster.set(startPosition, new Vector3(0, -1, 0));
    this.raycaster.far = 20; // Increase ray distance

    const intersections = this.raycaster.intersectObjects(meshes, true);

    if (intersections.length > 0) {
      const hit = intersections[0];
      const groundPos = hit.point.clone();

      // Adjust height based on preference and surface normal
      const normal = hit.face?.normal || new Vector3(0, 1, 0);
      const slopeAngle = Math.acos(normal.dot(new Vector3(0, 1, 0))) * (180 / Math.PI);

      // Skip positions that are too steep (>30 degrees)
      if (slopeAngle > 30) {
        return null;
      }

      // Height adjustments based on preference
      const heightOffsets = {
        low: 0.1,
        medium: 0.2,
        high: 0.3
      };

      groundPos.y += heightOffsets[preferredHeight];

      return groundPos;
    }

    return null;
  }

  /**
   * Generate waypoint types based on behavior
   */
  private getWaypointTypes(behavior: AnimalBehavior): Array<SmartWaypoint['type']> {
    const types: Array<SmartWaypoint['type']> = [];

    // Base types for all animals
    types.push('rest', 'explore');

    // Add social waypoints for social animals
    if (behavior.socialTendency > 0.5) {
      types.push('social');
    }

    // Add lookout points for certain behaviors
    if (behavior.movementPattern === 'circular' || behavior.preferredHeight !== 'low') {
      types.push('lookout');
    }

    // Fill remaining slots
    while (types.length < 4) {
      types.push('explore');
    }

    return types;
  }

  /**
   * Get duration for different waypoint types
   */
  private getWaypointDuration(type: SmartWaypoint['type']): number {
    const durations = {
      rest: 3.0 + Math.random() * 2.0,
      lookout: 2.0 + Math.random() * 1.5,
      explore: 1.0 + Math.random() * 1.0,
      social: 2.5 + Math.random() * 1.5
    };

    return durations[type];
  }

  /**
   * Generate look direction for lookout waypoints
   */
  private generateLookDirection(position: Vector3): Vector3 {
    // Look towards center with some randomness
    const centerDirection = new Vector3(0, 0, 0).sub(position).normalize();

    // Add random offset
    const randomAngle = (Math.random() - 0.5) * Math.PI;
    const cos = Math.cos(randomAngle);
    const sin = Math.sin(randomAngle);

    return new Vector3(
      centerDirection.x * cos - centerDirection.z * sin,
      0,
      centerDirection.x * sin + centerDirection.z * cos
    ).add(position);
  }

  /**
   * Create fallback waypoints if terrain detection fails
   */
  private generateFallbackWaypoints(
    animalIndex: number, 
    radius: number
  ): SmartWaypoint[] {

    const waypoints: SmartWaypoint[] = [];
    const baseY = 0.3; // Safe fallback height

    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI * 2 / 4) + (animalIndex * 0.5);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      waypoints.push({
        position: new Vector3(x, baseY, z),
        type: i % 2 === 0 ? 'rest' : 'explore',
        duration: 2.0 + Math.random() * 1.0
      });
    }

    return waypoints;
  }

  /**
   * Optimize waypoint order for smoother movement
   */
  private optimizeWaypointOrder(waypoints: SmartWaypoint[]): SmartWaypoint[] {
    if (waypoints.length <= 2) return waypoints;

    // Simple nearest-neighbor optimization
    const optimized: SmartWaypoint[] = [waypoints[0]];
    const remaining = waypoints.slice(1);

    while (remaining.length > 0) {
      const current = optimized[optimized.length - 1];
      let nearestIndex = 0;
      let nearestDistance = current.position.distanceTo(remaining[0].position);

      for (let i = 1; i < remaining.length; i++) {
        const distance = current.position.distanceTo(remaining[i].position);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }

      optimized.push(remaining[nearestIndex]);
      remaining.splice(nearestIndex, 1);
    }

    return optimized;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    // Clean up if needed
  }
}