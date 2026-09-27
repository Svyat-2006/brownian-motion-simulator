// --- БЛОК 1: ИМПОРТЫ И РЕГИСТРАЦИЯ ---
import { useState } from 'react';
import { useTranslation } from 'react-i18next'; 
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import zoomPlugin from 'chartjs-plugin-zoom';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, zoomPlugin);
ChartJS.defaults.color = '#ccc';

interface ChartsProps {
  history: any[];
  distribution: number[];
  maxSpeed: number;
}

export default function Charts({ history, distribution, maxSpeed }: ChartsProps) {
  const { t } = useTranslation(); 
  
  // Состояние: развернут ли график ('line', 'bar' или null)
  const [expanded, setExpanded] = useState<'line' | 'bar' | null>(null);
  
  // --- БЛОК 2: ДАННЫЕ ГРАФИКОВ ---
  const lineData = {
    // Подписи считаются от конца массива (Сейчас) к началу (-49)
    labels: history.map((_, i) => {
      const offset = history.length - 1 - i;
      return offset === 0 ? t('charts.now') : `-${offset}`;
    }),
    datasets: [
      { label: t('charts.full'), data: history.map(h => h.EkTotal), borderColor: '#e74c3c', borderWidth: 2, pointRadius: 0, tension: 0.2 },
      { label: t('charts.x'), data: history.map(h => h.Ekx), borderColor: '#3498db', borderWidth: 1, pointRadius: 0, tension: 0.2 },
      { label: t('charts.y'), data: history.map(h => h.Eky), borderColor: '#2ecc71', borderWidth: 1, pointRadius: 0, tension: 0.2 },
      { label: t('charts.z'), data: history.map(h => h.Ekz), borderColor: '#f1c40f', borderWidth: 1, pointRadius: 0, tension: 0.2 }
    ]
  };

  const barData = {
    // Динамическое подстраивание оси Х на основе реальной maxSpeed
    labels: distribution.map((_, i) => (i * (maxSpeed / distribution.length)).toFixed(3)),
    datasets: [{ label: t('charts.pCount'), data: distribution, backgroundColor: '#9b59b6' }]
  };

  // --- БЛОК 3: НАСТРОЙКИ И ПЛАГИН ЗУМА ---
  const zoomConfig = {
    pan: { enabled: true, mode: 'xy' as const },
    zoom: { wheel: { enabled: true, speed: 0.1 }, pinch: { enabled: true }, mode: 'xy' as const }
  };

  const lineOptions = {
    responsive: true,
    animation: { duration: 0 as const },
    scales: {
      x: { title: { display: true, text: t('charts.time'), color: '#aaa' } },
      y: { beginAtZero: true, title: { display: true, text: t('charts.energy'), color: '#aaa' } }
    },
    plugins: { legend: { labels: { boxWidth: 10, font: { size: 10 } } }, zoom: zoomConfig }
  };

  const barOptions = {
    responsive: true,
    animation: { duration: 0 as const },
    scales: {
      x: { title: { display: true, text: t('charts.speed'), color: '#aaa' } },
      y: { beginAtZero: true, title: { display: true, text: t('charts.molecules'), color: '#aaa' } }
    },
    plugins: { legend: { display: false }, zoom: zoomConfig }
  };

  // maintainAspectRatio: false позволяет графику в модальном окне растянуться на весь экран
  const expandedLineOptions = { ...lineOptions, maintainAspectRatio: false };
  const expandedBarOptions = { ...barOptions, maintainAspectRatio: false };

  // --- БЛОК 4: ФУНКЦИЯ РЕНДЕРА МОДАЛЬНОГО ОКНА ---
  const renderExpandedModal = () => {
    if (!expanded) return null;

    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ background: '#2c3e50', padding: '20px', borderRadius: '12px', width: '75vw', height: '75vh', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 30px rgba(0,0,0,0.8)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2 style={{ margin: 0, color: 'white' }}>{expanded === 'line' ? t('charts.eTitle') : t('charts.maxwellTitle')}</h2>
            <button onClick={() => setExpanded(null)} style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
              {t('buttons.close')}
            </button>
          </div>
          <div style={{ flex: 1, position: 'relative' }}>
            {expanded === 'line' && <Line data={lineData} options={expandedLineOptions} />}
            {expanded === 'bar' && <Bar data={barData} options={expandedBarOptions} />}
          </div>
        </div>
      </div>
    );
  };

  // --- БЛОК 5: ГЛАВНЫЙ РЕНДЕР ПАНЕЛИ ---
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h4 style={{ margin: 0, fontSize: '13px', color: '#ecf0f1' }}>{t('charts.eTitle')}</h4>
          <button onClick={() => setExpanded('line')} style={{ background: 'none', border: 'none', color: '#3498db', cursor: 'pointer', fontSize: '16px' }} title="Развернуть">⛶</button>
        </div>
        <Line data={lineData} options={lineOptions} />
      </div>

      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h4 style={{ margin: '0', fontSize: '13px', color: '#ecf0f1' }}>{t('charts.maxwellTitle')}</h4>
          <button onClick={() => setExpanded('bar')} style={{ background: 'none', border: 'none', color: '#3498db', cursor: 'pointer', fontSize: '16px' }} title="Развернуть">⛶</button>
        </div>
        <Bar data={barData} options={barOptions} />
      </div>

      {renderExpandedModal()}
    </div>
  );
}