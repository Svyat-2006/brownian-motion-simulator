import { useTranslation } from 'react-i18next';

export default function Theory() {
  const { t } = useTranslation();

  return (
    <div style={{ flex: 1, padding: '40px', overflowY: 'auto', backgroundColor: '#1e1e1e', color: '#ecf0f1', lineHeight: '1.6' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ color: '#3498db', borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>
          {t('theory.title')}
        </h1>
        
        <h2 style={{ marginTop: '30px', color: '#e74c3c' }}>{t('theory.h1')}</h2>
        <p>{t('theory.p1')}</p>

        <h2 style={{ marginTop: '30px', color: '#2ecc71' }}>{t('theory.h2')}</h2>
        <p>{t('theory.p2')}</p>
        <ul>
          <li>{t('theory.l1')}</li>
          <li>{t('theory.l2')}</li>
          <li>{t('theory.l3')}</li>
        </ul>

        <h2 style={{ marginTop: '30px', color: '#f1c40f' }}>{t('theory.h3')}</h2>
        <p>{t('theory.p3')}</p>
      </div>
    </div>
  );
}