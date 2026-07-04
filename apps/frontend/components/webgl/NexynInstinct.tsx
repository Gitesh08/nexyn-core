import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function NexynInstinct() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const count = 10;
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  const particles = useMemo(() => {
    return Array.from({ length: count }, () => ({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 6
      ),
      scale: 0.2
    }));
  }, [count]);

  useFrame((state) => {
    const t = state.clock.elapsedTime % 6; // Loop every 6 seconds
    
    let merged = 0;
    particles.forEach((p, i) => {
      if (t < 2) {
        // Floating Phase
        p.position.y += Math.sin(state.clock.elapsedTime * 2 + i) * 0.005;
        p.scale = Math.min(0.2, p.scale + 0.01);
      } else if (t < 4) {
        // Merging to center Phase
        p.position.lerp(new THREE.Vector3(0,0,0), 0.05);
        p.scale = Math.max(0, p.scale - 0.005);
        if (p.scale < 0.05) merged++;
      } else {
        // Reset Phase
        p.position.set(
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 6
        );
        p.scale = 0;
      }
      
      dummy.position.copy(p.position);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      if(meshRef.current) meshRef.current.setMatrixAt(i, dummy.matrix);
    });
    
    if (meshRef.current) meshRef.current.instanceMatrix.needsUpdate = true;
    
    if (coreRef.current) {
      if (t >= 2 && t < 4) {
        // Core grows as particles merge
        const coreScale = 0.01 + (merged / count) * 1.5;
        coreRef.current.scale.lerp(new THREE.Vector3(coreScale, coreScale, coreScale), 0.1);
        
        const mat = coreRef.current.material as THREE.MeshStandardMaterial;
        mat.emissiveIntensity = coreScale * 2;
      } else if (t >= 4) {
        // Core pulsing/glowing
        const pulse = 1.5 + Math.sin(state.clock.elapsedTime * 5) * 0.05;
        coreRef.current.scale.setScalar(pulse);
      } else {
        // Hidden/Small
        coreRef.current.scale.setScalar(0.01);
      }
    }
  });

  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
        <octahedronGeometry />
        <meshStandardMaterial color="#0EA5E9" emissive="#0EA5E9" emissiveIntensity={0.8} />
      </instancedMesh>
      
      <mesh ref={coreRef} scale={0.01}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#ffffff" emissive="#8B5CF6" emissiveIntensity={2} wireframe />
      </mesh>
    </>
  );
}
