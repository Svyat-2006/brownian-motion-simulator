// --- БЛОК 1: ГЛОБАЛЬНЫЕ ПАРАМЕТРЫ СИСТЕМЫ ---
let count = 0;
const MAX_PARTICLES = 10000; 
// Оптимизация: Плоские одномерные массивы работают в V8 (движке JS) быстрее, чем массивы объектов
let positions = new Float32Array(MAX_PARTICLES * 3);
let velocities = new Float32Array(MAX_PARTICLES * 3);

const r = 0.1; // Радиус малой частицы
const m = 1;   // Масса малой частицы
const boundary = 5.0; // Границы сосуда (-5 до 5)

const R = 1.0;
let M = 50;
let bigPos = new Float32Array([0, 0, 0]);
let bigVel = new Float32Array([0, 0, 0]);
let dimensionMode = 3; 

// Параметры для Spatial Hash Grid (разбиение пространства на кубики для поиска коллизий)
const cellSize = r * 2;
const gridCells = Math.ceil((boundary * 2) / cellSize);

let currentTemperature = 1.0;
let isPaused = false;

// --- БЛОК 2: ПРИЕМ СООБЩЕНИЙ ИЗ REACT ---
self.onmessage = (event) => {
  const { type, payload } = event.data;

  if (type === 'INIT') {
    count = payload.count;
    for (let i = 0; i < count * 3; i++) {
      positions[i] = payload.positions[i];
      velocities[i] = (Math.random() - 0.5) * 0.15; 
    }
    // Запуск главного физического цикла (примерно 60 раз в сек)
    setInterval(() => { if (!isPaused) calculatePhysics(); }, 16);
  }
  else if (type === 'UPDATE_PARAMS') {
    dimensionMode = payload.dimension;
    M = payload.mass;
    if (payload.temperature !== currentTemperature) {
      // Масштабируем скорости без сброса направлений (изменение температуры)
      const velocityScale = Math.sqrt(payload.temperature / currentTemperature);
      for (let i = 0; i < count * 3; i++) velocities[i] *= velocityScale;
      currentTemperature = payload.temperature;
    }
  }
  else if (type === 'SET_PAUSE') isPaused = payload;
  else if (type === 'ADD_PARTICLES') {
    // Взрыв частиц в заданной точке клика
    const { amount, x, y, z } = payload;
    const newCount = Math.min(count + amount, MAX_PARTICLES);
    const velocityScale = Math.sqrt(currentTemperature);

    for (let i = count; i < newCount; i++) {
      const idx = i * 3;
      // Спавн облаком, а не в одной точке (предотвращает сингулярность и бесконечную плотность)
      positions[idx] = x + (Math.random() - 0.5);
      positions[idx + 1] = y + (Math.random() - 0.5);
      positions[idx + 2] = z + (Math.random() - 0.5);

      velocities[idx] = (Math.random() - 0.5) * 0.15 * velocityScale;
      velocities[idx + 1] = (Math.random() - 0.5) * 0.15 * velocityScale;
      velocities[idx + 2] = (Math.random() - 0.5) * 0.15 * velocityScale;
    }
    count = newCount;
  }
  else if (type === 'SET_COUNT') {
    // Равномерное добавление/удаление молекул (работает мгновенно O(1))
    const targetCount = Math.min(Math.max(payload, 10), MAX_PARTICLES);
    if (targetCount > count) {
      const velocityScale = Math.sqrt(currentTemperature);
      for (let i = count; i < targetCount; i++) {
        const idx = i * 3;
        positions[idx] = (Math.random() - 0.5) * 9.6;
        positions[idx + 1] = (Math.random() - 0.5) * 9.6;
        positions[idx + 2] = (Math.random() - 0.5) * 9.6;
        velocities[idx] = (Math.random() - 0.5) * 0.15 * velocityScale;
        velocities[idx + 1] = (Math.random() - 0.5) * 0.15 * velocityScale;
        velocities[idx + 2] = (Math.random() - 0.5) * 0.15 * velocityScale;
      }
    }
    count = targetCount;
  }
};

// Функция определения ячейки (хеш-ключа) для молекулы
function getGridKey(x: number, y: number, z: number) {
  const ix = Math.floor((x + boundary) / cellSize);
  const iy = Math.floor((y + boundary) / cellSize);
  const iz = Math.floor((z + boundary) / cellSize);
  return ix + iy * gridCells + iz * gridCells * gridCells;
}

// --- БЛОК 3: ГЛАВНЫЙ ФИЗИЧЕСКИЙ ЦИКЛ ---
function calculatePhysics() {
  // 1. Построение пространственной сетки (O(N))
  const grid = new Map<number, number[]>();
  for (let i = 0; i < count; i++) {
    const idx = i * 3;
    const key = getGridKey(positions[idx], positions[idx+1], positions[idx+2]);
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key)!.push(i);
  }

  // 2. Движение и столкновения малых частиц
  for (let i = 0; i < count; i++) {
    const idx = i * 3;
    positions[idx] += velocities[idx];
    positions[idx+1] += velocities[idx+1];
    positions[idx+2] += velocities[idx+2];

    // Отскок от стенок сосуда
    for (let j = 0; j < 3; j++) {
      if (Math.abs(positions[idx+j]) > boundary - r) {
        positions[idx+j] = Math.sign(positions[idx+j]) * (boundary - r);
        velocities[idx+j] *= -1;
      }
    }

    // Проверяем коллизии только с соседями по ячейке сетки (Огромный прирост FPS)
    const key = getGridKey(positions[idx], positions[idx+1], positions[idx+2]);
    const cell = grid.get(key);
    if (cell) {
      for (const j of cell) {
        if (i >= j) continue; 
        checkAndResolveCollision(i, j);
      }
    }
    checkBigParticleCollision(i);
  }

  // 3. Движение большой частицы и применение ограничений размерности
  for (let j = 0; j < 3; j++) {
    bigPos[j] += bigVel[j];
    if (Math.abs(bigPos[j]) > boundary - R) {
      bigPos[j] = Math.sign(bigPos[j]) * (boundary - R);
      bigVel[j] *= -1;
    }
  }

  // Принудительное зануление скоростей по заблокированным осям
  if (dimensionMode === 2) bigVel[1] = 0;
  if (dimensionMode === 1) { bigVel[1] = 0; bigVel[2] = 0; }

  // --- БЛОК 4: АНАЛИТИКА ---
  const Ekx = 0.5 * M * bigVel[0] * bigVel[0];
  const Eky = 0.5 * M * bigVel[1] * bigVel[1];
  const Ekz = 0.5 * M * bigVel[2] * bigVel[2];
  const EkTotal = Ekx + Eky + Ekz;

  let actualMaxSpeed = 0.0001; 
  const speeds = new Float32Array(count); 
  // Находим реальную максимальную скорость для масштабирования гистограммы
  for (let i = 0; i < count; i++) {
    const idx = i * 3;
    const speed = Math.sqrt(velocities[idx]**2 + velocities[idx+1]**2 + velocities[idx+2]**2);
    speeds[i] = speed;
    if (speed > actualMaxSpeed) actualMaxSpeed = speed;
  }

  const binsCount = 20;
  const speedDistribution = new Array(binsCount).fill(0);
  for (let i = 0; i < count; i++) {
    let binIndex = Math.floor((speeds[i] / actualMaxSpeed) * binsCount);
    if (binIndex >= binsCount) binIndex = binsCount - 1; 
    speedDistribution[binIndex]++;
  }

  // Отправляем всё в React
  self.postMessage({ 
    type: 'UPDATE', positions, bigPos, count, 
    analytics: { Ekx, Eky, Ekz, EkTotal, speedDistribution, currentCount: count, maxSpeed: actualMaxSpeed }
  });
}

// --- БЛОК 5: МАТЕМАТИКА СТОЛКНОВЕНИЙ ---
// Упругое столкновение одинаковых масс
function checkAndResolveCollision(i: number, j: number) {
  const idxI = i * 3, idxJ = j * 3;
  const dx = positions[idxI] - positions[idxJ];
  const dy = positions[idxI+1] - positions[idxJ+1];
  const dz = positions[idxI+2] - positions[idxJ+2];
  const distSq = dx*dx + dy*dy + dz*dz;

  if (distSq < (r + r) * (r + r)) {
    const dist = Math.sqrt(distSq);
    const nx = dx / dist, ny = dy / dist, nz = dz / dist;
    const p = 2 * (velocities[idxI]*nx + velocities[idxI+1]*ny + velocities[idxI+2]*nz - 
                  (velocities[idxJ]*nx + velocities[idxJ+1]*ny + velocities[idxJ+2]*nz)) / (m + m);

    velocities[idxI] -= p * m * nx; velocities[idxI+1] -= p * m * ny; velocities[idxI+2] -= p * m * nz;
    velocities[idxJ] += p * m * nx; velocities[idxJ+1] += p * m * ny; velocities[idxJ+2] += p * m * nz;

    // Расталкивание для предотвращения "залипания"
    const overlap = 0.5 * ((r + r) - dist);
    positions[idxI] += nx * overlap; positions[idxI+1] += ny * overlap; positions[idxI+2] += nz * overlap;
    positions[idxJ] -= nx * overlap; positions[idxJ+1] -= ny * overlap; positions[idxJ+2] -= nz * overlap;
  }
}

// Упругое столкновение малой частицы с большим объектом разной геометрии
function checkBigParticleCollision(i: number) {
  const idx = i * 3;
  const dx = positions[idx] - bigPos[0];
  const dy = positions[idx+1] - bigPos[1];
  const dz = positions[idx+2] - bigPos[2];

  let nx = 0, ny = 0, nz = 0;
  let distSq = 0;
  let isCollision = false;

  if (dimensionMode === 3) {
    distSq = dx*dx + dy*dy + dz*dz;
    if (distSq < (r + R) * (r + R)) {
      isCollision = true;
      const dist = Math.sqrt(distSq);
      nx = dx / dist; ny = dy / dist; nz = dz / dist;
    }
  } 
  else if (dimensionMode === 2) {
    distSq = dx*dx + dz*dz;
    if (distSq < (r + R) * (r + R)) {
      isCollision = true;
      const dist = Math.sqrt(distSq);
      nx = dx / dist; ny = 0; nz = dz / dist;
    }
  } 
  else if (dimensionMode === 1) {
    if (Math.abs(dx) < (r + R)) {
      isCollision = true;
      nx = Math.sign(dx) || 1; ny = 0; nz = 0;
    }
  }

  if (isCollision) {
    const dvx = velocities[idx] - bigVel[0];
    const dvy = velocities[idx+1] - bigVel[1];
    const dvz = velocities[idx+2] - bigVel[2];
    
    const dotProduct = dvx*nx + dvy*ny + dvz*nz;
    if (dotProduct > 0) return; // Частицы уже разлетаются, удар не нужен

    const impulse = (2 * dotProduct) / (m + M);
    velocities[idx] -= impulse * M * nx; velocities[idx+1] -= impulse * M * ny; velocities[idx+2] -= impulse * M * nz;
    bigVel[0] += impulse * m * nx; bigVel[1] += impulse * m * ny; bigVel[2] += impulse * m * nz;
    
    // Расталкивание с учетом геометрии объекта
    if (dimensionMode === 3) {
      const overlap = (r + R) - Math.sqrt(distSq);
      positions[idx] += nx * overlap; positions[idx+1] += ny * overlap; positions[idx+2] += nz * overlap;
    } else if (dimensionMode === 2) {
      const overlap = (r + R) - Math.sqrt(distSq);
      positions[idx] += nx * overlap; positions[idx+2] += nz * overlap;
    } else if (dimensionMode === 1) {
      const overlap = (r + R) - Math.abs(dx);
      positions[idx] += nx * overlap;
    }
  }
}