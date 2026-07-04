import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function NexynIngestion() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const count = 250;
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 10 - 6, // Start on the left
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8
      ),
      isHighValue: i % 3 === 0, // 30% pass through
      target: new THREE.Vector3(
         (Math.random() - 0.5) * 2 + 3,
         (Math.random() - 0.5) * 2,
         (Math.random() - 0.5) * 2
      ),
      state: 0, // 0: flying, 1: filtered, 2: locked
      scale: 0.1
    }));
  }, [count]);

  const colorArray = useMemo(() => new Float32Array(count * 3), [count]);

  useFrame(() => {
    particles.forEach((p, i) => {
      if (p.state === 0) {
        p.position.x += 0.08; // Fly right towards x=0
        if (p.position.x >= 0) {
          if (p.isHighValue) {
            p.state = 2; // Pass through
          } else {
            p.state = 1; // Filtered
          }
        }
      } else if (p.state === 1) {
        // Grey, shrink, drop
        p.position.y -= 0.03;
        p.scale *= 0.92;
        
        // Respawn if too small
        if (p.scale < 0.001) {
          p.position.set((Math.random() - 0.5) * 10 - 6, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
          p.state = 0;
          p.scale = 0.1;
        }
      } else if (p.state === 2) {
        // Move to target structured core
        p.position.lerp(p.target, 0.05);
        
        // Respawn randomly to keep animation flowing
        if (Math.random() > 0.995) {
          p.position.set((Math.random() - 0.5) * 10 - 6, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
          p.state = 0;
          p.scale = 0.1;
        }
      }
      
      dummy.position.copy(p.position);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      if(meshRef.current) meshRef.current.setMatrixAt(i, dummy.matrix);
      
      if (p.state === 1) {
        color.set('#475569'); // Grey (filtered)
      } else if (p.state === 2) {
        color.set('#0EA5E9'); // Cyan (retained)
      } else {
        color.set('#F8FAFC'); // White (incoming)
      }
      color.toArray(colorArray, i * 3);
    });
    
    if (meshRef.current) {
      meshRef.current.instanceMatrix.needsUpdate = true;
      if (meshRef.current.instanceColor) {
        meshRef.current.instanceColor.needsUpdate = true;
      }
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      
      {/* Buddhi Filter Plane */}
      <mesh position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#8B5CF6" transparent opacity={0.2} side={THREE.DoubleSide} />
        {/* Subtle grid on the plane */}
        <gridHelper args={[10, 10, 0xffffff, 0xffffff]} rotation={[Math.PI / 2, 0, 0]} material-opacity={0.1} material-transparent />
      </mesh>
      
      <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
        <boxGeometry />
        <meshStandardMaterial />
        <instancedBufferAttribute attach="instanceColor" args={[colorArray, 3]} />
      </instancedMesh>
    </>
  );
}
