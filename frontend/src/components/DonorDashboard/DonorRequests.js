import React from 'react';
import { useTranslation } from 'react-i18next';

export default function DonorRequests() {
  const { t } = useTranslation();
  return (
    <div style={{ padding: '1rem' }}>
      <h2>{t('donorRequests.title')}</h2>
      <p>{t('donorRequests.description')}</p>
    </div>
  );
}
