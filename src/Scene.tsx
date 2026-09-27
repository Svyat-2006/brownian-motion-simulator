import { useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from '@react-three/drei';
import Particles from './Particles';

// Описание всех пропсов, приходящих из App.tsx
interface SceneProps {
  dimension: number;
  mass: number;
  temperature: number;
  isPaused: boolean;
  isSpawnMode: boolean;
  particleCount: number;
  onAnalyticsUpdate: (data: any) => void;
}

export default function Scene({ dimension, mass, temperature, isPaused, isSpawnMode, particleCount, onAnalyticsUpdate }: SceneProps) {
  // Прямая ссылка на 3D-объект, чтобы Worker мог двигать его в обход рендеров React
  const bigParticleRef = useRef<THREE.Mesh>(null);

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <OrbitControls />

      {/* Проволочный каркас аквариума */}
      <mesh>
        <boxGeometry args={[10, 10, 10]} />
        <meshBasicMaterial color="#4a90e2" wireframe={true} />
      </mesh>

      {/* Отрисовка центрального объекта в зависимости от размерности (3D/2D/1D) */}
      <mesh ref={bigParticleRef} position={[0, 0, 0]}>
        {dimension === 3 && <sphereGeometry args={[1, 32, 32]} />}
        {/* Высота и ширина 9.9 нужны, чтобы объекты визуально не "протыкали" стенки аквариума */}
        {dimension === 2 && <cylinderGeometry args={[1, 1, 9.9, 32]} />}
        {dimension === 1 && <boxGeometry args={[2, 9.9, 9.9]} />}
        <meshStandardMaterial color="#e74c3c" />
      </mesh>

      {/* Передача всех данных в мост между React и Web Worker */}
      <Particles 
        count={particleCount} 
        bigParticleRef={bigParticleRef} 
        dimension={dimension} 
        mass={mass} 
        temperature={temperature} 
        isPaused={isPaused} 
        isSpawnMode={isSpawnMode} 
        onAnalyticsUpdate={onAnalyticsUpdate}
      />
    </>
  );
}