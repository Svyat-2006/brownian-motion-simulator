// --- БЛОК 1: ИМПОРТЫ И НАСТРОЙКА ---
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// --- БЛОК 2: СЛОВАРИ (JSON-объекты с переводами) ---
const resources = {
  ru: {
    translation: {
      tabs: { sim: 'Симулятор', theory: 'Теория' },
      settings: { 
        title: 'Настройки', dim: 'Размерность движения:', mass: 'Масса броун. частицы:', 
        temp: 'Температура:', count: 'Число молекул:', history: 'Кадров на графике:' 
      },
      buttons: { 
        pause: '⏸ Пауза', resume: '▶ Возобновить', 
        spawnOn: '🟢 Спавн по клику: ВКЛ', spawnOff: '⚪ Спавн по клику: ВЫКЛ', 
        close: 'Закрыть ✖' 
      },
      dim: { d3: '3D (Шарик)', d2: '2D (Цилиндр)', d1: '1D (Поршень-плоскость)' },
      charts: { 
        eTitle: 'Энергия броуновской частицы', maxwellTitle: 'Распределение Максвелла', 
        full: 'Полная', x: 'Ось X', y: 'Ось Y', z: 'Ось Z', 
        time: 'Относительное время (кадры)', energy: 'Кинетическая энергия (E)', 
        speed: 'Скорость (v)', molecules: 'Молекулы (N)', pCount: 'Количество частиц', now: 'Сейчас' 
      },
      theory: {
        title: 'Физическая модель системы',
        h1: '1. Броуновское движение',
        p1: 'Броуновское движение — это беспорядочное движение микроскопических видимых взвешенных частиц в газе или жидкости. Оно вызывается тепловым движением молекул среды, которые непрерывно сталкиваются с крупной частицей со всех сторон.',
        h2: '2. Теорема о равнораспределении энергии',
        p2: 'Согласно классической статистической механике, в состоянии теплового равновесия средняя кинетическая энергия, приходящаяся на каждую независимую степень свободы системы, равна kT/2.',
        l1: '3D (Сфера): 3 степени свободы. Энергия распределяется по осям X, Y, Z.',
        l2: '2D (Цилиндр): 2 степени свободы. Движение по оси Y заблокировано.',
        l3: '1D (Поршень): 1 степень свободы. Система совершает работу только вдоль оси X.',
        h3: '3. Идеальный газ и давление',
        p3: 'Множество малых частиц в нашем симуляторе моделирует идеальный газ. Давление, оказываемое на стенки сосуда и поршень, определяется основным уравнением МКТ: p = nkT. При добавлении новых молекул в один из отсеков давление возрастает, заставляя поршень смещаться.'
      }
    }
  },
  en: {
    translation: {
      tabs: { sim: 'Simulator', theory: 'Theory' },
      settings: { 
        title: 'Settings', dim: 'Movement Dimension:', mass: 'Brownian Mass:', 
        temp: 'Temperature:', count: 'Molecules Count:', history: 'Chart Frames:' 
      },
      buttons: { 
        pause: '⏸ Pause', resume: '▶ Resume', 
        spawnOn: '🟢 Click Spawn: ON', spawnOff: '⚪ Click Spawn: OFF', 
        close: 'Close ✖' 
      },
      dim: { d3: '3D (Sphere)', d2: '2D (Cylinder)', d1: '1D (Piston-Plane)' },
      charts: { 
        eTitle: 'Brownian Particle Energy', maxwellTitle: 'Maxwell Distribution', 
        full: 'Total', x: 'X Axis', y: 'Y Axis', z: 'Z Axis', 
        time: 'Relative Time (frames)', energy: 'Kinetic Energy (E)', 
        speed: 'Speed (v)', molecules: 'Molecules (N)', pCount: 'Particle Count', now: 'Now' 
      },
      theory: {
        title: 'Physical Model of the System',
        h1: '1. Brownian Motion',
        p1: 'Brownian motion is the random motion of microscopic particles suspended in a liquid or gas. It is caused by the thermal motion of the medium\'s molecules continuously colliding with the large particle.',
        h2: '2. Equipartition Theorem',
        p2: 'According to classical statistical mechanics, in thermal equilibrium, the average kinetic energy associated with each independent degree of freedom of the system equals kT/2.',
        l1: '3D (Sphere): 3 degrees of freedom. Energy is distributed across X, Y, Z axes.',
        l2: '2D (Cylinder): 2 degrees of freedom. Movement along the Y axis is blocked.',
        l3: '1D (Piston): 1 degree of freedom. The system performs work only along the X axis.',
        h3: '3. Ideal Gas and Pressure',
        p3: 'The multitude of small particles in our simulator models an ideal gas. The pressure exerted on the vessel walls and piston is determined by the ideal gas law: p = nkT. Adding new molecules to one compartment increases the pressure, causing the piston to shift.'
      }
    }
  }
};

// --- БЛОК 3: ИНИЦИАЛИЗАЦИЯ i18next ---
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ru', // Язык при запуске
    fallbackLng: 'ru', // Резервный язык
    interpolation: { escapeValue: false } // Отключаем экранирование (React сам защищает от XSS)
  });

export default i18n;