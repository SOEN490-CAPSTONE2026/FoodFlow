import React from 'react';
import { useTranslation } from 'react-i18next';

export default function AdminCalendar() {
  const { t } = useTranslation();

  return (
    <div className="admin-calendar">
      <h2>{t('adminCalendar.title')}</h2>
    </div>
  );
}
