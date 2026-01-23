import React from "react";
import { useTranslation } from 'react-i18next';

export default function DonorSearch() {
  const { t } = useTranslation();
  return (
    <div style={{ padding: "1rem" }}>
      <h2>{t('donorSearch.title')}</h2>
      <p>{t('donorSearch.description')}</p>
    </div>
  );
}
