import { Vector3, Mesh } from 'three';
import { IslandAnalyzer } from './IslandAnalyzer';

export interface NavigationResult {
  position: Vector3;
  rotation: number;
  canMove: boolean;
  surfaceNormal: Vector3;
  slope: number;
}

export class TerrainNavigator {
  private analyzer = new IslandAnalyzer();
  private tempVector = new Vector3();
  private tempVector2 = new Vector3();

  /**
   * Calculate safe movement with terrain awareness
   */
  calculateMovement(
    currentPos: Vector3,
    targetPos: Vector3,
    meshes: Mesh[],
    animalSize: 'small' | 'medium' | 'large'
  ): NavigationResult {
    const result: NavigationResult = {
      position: currentPos.clone(),
      rotation: 0,
      canMove: true,
      surfaceNormal: new Vector3(0, 1, 0),
      slope: 0
    };

    // Get ground clearance based on animal size
    const groundClearance = this.getGroundClearance(animalSize);
    
    // Sample terrain at target position
    const terrainHeight = this.analyzer.sampleHeight(targetPos.x, targetPos.z, meshes);
    if (terrainHeight === null) {
      result.canMove = false;
      return result;
    }

    // Calculate surface normal and slope
    this.calculateSurfaceProperties(targetPos.x, targetPos.z, meshes, result);
    
    // Check if slope is too steep
    const maxSlope = this.getMaxSlope(animalSize);
    if (result.slope > maxSlope) {
      result.canMove = false;
      return result;
    }

    // Forward-looking collision detection
    const moveDirection = this.tempVector.subVectors(targetPos, currentPos).normalize();
    const lookAheadDistance = 0.2;
    const lookAheadPos = this.tempVector2.copy(currentPos).add(
      moveDirection.multiplyScalar(lookAheadDistance)
    );

    const lookAheadHeight = this.analyzer.sampleHeight(lookAheadPos.x, lookAheadPos.z, meshes);
    if (lookAheadHeight !== null) {
      const heightDiff = lookAheadHeight - terrainHeight;
      if (Math.abs(heightDiff) > 0.3) { // Step height limit
        result.canMove = false;
        return result;
      }
    }

    // Set final position with proper height
    result.position.set(targetPos.x, terrainHeight + groundClearance, targetPos.z);
    
    // Calculate rotation to face movement direction, adjusted for slope
    const flatDirection = new Vector3(moveDirection.x, 0, moveDirection.z).normalize();
    result.rotation = Math.atan2(flatDirection.x, flatDirection.z);

    return result;
  }

  /**
   * Calculate surface normal and slope at position
   */
  private calculateSurfaceProperties(x: number, z: number, meshes: Mesh[], result: NavigationResult) {
    const step = 0.1;
    
    // Sample heights around the position
    const centerHeight = this.analyzer.sampleHeight(x, z, meshes) || 0;
    const rightHeight = this.analyzer.sampleHeight(x + step, z, meshes) || centerHeight;
    const leftHeight = this.analyzer.sampleHeight(x - step, z, meshes) || centerHeight;
    const forwardHeight = this.analyzer.sampleHeight(x, z + step, meshes) || centerHeight;
    const backHeight = this.analyzer.sampleHeight(x, z - step, meshes) || centerHeight;

    // Calculate surface normal using cross product
    const right = new Vector3(step * 2, rightHeight - leftHeight, 0);
    const forward = new Vector3(0, forwardHeight - backHeight, step * 2);
    
    result.surfaceNormal.crossVectors(right, forward).normalize();
    
    // Calculate slope magnitude
    const slopeX = Math.abs(rightHeight - leftHeight) / (2 * step);
    const slopeZ = Math.abs(forwardHeight - backHeight) / (2 * step);
    result.slope = Math.sqrt(slopeX * slopeX + slopeZ * slopeZ);
  }

  /**
   * Get ground clearance based on animal size
   */
  private getGroundClearance(size: 'small' | 'medium' | 'large'): number {
    switch (size) {
      case 'small': return 0.05;
      case 'medium': return 0.1;
      case 'large': return 0.15;
      default: return 0.1;
    }
  }

  /**
   * Get maximum slope based on animal size and type
   */
  private getMaxSlope(size: 'small' | 'medium' | 'large'): number {
    switch (size) {
      case 'small': return 0.5; // Small animals can handle steeper slopes
      case 'medium': return 0.3;
      case 'large': return 0.2; // Large animals need flatter terrain
      default: return 0.3;
    }
  }

  /**
   * Simple A* pathfinding between waypoints
   */
  findPath(start: Vector3, end: Vector3, meshes: Mesh[], animalSize: 'small' | 'medium' | 'large'): Vector3[] {
    // Simple straight-line path with obstacle checking
    const path: Vector3[] = [start.clone()];
    const steps = 5;
    
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const intermediatePos = new Vector3().lerpVectors(start, end, t);
      
      const navResult = this.calculateMovement(path[path.length - 1], intermediatePos, meshes, animalSize);
      
      if (navResult.canMove) {
        path.push(navResult.position);
      } else {
        // Find alternative route around obstacle
        const offset = 0.2;
        const altPos1 = intermediatePos.clone().add(new Vector3(offset, 0, 0));
        const altPos2 = intermediatePos.clone().add(new Vector3(-offset, 0, 0));
        
        const alt1Result = this.calculateMovement(path[path.length - 1], altPos1, meshes, animalSize);
        const alt2Result = this.calculateMovement(path[path.length - 1], altPos2, meshes, animalSize);
        
        if (alt1Result.canMove) {
          path.push(alt1Result.position);
        } else if (alt2Result.canMove) {
          path.push(alt2Result.position);
        } else {
          // Can't find path, stop here
          break;
        }
      }
    }
    
    path.push(end.clone());
    return path;
  }

  /**
   * Check if direct movement between two points is possible
   */
  canMoveDirect(from: Vector3, to: Vector3, meshes: Mesh[], animalSize: 'small' | 'medium' | 'large'): boolean {
    const steps = 3;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const checkPos = new Vector3().lerpVectors(from, to, t);
      const result = this.calculateMovement(from, checkPos, meshes, animalSize);
      if (!result.canMove) return false;
    }
    return true;
  }
}