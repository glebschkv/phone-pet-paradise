import React, { useRef, useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { Group, Mesh, BufferGeometry, Material } from 'three';
import { getIslandConfig } from './IslandConfig';

interface GLBIslandProps { 
  islandType: string; 
  scale?: number; 
}

export const GLBIsland = React.forwardRef<Group, GLBIslandProps>(({ islandType, scale = 3 }, ref) => {
  const meshRef = useRef<THREE.Group>(null);
  const groupRef = (ref as React.RefObject<Group>) || meshRef;
  
  // Get island config and model path
  const islandConfig = getIslandConfig(islandType);
  const modelPath = islandConfig.modelPath;
  
  console.log('🏝️ GLBIsland: Loading', islandType, 'at scale', scale);
  console.log('🏝️ GLBIsland: Path:', modelPath);
  console.log('🏝️ GLBIsland: Config:', islandConfig);
  
  // Use useGLTF with better error handling
  let gltf;
  try {
    gltf = useGLTF(modelPath);
    console.log('🏝️ GLBIsland: GLB loaded successfully', gltf);
    console.log('🏝️ GLBIsland: Scene object:', gltf.scene);
    console.log('🏝️ GLBIsland: Scene children count:', gltf.scene?.children?.length);
  } catch (error) {
    console.error('🏝️ GLBIsland: Failed to load GLB:', error);
    console.error('🏝️ GLBIsland: Error details:', error);
    throw error;
  }
  
  // Process the island scene for better collision detection
  const processedScene = useMemo(() => {
    if (!gltf?.scene) return null;
    
    const clonedScene = gltf.scene.clone();
    let meshCount = 0;
    let totalVertices = 0;
    
    clonedScene.traverse((child) => {
      if (child instanceof Mesh) {
        meshCount++;
        
        // Ensure proper shadow setup
        child.castShadow = true;
        child.receiveShadow = true;
        
        // Ensure mesh has proper geometry for raycasting
        if (child.geometry) {
          const geometry = child.geometry as BufferGeometry;
          
          // Count vertices
          if (geometry.attributes.position) {
            totalVertices += geometry.attributes.position.count;
          }
          
          // Ensure geometry has proper normals for surface detection
          if (!geometry.attributes.normal) {
            console.log('🏝️ GLBIsland: Computing normals for mesh:', child.name || 'unnamed');
            geometry.computeVertexNormals();
          }
          
          // Ensure the geometry has a bounding box/sphere for optimization
          if (!geometry.boundingBox) {
            geometry.computeBoundingBox();
          }
          
          if (!geometry.boundingSphere) {
            geometry.computeBoundingSphere();
          }
          
          // Add name for debugging
          if (!child.name) {
            child.name = `island-mesh-${meshCount}`;
          }
          
          console.log(`🏝️ GLBIsland: Processed mesh "${child.name}" with ${geometry.attributes.position?.count || 0} vertices`);
        }
        
        // Ensure material is setup for proper rendering and collision
        if (child.material) {
          const material = child.material as Material;
          
          // Ensure material is visible and not transparent in a way that affects collision
          if (material.transparent && (material as any).opacity < 0.1) {
            console.warn('🏝️ GLBIsland: Found nearly invisible material, may affect collision detection');
          }
        }
      }
    });
    
    console.log(`🏝️ GLBIsland: Processed island with ${meshCount} meshes and ${totalVertices} total vertices`);
    
    // Add a simple collision mesh fallback if no meshes found
    if (meshCount === 0) {
      console.warn('🏝️ GLBIsland: No meshes found in GLB, adding fallback collision mesh');
      
      const fallbackGeometry = new THREE.CylinderGeometry(2, 2.5, 0.8, 16);
      fallbackGeometry.computeVertexNormals();
      fallbackGeometry.computeBoundingBox();
      fallbackGeometry.computeBoundingSphere();
      
      const fallbackMaterial = new THREE.MeshLambertMaterial({ 
        color: '#4a7c59',
        visible: true // Make it visible so we can see the fallback
      });
      
      const fallbackMesh = new Mesh(fallbackGeometry, fallbackMaterial);
      fallbackMesh.name = 'fallback-island-collision';
      fallbackMesh.castShadow = true;
      fallbackMesh.receiveShadow = true;
      fallbackMesh.position.set(0, 0, 0);
      
      clonedScene.add(fallbackMesh);
      console.log('🏝️ GLBIsland: Added fallback collision mesh');
    }
    
    return clonedScene;
  }, [gltf?.scene]);
  
  useEffect(() => {
    console.log('🏝️ GLBIsland: Component mounted with scale:', scale);
    
    // Debug log the final mesh structure
    if (groupRef.current) {
      let finalMeshCount = 0;
      groupRef.current.traverse((child) => {
        if (child instanceof Mesh) {
          finalMeshCount++;
          console.log(`🏝️ GLBIsland: Final mesh ${finalMeshCount}: "${child.name}" at position:`, child.position, 'visible:', child.visible);
        }
      });
      console.log(`🏝️ GLBIsland: Total meshes available for collision: ${finalMeshCount}`);
    }
  }, [scale, processedScene]);
  
  // GLB loaded successfully - render processed scene
  if (!gltf?.scene || !processedScene) {
    console.warn('🏝️ GLBIsland: No scene in GLB, rendering enhanced fallback');
    // Render a more detailed fallback island
    return (
      <group ref={groupRef} scale={[scale, scale, scale]} position={[0, -0.5, 0]}>
        {/* Main island base */}
        <mesh name="fallback-island-base" castShadow receiveShadow>
          <cylinderGeometry args={[2, 2.5, 0.8, 32]} />
          <meshStandardMaterial color="#4ade80" />
        </mesh>
        
        {/* Secondary layer for more detail */}
        <mesh name="fallback-island-top" position={[0, 0.35, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.8, 2, 0.3, 32]} />
          <meshStandardMaterial color="#22c55e" />
        </mesh>
        
        {/* Add some surface variation */}
        {[
          { pos: [-0.8, 0.5, 0.3], size: 0.3 },
          { pos: [0.6, 0.45, -0.5], size: 0.25 },
          { pos: [0.2, 0.52, 0.8], size: 0.35 }
        ].map((mound, i) => (
          <mesh 
            key={i} 
            name={`fallback-mound-${i}`}
            position={[mound.pos[0], mound.pos[1], mound.pos[2]]} 
            castShadow 
            receiveShadow
          >
            <sphereGeometry args={[mound.size, 16, 12]} />
            <meshStandardMaterial color="#16a34a" />
          </mesh>
        ))}
      </group>
    );
  }
  
  console.log('🏝️ GLBIsland: Rendering processed GLB scene at position [0, -0.5, 0] with scale', scale);
  
  return (
    <group ref={groupRef} scale={[scale, scale, scale]} position={[0, -0.5, 0]}>
      <primitive object={processedScene} />
      
      {/* Add invisible helper geometry for debug raycasting if needed */}
      {process.env.NODE_ENV === 'development' && (
        <mesh visible={false} name="debug-collision-helper">
          <cylinderGeometry args={[2, 2.5, 0.8, 16]} />
          <meshBasicMaterial color="#ff0000" transparent opacity={0.2} />
        </mesh>
      )}
    </group>
  );
});
