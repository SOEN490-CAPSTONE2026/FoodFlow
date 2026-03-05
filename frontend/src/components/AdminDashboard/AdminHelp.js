import React from 'react';
import { useTranslation } from 'react-i18next';

export default function AdminHelp() {
  const { t } = useTranslation();

  return (
    <div className="admin-help">
      <h2>{t('adminHelp.title')}</h2>
    </div>
  );
}
