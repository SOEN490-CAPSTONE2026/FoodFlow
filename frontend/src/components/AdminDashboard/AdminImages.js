import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { adminImageAPI } from '../../services/api';
import { foodTypeOptions } from '../../constants/foodConstants';
import './Admin_Styles/AdminImages.css';

const moderationOptions = ['PENDING', 'APPROVED', 'REJECTED', 'DISABLED'];

export default function AdminImages() {
  const { t } = useTranslation();
  const [status, setStatus] = useState('PENDING');
  const [uploads, setUploads] = useState([]);
  const [library, setLibrary] = useState([]);
  const [error, setError] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [foodType, setFoodType] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const getImageUrl = value => {
    if (!value) {
      return null;
    }
    if (
      value.startsWith('http://') ||
      value.startsWith('https://') ||
      value.startsWith('data:')
    ) {
      return value;
    }
    const apiBaseUrl =
      process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';
    const backendBaseUrl = apiBaseUrl.endsWith('/api')
      ? apiBaseUrl.slice(0, -4)
      : apiBaseUrl.replace(/\/api$/, '');
    if (value.startsWith('/api/files/')) {
      return `${backendBaseUrl}${value}`;
    }
    return `${backendBaseUrl}${value.startsWith('/') ? '' : '/'}${value}`;
  };

  const getFoodTypeLabel = value => {
    if (!value) {
      return t('adminImages.fields.generic');
    }
    return t(`foodTypeLabels.${value}`, value);
  };

  const getStatusLabel = value =>
    t(`adminImages.statusOptions.${String(value || '').toLowerCase()}`, value);

  useEffect(() => {
    const load = async () => {
      try {
        setError('');
        const [uploadsResp, libraryResp] = await Promise.all([
          adminImageAPI.getUploads(status),
          adminImageAPI.getLibrary(false),
        ]);
        setUploads(uploadsResp.data || []);
        setLibrary(libraryResp.data || []);
      } catch (err) {
        setError(t('adminImages.errors.loadFailed'));
      }
    };
    load();
  }, [status, refreshKey, t]);

  const moderate = async (id, nextStatus) => {
    if (nextStatus === 'APPROVED') {
      await adminImageAPI.moderateUpload(id, { status: nextStatus });
      setRefreshKey(k => k + 1);
      return;
    }

    const reason = window.prompt(t('adminImages.reasonPrompt')) || '';
    await adminImageAPI.moderateUpload(id, { status: nextStatus, reason });
    setRefreshKey(k => k + 1);
  };

  const addLibrary = async () => {
    if (!foodType) {
      setError(t('adminImages.errors.selectFoodType'));
      return;
    }

    try {
      await adminImageAPI.addLibraryItem({
        file: uploadFile,
        imageUrl,
        foodType,
        active: true,
      });
      setUploadFile(null);
      setImageUrl('');
      setFoodType('');
      setRefreshKey(k => k + 1);
    } catch (err) {
      setError(
        err.response?.data?.message || t('adminImages.errors.addFailed')
      );
    }
  };

  return (
    <div className="admin-images-page">
      <div className="admin-images-header">
        <div className="admin-images-filter">
          <label htmlFor="image-status-filter">
            {t('adminImages.fields.status')}
          </label>
          <select
            id="image-status-filter"
            value={status}
            onChange={e => setStatus(e.target.value)}
          >
            {moderationOptions.map(option => (
              <option key={option} value={option}>
                {getStatusLabel(option)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="admin-images-error">{error}</div>}

      <section className="admin-images-section">
        <div className="admin-images-section-title">
          <h3>{t('adminImages.uploaded.title')}</h3>
          <span className="admin-images-count-pill">
            {t('adminImages.itemsCount', { count: uploads.length })}
          </span>
        </div>
        {uploads.length === 0 ? (
          <div className="admin-images-empty-state">
            {t('adminImages.uploaded.empty')}
          </div>
        ) : (
          <div className="admin-images-grid">
            {uploads.map(item => (
              <article key={item.id} className="admin-image-card">
                <img
                  src={getImageUrl(item.url)}
                  alt={t('adminImages.uploaded.alt', { id: item.id })}
                  className="admin-image-card-preview"
                />
                <div className="admin-image-card-body">
                  <div className="admin-image-card-meta">
                    <div className="admin-image-meta-row">
                      <span className="admin-image-meta-label">
                        {t('adminImages.fields.id')}
                      </span>
                      <span className="admin-image-meta-value">#{item.id}</span>
                    </div>
                    <div className="admin-image-meta-row">
                      <span className="admin-image-meta-label">
                        {t('adminImages.fields.foodType')}
                      </span>
                      <span className="admin-image-meta-value">
                        {getFoodTypeLabel(item.foodType)}
                      </span>
                    </div>
                    <div className="admin-image-meta-row">
                      <span className="admin-image-meta-label">
                        {t('adminImages.fields.donor')}
                      </span>
                      <span className="admin-image-meta-value">
                        {item.donorName ||
                          item.donorEmail ||
                          (item.donorId ? `#${item.donorId}` : '-')}
                      </span>
                    </div>
                    <div className="admin-image-meta-row">
                      <span className="admin-image-meta-label">
                        {t('adminImages.fields.status')}
                      </span>
                      <span
                        className={`admin-image-status admin-image-status-${(item.status || '').toLowerCase()}`}
                      >
                        {getStatusLabel(item.status)}
                      </span>
                    </div>
                    <div className="admin-image-meta-row">
                      <span className="admin-image-meta-label">
                        {t('adminImages.fields.reason')}
                      </span>
                      <span className="admin-image-meta-value">
                        {item.reason || t('adminImages.fields.none')}
                      </span>
                    </div>
                  </div>
                  <div className="admin-image-actions">
                    <button
                      type="button"
                      className="btn-action approve"
                      onClick={() => moderate(item.id, 'APPROVED')}
                    >
                      {t('adminImages.actions.approve')}
                    </button>
                    <button
                      type="button"
                      className="btn-action reject"
                      onClick={() => moderate(item.id, 'REJECTED')}
                    >
                      {t('adminImages.actions.reject')}
                    </button>
                    <button
                      type="button"
                      className="btn-action disable"
                      onClick={() => moderate(item.id, 'DISABLED')}
                    >
                      {t('adminImages.actions.disable')}
                    </button>
                    <button
                      type="button"
                      className="btn-action delete"
                      onClick={async () => {
                        await adminImageAPI.deleteUpload(item.id);
                        setRefreshKey(k => k + 1);
                      }}
                    >
                      {t('adminImages.actions.delete')}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="admin-images-section">
        <div className="admin-images-section-title">
          <h3>{t('adminImages.library.title')}</h3>
          <span className="admin-images-count-pill">
            {t('adminImages.itemsCount', { count: library.length })}
          </span>
        </div>
        <div className="admin-library-toolbar">
          <div className="toolbar-file">
            <label htmlFor="library-file">
              {t('adminImages.library.uploadImage')}
            </label>
            <input
              id="library-file"
              type="file"
              onChange={e => setUploadFile(e.target.files?.[0] || null)}
            />
          </div>
          <div className="toolbar-field">
            <label htmlFor="library-image-url">
              {t('adminImages.library.orImageUrl')}
            </label>
            <input
              id="library-image-url"
              type="text"
              placeholder="https://..."
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
            />
          </div>
          <div className="toolbar-field">
            <label htmlFor="library-food-type">
              {t('adminImages.fields.foodType')}
            </label>
            <select
              id="library-food-type"
              value={foodType}
              onChange={e => setFoodType(e.target.value)}
            >
              <option value="">
                {t('adminImages.library.selectCategory')}
              </option>
              {foodTypeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {t(`foodTypeLabels.${option.value}`, option.label)}
                </option>
              ))}
            </select>
          </div>
          <button type="button" className="btn-action add" onClick={addLibrary}>
            {t('adminImages.actions.add')}
          </button>
        </div>

        {library.length === 0 ? (
          <div className="admin-images-empty-state">
            {t('adminImages.library.empty')}
          </div>
        ) : (
          <div className="admin-images-grid">
            {library.map(item => (
              <article key={item.id} className="admin-image-card">
                <img
                  src={getImageUrl(item.url)}
                  alt={t('adminImages.library.alt', { id: item.id })}
                  className="admin-image-card-preview"
                />
                <div className="admin-image-card-body">
                  <div className="admin-image-card-meta">
                    <div className="admin-image-meta-row">
                      <span className="admin-image-meta-label">
                        {t('adminImages.fields.id')}
                      </span>
                      <span className="admin-image-meta-value">#{item.id}</span>
                    </div>
                    <div className="admin-image-meta-row">
                      <span className="admin-image-meta-label">
                        {t('adminImages.fields.foodType')}
                      </span>
                      <span className="admin-image-meta-value">
                        {getFoodTypeLabel(item.foodType)}
                      </span>
                    </div>
                    <div className="admin-image-meta-row">
                      <span className="admin-image-meta-label">
                        {t('adminImages.fields.active')}
                      </span>
                      <span className="admin-image-meta-value">
                        {item.active
                          ? t('adminImages.fields.yes')
                          : t('adminImages.fields.no')}
                      </span>
                    </div>
                  </div>
                  <div className="admin-image-actions">
                    <button
                      type="button"
                      className="btn-action disable"
                      onClick={async () => {
                        await adminImageAPI.patchLibraryItem(
                          item.id,
                          !item.active
                        );
                        setRefreshKey(k => k + 1);
                      }}
                    >
                      {item.active
                        ? t('adminImages.actions.deactivate')
                        : t('adminImages.actions.activate')}
                    </button>
                    <button
                      type="button"
                      className="btn-action delete"
                      onClick={async () => {
                        await adminImageAPI.deleteLibraryItem(item.id);
                        setRefreshKey(k => k + 1);
                      }}
                    >
                      {t('adminImages.actions.remove')}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
