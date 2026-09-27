// --- БЛОК 1: ИМПОРТЫ ---
import { useState, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { useTranslation } from 'react-i18next'; 
import Scene from './Scene';
import Charts from './Charts';
import Theory from './Theory';
import './App.css';

function App() {
  const { t, i18n } = useTranslation();

  // --- БЛОК 2: СОСТОЯНИЯ UI И ФИЗИКИ ---
  const [activeTab, setActiveTab] = useState<'simulator' | 'theory'>('simulator');
  const [dimension, setDimension] = useState<number>(3);
  const [mass, setMass] = useState<number>(50);
  const [temperature, setTemperature] = useState<number>(1.0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isSpawnMode, setIsSpawnMode] = useState<boolean>(false);
  const [particleCount, setParticleCount] = useState<number>(1000);

  // --- БЛОК 3: СОСТОЯНИЯ ДЛЯ АНАЛИТИКИ (Графики) ---
  const [historySize, setHistorySize] = useState<number>(50);
  const historySizeRef = useRef<number>(50); // Ref для доступа изнутри useCallback
  const [maxParticleSpeed, setMaxParticleSpeed] = useState<number>(0.5);
  const [analyticsHistory, setAnalyticsHistory] = useState<any[]>([]);
  const [speedDistribution, setSpeedDistribution] = useState<number[]>([]);
  const lastUpdateTime = useRef(0); // Троттлинг (ограничение частоты)

  // --- БЛОК 4: ФУНКЦИИ-ОБРАБОТЧИКИ ---
  
  // useCallback замораживает функцию, чтобы Worker не перезапускался при рендере UI
  const handleAnalyticsUpdate = useCallback((data: any) => {
    const now = performance.now();
    // Обновляем UI только раз в 100 мс (10 кадров в секунду)
    if (now - lastUpdateTime.current > 100) {
      lastUpdateTime.current = now;
      setSpeedDistribution(data.speedDistribution);
      setMaxParticleSpeed(data.maxSpeed); 
      
      setAnalyticsHistory(prev => {
        const newHistory = [...prev, data];
        const maxLen = historySizeRef.current;
        // Обрезаем историю графика до заданного лимита
        if (newHistory.length > maxLen) return newHistory.slice(newHistory.length - maxLen);
        return newHistory;
      });
      
      // Синхронизация ползунка частиц с кликами по аквариуму
      setParticleCount(prev => prev !== data.currentCount ? data.currentCount : prev);
    }
  }, []); 

  // При смене 3D/2D/1D мы очищаем графики для "чистого эксперимента"
  const handleDimensionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDimension(Number(e.target.value));
    setAnalyticsHistory([]);
    setParticleCount(1000);
  };

  const handleHistorySizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setHistorySize(val);
    historySizeRef.current = val;
  };

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'ru' ? 'en' : 'ru');
  };

  // --- БЛОК 5: РЕНДЕР ИНТЕРФЕЙСА ---
  return (
    <div className="app-container">
      <div className="sidebar" style={{ overflowY: 'auto' }}>
        
        <button onClick={toggleLanguage} style={{ background: 'transparent', color: '#ecf0f1', border: '1px solid #7f8c8d', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', float: 'right', marginBottom: '10px' }}>
          {i18n.language.toUpperCase()}
        </button>

        <div style={{ display: 'flex', gap: '5px', marginBottom: '20px', clear: 'both' }}>
          <button onClick={() => setActiveTab('simulator')} style={{ flex: 1, padding: '10px', fontWeight: 'bold', cursor: 'pointer', background: activeTab === 'simulator' ? '#3498db' : '#2c3e50', color: 'white', border: 'none', borderRadius: '5px' }}>
            {t('tabs.sim')}
          </button>
          <button onClick={() => { setActiveTab('theory'); setIsPaused(true); }} style={{ flex: 1, padding: '10px', fontWeight: 'bold', cursor: 'pointer', background: activeTab === 'theory' ? '#3498db' : '#2c3e50', color: 'white', border: 'none', borderRadius: '5px' }}>
            {t('tabs.theory')}
          </button>
        </div>

        {/* Панель настроек видна только на вкладке симулятора */}
        {activeTab === 'simulator' && (
          <>
            <h2>{t('settings.title')}</h2>
            
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button onClick={() => setIsPaused(!isPaused)} style={{ flex: 1, padding: '10px', cursor: 'pointer', fontWeight: 'bold', background: isPaused ? '#2ecc71' : '#e74c3c', color: 'white', border: 'none', borderRadius: '5px' }}>
                {isPaused ? t('buttons.resume') : t('buttons.pause')}
              </button>
            </div>

            <button onClick={() => setIsSpawnMode(!isSpawnMode)} style={{ marginTop: '10px', padding: '10px', width: '100%', cursor: 'pointer', fontWeight: 'bold', background: isSpawnMode ? '#3498db' : '#555', color: 'white', border: 'none', borderRadius: '5px' }}>
              {isSpawnMode ? t('buttons.spawnOn') : t('buttons.spawnOff')}
            </button>
            
            <div style={{ marginTop: '15px' }}>
              <label>{t('settings.dim')}</label>
              <select value={dimension} onChange={handleDimensionChange} style={{ width: '100%' }}>
                <option value={3}>{t('dim.d3')}</option>
                <option value={2}>{t('dim.d2')}</option>
                <option value={1}>{t('dim.d1')}</option>
              </select>
            </div>

            {/* Блок ползунков параметров */}
            <div style={{ marginTop: '10px' }}><label>{t('settings.count')} {particleCount}</label><input type="range" min="10" max="10000" step="10" value={particleCount} onChange={(e) => setParticleCount(Number(e.target.value))} style={{ width: '100%' }} /></div>
            <div style={{ marginTop: '10px' }}><label>{t('settings.mass')} {mass}</label><input type="range" min="10" max="300" step="10" value={mass} onChange={(e) => setMass(Number(e.target.value))} style={{ width: '100%' }} /></div>
            <div style={{ marginTop: '10px' }}><label>{t('settings.temp')} {temperature.toFixed(1)}</label><input type="range" min="0.1" max="5.0" step="0.1" value={temperature} onChange={(e) => setTemperature(Number(e.target.value))} style={{ width: '100%' }} /></div>
            <div style={{ marginTop: '10px' }}><label>{t('settings.history')} {historySize}</label><input type="range" min="50" max="1000" step="50" value={historySize} onChange={handleHistorySizeChange} style={{ width: '100%', accentColor: '#9b59b6' }} /></div>

            {/* Графики */}
            <Charts history={analyticsHistory} distribution={speedDistribution} maxSpeed={maxParticleSpeed} />
          </>
        )}
      </div>

      {/* 3D Сцена скрывается через CSS (display: none), чтобы не уничтожать Worker при чтении теории */}
      <div className="canvas-container" style={{ display: activeTab === 'simulator' ? 'block' : 'none' }}>
        <Canvas camera={{ position: [10, 10, 15], fov: 50 }}>
          {/* key={dimension} заставляет React полностью пересоздать сцену при смене размерности */}
          <Scene 
            key={dimension} dimension={dimension} mass={mass} temperature={temperature} 
            isPaused={isPaused} isSpawnMode={isSpawnMode} particleCount={particleCount} 
            onAnalyticsUpdate={handleAnalyticsUpdate} 
          />
        </Canvas>
      </div>
      
      {activeTab === 'theory' && <Theory />}
      
    </div>
  );
}

export default App;