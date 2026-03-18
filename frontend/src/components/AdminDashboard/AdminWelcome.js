import React from 'react';
import { useTranslation } from 'react-i18next';

export default function AdminWelcome() {
  const { t } = useTranslation();

  return (
    <div className="admin-welcome">
      <h2>{t('adminWelcome.title')}</h2>
      <p>{t('adminWelcome.description')}</p>
    </div>
  );
}
