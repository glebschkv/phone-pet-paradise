import { Vector3, Mesh } from 'three';
import { IslandAnalyzer, IslandBounds, SafeZone } from './IslandAnalyzer';
import { AnimalData } from '@/data/AnimalDatabase';

export interface SmartWaypoint {
  position: Vector3;
  animation: string;
  duration: number;
  lookAt?: Vector3;
  terrainHeight?: number;
  type: 'movement' | 'rest' | 'lookout' | 'wander';
  priority: number; // Higher priority = more important waypoint
}

export interface AnimalBehavior {
  movementSpeed: number;
  restFrequency: number; // 0-1, how often to rest
  wanderRadius: number;
  preferredZoneType: 'walkable' | 'resting' | 'lookout';
  animationMap: {
    walk: string[];
    idle: string[];
    special?: string[];
  };
}

export class WaypointGenerator {
  private analyzer = new IslandAnalyzer();
  
  /**
   * Generate animal-specific waypoints based on island analysis
   */
  generateWaypoints(
    animal: AnimalData,
    animalIndex: number,
    islandMeshes: Mesh[]
  ): SmartWaypoint[] {
    const { bounds, safeZones } = this.analyzer.analyzeIsland(islandMeshes);
    const behavior = this.getAnimalBehavior(animal);
    
    // Create base circular path
    const baseWaypoints = this.createCircularPath(bounds, behavior, animalIndex);
    
    // Add interest points from safe zones
    const interestWaypoints = this.createInterestPoints(safeZones, behavior);
    
    // Combine and optimize
    const allWaypoints = [...baseWaypoints, ...interestWaypoints];
    return this.optimizeWaypointPath(allWaypoints, islandMeshes);
  }

  /**
   * Get behavior profile for different animal types
   */
  private getAnimalBehavior(animal: AnimalData): AnimalBehavior {
    // Base behavior patterns
    const behaviors: Record<string, Partial<AnimalBehavior>> = {
      // Small, quick animals
      rabbit: { movementSpeed: 0.8, restFrequency: 0.4, wanderRadius: 0.3 },
      squirrel: { movementSpeed: 1.0, restFrequency: 0.5, wanderRadius: 0.2 },
      rat: { movementSpeed: 0.9, restFrequency: 0.3, wanderRadius: 0.25 },
      
      // Medium animals
      fox: { movementSpeed: 0.6, restFrequency: 0.3, wanderRadius: 0.4 },
      wolf: { movementSpeed: 0.5, restFrequency: 0.2, wanderRadius: 0.5 },
      deer: { movementSpeed: 0.4, restFrequency: 0.4, wanderRadius: 0.4 },
      
      // Large animals
      bear: { movementSpeed: 0.3, restFrequency: 0.6, wanderRadius: 0.6 },
      elephant: { movementSpeed: 0.2, restFrequency: 0.7, wanderRadius: 0.7 },
      lion: { movementSpeed: 0.4, restFrequency: 0.5, wanderRadius: 0.5 },
      
      // Flying animals
      eagle: { movementSpeed: 0.7, restFrequency: 0.3, wanderRadius: 0.8, preferredZoneType: 'lookout' },
      dove: { movementSpeed: 0.6, restFrequency: 0.4, wanderRadius: 0.6, preferredZoneType: 'lookout' },
      
      // Aquatic (adapted for land movement)
      dolphin: { movementSpeed: 0.5, restFrequency: 0.3, wanderRadius: 0.4 },
      whale: { movementSpeed: 0.2, restFrequency: 0.8, wanderRadius: 0.8 },
    };

    const animalKey = animal.name.toLowerCase().split(' ')[0];
    const baseProfile = behaviors[animalKey] || {};

    return {
      movementSpeed: baseProfile.movementSpeed || 0.5,
      restFrequency: baseProfile.restFrequency || 0.4,
      wanderRadius: baseProfile.wanderRadius || 0.4,
      preferredZoneType: baseProfile.preferredZoneType || 'walkable',
      animationMap: {
        walk: ['walk', 'run', 'move', 'walking'],
        idle: ['idle', 'stand', 'rest', 'breathing'],
        special: this.getSpecialAnimations(animal)
      }
    };
  }

  /**
   * Create circular path around island perimeter
   */
  private createCircularPath(
    bounds: IslandBounds,
    behavior: AnimalBehavior,
    animalIndex: number
  ): SmartWaypoint[] {
    const waypoints: SmartWaypoint[] = [];
    const numPoints = 8; // Base waypoints around perimeter
    const radiusVariation = 0.8 + (animalIndex * 0.1); // Vary radius per animal
    const actualRadius = bounds.radius * radiusVariation;

    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2 + (animalIndex * 0.3); // Offset each animal
      const x = bounds.center.x + Math.cos(angle) * actualRadius;
      const z = bounds.center.z + Math.sin(angle) * actualRadius;

      // Add some organic variation
      const variation = 0.1;
      const varX = x + (Math.random() - 0.5) * variation;
      const varZ = z + (Math.random() - 0.5) * variation;

      waypoints.push({
        position: new Vector3(varX, 0, varZ), // Height will be calculated later
        animation: 'walk',
        duration: 1.5 + Math.random() * 1.0,
        type: 'movement',
        priority: 1
      });

      // Add rest waypoints based on behavior
      if (Math.random() < behavior.restFrequency) {
        waypoints.push({
          position: new Vector3(varX, 0, varZ),
          animation: 'idle',
          duration: 2.0 + Math.random() * 2.0,
          type: 'rest',
          priority: 2,
          lookAt: new Vector3(
            bounds.center.x + Math.random() - 0.5,
            0,
            bounds.center.z + Math.random() - 0.5
          )
        });
      }
    }

    return waypoints;
  }

  /**
   * Create waypoints at interesting locations
   */
  private createInterestPoints(safeZones: SafeZone[], behavior: AnimalBehavior): SmartWaypoint[] {
    const waypoints: SmartWaypoint[] = [];
    
    // Filter zones by animal preference
    const preferredZones = safeZones.filter(zone => 
      zone.type === behavior.preferredZoneType || zone.type === 'walkable'
    );

    // Take a few best zones
    const selectedZones = preferredZones
      .sort((a, b) => {
        // Prefer higher locations for lookouts, flatter for resting
        if (behavior.preferredZoneType === 'lookout') return b.height - a.height;
        if (behavior.preferredZoneType === 'resting') return a.slope - b.slope;
        return 0;
      })
      .slice(0, 3);

    selectedZones.forEach(zone => {
      waypoints.push({
        position: zone.center.clone(),
        animation: zone.type === 'lookout' ? 'idle' : 'walk',
        duration: zone.type === 'lookout' ? 4.0 : 2.0,
        type: zone.type as SmartWaypoint['type'],
        priority: zone.type === 'lookout' ? 3 : 2,
        lookAt: zone.type === 'lookout' ? new Vector3(0, zone.height, 0) : undefined
      });
    });

    return waypoints;
  }

  /**
   * Optimize waypoint path for smooth movement
   */
  private optimizeWaypointPath(waypoints: SmartWaypoint[], meshes: Mesh[]): SmartWaypoint[] {
    // Sort by priority and position for logical flow
    const optimized = waypoints.sort((a, b) => {
      const priorityDiff = b.priority - a.priority;
      if (priorityDiff !== 0) return priorityDiff;
      
      // Sort by angle for circular flow
      const angleA = Math.atan2(a.position.z, a.position.x);
      const angleB = Math.atan2(b.position.z, b.position.x);
      return angleA - angleB;
    });

    // Update terrain heights
    optimized.forEach(waypoint => {
      const height = this.analyzer.sampleHeight(waypoint.position.x, waypoint.position.z, meshes);
      if (height !== null) {
        waypoint.terrainHeight = height + 0.1; // Small offset above ground
        waypoint.position.y = waypoint.terrainHeight;
      }
    });

    return optimized;
  }

  /**
   * Get animal size category
   */
  // @ts-expect-error - Method kept for potential future use
  private getAnimalSize(name: string): 'small' | 'medium' | 'large' {
    const small = ['rabbit', 'squirrel', 'rat', 'fish', 'crab', 'starfish'];
    const large = ['elephant', 'whale', 'bear', 'lion', 'tiger', 'giraffe', 'rhino'];
    
    const lowerName = name.toLowerCase();
    if (small.some(s => lowerName.includes(s))) return 'small';
    if (large.some(l => lowerName.includes(l))) return 'large';
    return 'medium';
  }

  /**
   * Get special animations for specific animals
   */
  private getSpecialAnimations(animal: AnimalData): string[] {
    const specialMoves: Record<string, string[]> = {
      panda: ['eating', 'sitting', 'stretching'],
      fox: ['sniffing', 'digging', 'alert'],
      eagle: ['flying', 'soaring', 'landing'],
      bear: ['roaring', 'fishing', 'standing'],
      lion: ['roaring', 'prowling', 'maneShake']
    };

    const key = animal.name.toLowerCase().split(' ')[0];
    return specialMoves[key] || [];
  }
}