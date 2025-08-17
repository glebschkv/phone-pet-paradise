import { Vector3, Raycaster, Mesh, BufferGeometry } from 'three';

export interface IslandBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  center: Vector3;
  radius: number;
}

export interface SafeZone {
  center: Vector3;
  radius: number;
  height: number;
  slope: number;
  type: 'walkable' | 'resting' | 'lookout';
}

export class IslandAnalyzer {
  private raycaster = new Raycaster();
  private rayDirection = new Vector3(0, -1, 0);
  private tempVector = new Vector3();

  /**
   * Analyzes island geometry to find bounds and safe zones
   */
  analyzeIsland(islandMeshes: Mesh[]): { bounds: IslandBounds; safeZones: SafeZone[] } {
    if (islandMeshes.length === 0) {
      return {
        bounds: { minX: -1, maxX: 1, minZ: -1, maxZ: 1, center: new Vector3(0, 0, 0), radius: 1 },
        safeZones: []
      };
    }

    const bounds = this.calculateBounds(islandMeshes);
    const safeZones = this.findSafeZones(islandMeshes, bounds);

    return { bounds, safeZones };
  }

  /**
   * Calculate island boundaries
   */
  private calculateBounds(meshes: Mesh[]): IslandBounds {
    let minX = Infinity, maxX = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    meshes.forEach(mesh => {
      const geometry = mesh.geometry;
      const positions = geometry.attributes.position;
      
      if (positions) {
        const array = positions.array as Float32Array;
        for (let i = 0; i < array.length; i += 3) {
          const x = array[i];
          const z = array[i + 2];
          
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minZ = Math.min(minZ, z);
          maxZ = Math.max(maxZ, z);
        }
      }
    });

    // Add margin for safety
    const margin = 0.2;
    minX += margin;
    maxX -= margin;
    minZ += margin;
    maxZ -= margin;

    const center = new Vector3((minX + maxX) / 2, 0, (minZ + maxZ) / 2);
    const radius = Math.min(maxX - minX, maxZ - minZ) / 2;

    return { minX, maxX, minZ, maxZ, center, radius };
  }

  /**
   * Sample terrain height at given position
   */
  sampleHeight(x: number, z: number, meshes: Mesh[]): number | null {
    if (meshes.length === 0) return null;

    const rayOrigin = this.tempVector.set(x, 10, z);
    this.raycaster.set(rayOrigin, this.rayDirection);

    const intersects = this.raycaster.intersectObjects(meshes, true);
    return intersects.length > 0 ? intersects[0].point.y : null;
  }

  /**
   * Calculate slope at position using neighboring heights
   */
  calculateSlope(x: number, z: number, meshes: Mesh[]): number {
    const step = 0.1;
    const centerHeight = this.sampleHeight(x, z, meshes);
    if (centerHeight === null) return 0;

    const rightHeight = this.sampleHeight(x + step, z, meshes) || centerHeight;
    const leftHeight = this.sampleHeight(x - step, z, meshes) || centerHeight;
    const forwardHeight = this.sampleHeight(x, z + step, meshes) || centerHeight;
    const backHeight = this.sampleHeight(x, z - step, meshes) || centerHeight;

    const slopeX = Math.abs(rightHeight - leftHeight) / (2 * step);
    const slopeZ = Math.abs(forwardHeight - backHeight) / (2 * step);

    return Math.sqrt(slopeX * slopeX + slopeZ * slopeZ);
  }

  /**
   * Find safe zones for animal movement
   */
  private findSafeZones(meshes: Mesh[], bounds: IslandBounds): SafeZone[] {
    const safeZones: SafeZone[] = [];
    const gridSize = 8; // Sample grid resolution
    const maxSlope = 0.3; // Maximum acceptable slope

    for (let i = 0; i <= gridSize; i++) {
      for (let j = 0; j <= gridSize; j++) {
        const x = bounds.minX + (i / gridSize) * (bounds.maxX - bounds.minX);
        const z = bounds.minZ + (j / gridSize) * (bounds.maxZ - bounds.minZ);

        const height = this.sampleHeight(x, z, meshes);
        if (height === null) continue;

        const slope = this.calculateSlope(x, z, meshes);
        if (slope > maxSlope) continue;

        // Determine zone type based on properties
        let type: 'walkable' | 'resting' | 'lookout' = 'walkable';
        
        const distanceFromCenter = Math.sqrt(
          Math.pow(x - bounds.center.x, 2) + Math.pow(z - bounds.center.z, 2)
        );
        
        if (height > 0.5) type = 'lookout';
        else if (slope < 0.1 && distanceFromCenter < bounds.radius * 0.3) type = 'resting';

        safeZones.push({
          center: new Vector3(x, height, z),
          radius: 0.2,
          height,
          slope,
          type
        });
      }
    }

    return safeZones;
  }

  /**
   * Check if a position is safe for movement
   */
  isSafePosition(position: Vector3, meshes: Mesh[], maxSlope = 0.3): boolean {
    const height = this.sampleHeight(position.x, position.z, meshes);
    if (height === null) return false;

    const slope = this.calculateSlope(position.x, position.z, meshes);
    return slope <= maxSlope;
  }
}