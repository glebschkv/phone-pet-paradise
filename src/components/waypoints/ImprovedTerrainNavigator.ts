import { Vector3, Raycaster, Mesh } from 'three';

export interface NavigationResult {
  position: Vector3;
  surfaceNormal: Vector3;
  canMove: boolean;
  isOnGround: boolean;
  slopeAngle: number;
}

interface SizeConfig {
  radius: number;
  height: number;
  heightOffset: number;
}

export class ImprovedTerrainNavigator {
  private raycaster: Raycaster;
  private tempVector: Vector3;
  private tempVector2: Vector3;
  private tempVector3: Vector3;
  private readonly maxSlopeAngle: number = 45; // degrees
  private readonly rayLength: number = 10;

  constructor() {
    this.raycaster = new Raycaster();
    this.tempVector = new Vector3();
    this.tempVector2 = new Vector3();
    this.tempVector3 = new Vector3();
  }

  /**
   * Advanced terrain-aware movement calculation with multiple raycasts
   */
  calculateMovement(
    currentPosition: Vector3, 
    targetPosition: Vector3, 
    islandMeshes: Mesh[], 
    animalSize: 'small' | 'medium' | 'large'
  ): NavigationResult {

    // Get size-based offsets
    const sizeConfig = this.getSizeConfig(animalSize);

    // Perform multi-point ground detection
    const groundInfo = this.performMultiPointGroundCheck(currentPosition, islandMeshes, sizeConfig);

    if (!groundInfo.isOnGround) {
      // If not on ground, try to find nearest ground point
      const nearestGround = this.findNearestGroundPoint(currentPosition, islandMeshes, sizeConfig);
      if (nearestGround.canMove) {
        return nearestGround;
      }

      // Fallback: stay at current position but adjust height
      return {
        position: currentPosition.clone(),
        surfaceNormal: new Vector3(0, 1, 0),
        canMove: false,
        isOnGround: false,
        slopeAngle: 0
      };
    }

    // Calculate movement direction
    this.tempVector.subVectors(targetPosition, currentPosition);
    this.tempVector.y = 0; // Remove vertical component for horizontal movement

    if (this.tempVector.length() < 0.001) {
      // No horizontal movement, just adjust to ground
      return groundInfo;
    }

    this.tempVector.normalize();

    // Check if movement direction is valid (not too steep)
    const movementResult = this.validateMovement(
      currentPosition, 
      this.tempVector, 
      islandMeshes, 
      sizeConfig
    );

    return movementResult;
  }

  /**
   * Multi-point ground detection for better stability
   */
  private performMultiPointGroundCheck(
    position: Vector3,
    meshes: Mesh[],
    sizeConfig: SizeConfig
  ): NavigationResult {

    const checkPoints = this.generateGroundCheckPoints(position, sizeConfig);
    const results: Array<{position: Vector3, normal: Vector3, distance: number}> = [];

    for (const checkPoint of checkPoints) {
      this.raycaster.set(
        this.tempVector2.copy(checkPoint).setY(checkPoint.y + this.rayLength),
        new Vector3(0, -1, 0)
      );

      const intersections = this.raycaster.intersectObjects(meshes, true);

      if (intersections.length > 0) {
        const hit = intersections[0];
        results.push({
          position: hit.point,
          normal: hit.face?.normal || new Vector3(0, 1, 0),
          distance: hit.distance
        });
      }
    }

    if (results.length === 0) {
      return {
        position: position.clone(),
        surfaceNormal: new Vector3(0, 1, 0),
        canMove: false,
        isOnGround: false,
        slopeAngle: 0
      };
    }

    // Average the results for smoother movement
    const avgPosition = new Vector3();
    const avgNormal = new Vector3();

    results.forEach(result => {
      avgPosition.add(result.position);
      avgNormal.add(result.normal);
    });

    avgPosition.divideScalar(results.length);
    avgNormal.divideScalar(results.length).normalize();

    // Adjust height based on animal size
    avgPosition.y += sizeConfig.heightOffset;

    const slopeAngle = Math.acos(avgNormal.dot(new Vector3(0, 1, 0))) * (180 / Math.PI);

    return {
      position: avgPosition,
      surfaceNormal: avgNormal,
      canMove: slopeAngle <= this.maxSlopeAngle,
      isOnGround: true,
      slopeAngle
    };
  }

  /**
   * Generate multiple check points around the animal's base
   */
  private generateGroundCheckPoints(position: Vector3, sizeConfig: SizeConfig): Vector3[] {
    const points = [position.clone()]; // Center point

    // Add surrounding points for better stability
    const offsets = [
      { x: sizeConfig.radius, z: 0 },
      { x: -sizeConfig.radius, z: 0 },
      { x: 0, z: sizeConfig.radius },
      { x: 0, z: -sizeConfig.radius }
    ];

    offsets.forEach(offset => {
      points.push(new Vector3(
        position.x + offset.x,
        position.y,
        position.z + offset.z
      ));
    });

    return points;
  }

  /**
   * Validate movement in a direction
   */
  private validateMovement(
    currentPos: Vector3,
    direction: Vector3,
    meshes: Mesh[],
    sizeConfig: SizeConfig
  ): NavigationResult {

    // Cast ray forward to check for obstacles
    const moveDistance = 0.1; // Small step distance
    const targetPos = this.tempVector3
      .copy(currentPos)
      .add(this.tempVector2.copy(direction).multiplyScalar(moveDistance));

    // Check ground at target position
    const groundCheck = this.performMultiPointGroundCheck(targetPos, meshes, sizeConfig);

    if (!groundCheck.isOnGround || groundCheck.slopeAngle > this.maxSlopeAngle) {
      // Can't move in this direction, return current position
      const currentGround = this.performMultiPointGroundCheck(currentPos, meshes, sizeConfig);
      return currentGround;
    }

    // Additional obstacle detection
    const hasObstacle = this.checkForObstacles(currentPos, targetPos, meshes, sizeConfig);

    if (hasObstacle) {
      // Try to find alternative path around obstacle
      const alternativePath = this.findAlternativePath(currentPos, direction, meshes, sizeConfig);
      if (alternativePath.canMove) {
        return alternativePath;
      }

      // No alternative found, stay at current position
      const currentGround = this.performMultiPointGroundCheck(currentPos, meshes, sizeConfig);
      return currentGround;
    }

    return groundCheck;
  }

  /**
   * Check for obstacles in the path
   */
  private checkForObstacles(
    from: Vector3,
    to: Vector3,
    meshes: Mesh[],
    sizeConfig: SizeConfig
  ): boolean {

    const direction = this.tempVector.subVectors(to, from).normalize();
    const distance = from.distanceTo(to);

    // Cast rays at different heights to detect obstacles
    const checkHeights = [0.1, sizeConfig.height * 0.5, sizeConfig.height * 0.8];

    for (const height of checkHeights) {
      const rayOrigin = this.tempVector2.copy(from).setY(from.y + height);
      this.raycaster.set(rayOrigin, direction);
      this.raycaster.far = distance + sizeConfig.radius;

      const intersections = this.raycaster.intersectObjects(meshes, true);

      if (intersections.length > 0 && intersections[0].distance < distance + sizeConfig.radius) {
        return true;
      }
    }

    return false;
  }

  /**
   * Find alternative path around obstacles
   */
  private findAlternativePath(
    currentPos: Vector3,
    blockedDirection: Vector3,
    meshes: Mesh[],
    sizeConfig: SizeConfig
  ): NavigationResult {

    // Try slight direction adjustments
    const angleAdjustments = [30, -30, 60, -60, 90, -90]; // degrees

    for (const angleAdj of angleAdjustments) {
      const adjustedDirection = this.rotateVectorY(blockedDirection, angleAdj * Math.PI / 180);
      const testResult = this.validateMovement(currentPos, adjustedDirection, meshes, sizeConfig);

      if (testResult.canMove && testResult.isOnGround) {
        return testResult;
      }
    }

    // No alternative found
    return {
      position: currentPos.clone(),
      surfaceNormal: new Vector3(0, 1, 0),
      canMove: false,
      isOnGround: true,
      slopeAngle: 0
    };
  }

  /**
   * Find nearest ground point if animal is floating
   */
  private findNearestGroundPoint(
    position: Vector3,
    meshes: Mesh[],
    sizeConfig: SizeConfig
  ): NavigationResult {

    // Cast ray downward from higher position
    this.raycaster.set(
      this.tempVector.copy(position).setY(position.y + this.rayLength),
      new Vector3(0, -1, 0)
    );

    const intersections = this.raycaster.intersectObjects(meshes, true);

    if (intersections.length > 0) {
      const hit = intersections[0];
      const groundPos = hit.point.clone();
      groundPos.y += sizeConfig.heightOffset;

      const normal = hit.face?.normal || new Vector3(0, 1, 0);
      const slopeAngle = Math.acos(normal.dot(new Vector3(0, 1, 0))) * (180 / Math.PI);

      return {
        position: groundPos,
        surfaceNormal: normal,
        canMove: slopeAngle <= this.maxSlopeAngle,
        isOnGround: true,
        slopeAngle
      };
    }

    return {
      position: position.clone(),
      surfaceNormal: new Vector3(0, 1, 0),
      canMove: false,
      isOnGround: false,
      slopeAngle: 0
    };
  }

  /**
   * Get size-specific configuration
   */
  private getSizeConfig(size: 'small' | 'medium' | 'large') {
    const configs = {
      small: { radius: 0.1, height: 0.2, heightOffset: 0.1 },
      medium: { radius: 0.15, height: 0.3, heightOffset: 0.15 },
      large: { radius: 0.2, height: 0.5, heightOffset: 0.25 }
    };

    return configs[size] || configs.medium;
  }

  /**
   * Rotate vector around Y axis
   */
  private rotateVectorY(vector: Vector3, angle: number): Vector3 {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    return new Vector3(
      vector.x * cos - vector.z * sin,
      vector.y,
      vector.x * sin + vector.z * cos
    );
  }

  /**
   * Dispose resources
   */
  dispose(): void {
    // Clean up if needed
  }
}