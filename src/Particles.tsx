// --- БЛОК 1: ИМПОРТЫ И ИНТЕРФЕЙСЫ ---
import { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';

interface ParticlesProps {
  count: number;
  bigParticleRef: React.RefObject<THREE.Mesh | null>;
  dimension: number;
  mass: number;
  temperature: number;
  isPaused: boolean;
  isSpawnMode: boolean;
  onAnalyticsUpdate?: (data: any) => void;
}

const MAX_PARTICLES = 10000; // Лимит памяти GPU

export default function Particles({ 
  count, bigParticleRef, dimension, mass, temperature, isPaused, isSpawnMode, onAnalyticsUpdate 
}: ParticlesProps) {
  
  // meshRef управляет всем облаком частиц сразу
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []); // Пустышка для расчета матриц
  const workerRef = useRef<Worker | null>(null);

  // --- БЛОК 2: ЖИЗНЕННЫЙ ЦИКЛ WORKER'А ---
  useEffect(() => {
    // 1. Создаем фоновый поток (Worker)
    workerRef.current = new Worker(new URL('./physics/worker.ts', import.meta.url), { type: 'module' });
    
    // 2. Выделяем начальный массив координат
    const initialPositions = new Float32Array(MAX_PARTICLES * 3);
    for (let i = 0; i < MAX_PARTICLES * 3; i++) {
      initialPositions[i] = (Math.random() - 0.5) * 9.6;
    }
    workerRef.current.postMessage({ type: 'INIT', payload: { count: 1000, positions: initialPositions } });

    // 3. Слушаем ответы от Worker'а (Срабатывает 60 раз в секунду!)
    workerRef.current.onmessage = (event) => {
      const { type, positions, bigPos, count: currentCount, analytics } = event.data;
      if (type === 'UPDATE') {
        if (meshRef.current) {
          // Динамически меняем число видимых частиц (остальные лежат в памяти, но не рисуются)
          meshRef.current.count = currentCount;
          for (let i = 0; i < currentCount; i++) {
            dummy.position.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
            dummy.updateMatrix();
            meshRef.current.setMatrixAt(i, dummy.matrix); // Передаем матрицу в видеокарту
          }
          meshRef.current.instanceMatrix.needsUpdate = true;
        }
        // Обновляем позицию красной частицы напрямую по ссылке
        if (bigParticleRef.current && bigPos) {
          bigParticleRef.current.position.set(bigPos[0], bigPos[1], bigPos[2]);
        }
        // Отправляем аналитику наверх (в App.tsx)
        if (onAnalyticsUpdate && analytics) onAnalyticsUpdate(analytics);
      }
    };

    return () => workerRef.current?.terminate(); 
  }, [dummy, bigParticleRef]); 

  // --- БЛОК 3: ПЕРЕДАЧА КОМАНД В WORKER ---
  // useEffect'ы отправляют сообщения в Worker только при изменении конкретных пропсов
  useEffect(() => { if (workerRef.current) workerRef.current.postMessage({ type: 'SET_COUNT', payload: count }); }, [count]);
  useEffect(() => { if (workerRef.current) workerRef.current.postMessage({ type: 'UPDATE_PARAMS', payload: { dimension, mass, temperature } }); }, [dimension, mass, temperature]);
  useEffect(() => { if (workerRef.current) workerRef.current.postMessage({ type: 'SET_PAUSE', payload: isPaused }); }, [isPaused]);

  // --- БЛОК 4: РЕНДЕР И RAYCASTING ---
  return (
    <>
      {/* Невидимый хитбокс для улавливания кликов мыши (Raycasting) */}
      <mesh
        onClick={(e) => {
          if (!isSpawnMode) return; // Если спавн выключен, клик уходит в OrbitControls (вращение)
          if (workerRef.current) {
            // Отправляем 3D координаты точки клика для создания взрыва частиц
            workerRef.current.postMessage({
              type: 'ADD_PARTICLES',
              payload: { amount: 100, x: e.point.x, y: e.point.y, z: e.point.z }
            });
          }
        }}
      >
        <boxGeometry args={[10, 10, 10]} />
        {/* THREE.BackSide позволяет кликать по внутренней стороне стенок "сквозь" передние */}
        <meshBasicMaterial transparent opacity={0} depthWrite={false} side={THREE.BackSide} />
      </mesh>

      {/* Сам инстанс-меш. Память выделена под максимум частиц заранее */}
      <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_PARTICLES]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#bdc3c7" />
      </instancedMesh>
    </>
  );
}