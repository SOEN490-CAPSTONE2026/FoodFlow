import React, { useEffect, useMemo, useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import {
  donorPhotoSettingsAPI,
  imageAPI,
  imageLibraryAPI,
} from '../../services/api';
import { foodTypeOptions } from '../../constants/foodConstants';
import './Donor_Styles/DonorPhotoPreferencesSection.css';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024;

function validateImage(file) {
  if (!file) {
    return 'Image file is required.';
  }
  if (!ALLOWED_TYPES.includes((file.type || '').toLowerCase())) {
    return 'Only JPEG, PNG and WEBP images are allowed.';
  }
  if (file.size > MAX_SIZE) {
    return 'Image must be 5MB or less.';
  }
  return null;
}

function toAbsoluteImageUrl(imageUrl) {
  if (!imageUrl) {
    return null;
  }
  if (
    imageUrl.startsWith('http://') ||
    imageUrl.startsWith('https://') ||
    imageUrl.startsWith('data:')
  ) {
    return imageUrl;
  }
  const apiBaseUrl =
    process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';
  const backendBaseUrl = apiBaseUrl.endsWith('/api')
    ? apiBaseUrl.slice(0, -4)
    : apiBaseUrl.replace(/\/api$/, '');
  if (imageUrl.startsWith('/api/files/')) {
    return `${backendBaseUrl}${imageUrl}`;
  }
  return `${backendBaseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
}

export default function DonorPhotoPreferencesSection() {
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    displayType: 'SINGLE',
    singleImageId: null,
    singleImageUrl: null,
    singleLibraryImageId: null,
    singleLibraryImageUrl: null,
    perFoodTypeMap: {},
    perFoodTypeUrls: {},
    perFoodTypeLibraryMap: {},
    perFoodTypeLibraryUrls: {},
  });
  const [library, setLibrary] = useState([]);
  const [uploadingKey, setUploadingKey] = useState('');
  const [pendingUploadByKey, setPendingUploadByKey] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [settingsResp, libraryResp] = await Promise.all([
          donorPhotoSettingsAPI.get(),
          imageLibraryAPI.list(true),
        ]);
        setSettings(prev => ({ ...prev, ...(settingsResp.data || {}) }));
        setLibrary(Array.isArray(libraryResp.data) ? libraryResp.data : []);
      } catch (err) {
        setError('Failed to load photo display preferences.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const libraryByFoodType = useMemo(() => {
    const grouped = {};
    library.forEach(item => {
      const key = item.foodType || 'GENERIC';
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });
    return grouped;
  }, [library]);

  const handleUpload = async (file, foodTypeKey = null) => {
    const validationError = validateImage(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setSuccess('');
    setUploadingKey(foodTypeKey || 'single');
    try {
      const uploadResp = await imageAPI.upload(file, { foodType: foodTypeKey });
      const image = uploadResp?.data?.image;
      if (!image?.id) {
        throw new Error('Upload did not return image id');
      }
      setSettings(prev => {
        if (foodTypeKey) {
          return {
            ...prev,
            perFoodTypeMap: {
              ...(prev.perFoodTypeMap || {}),
              [foodTypeKey]: image.id,
            },
            perFoodTypeUrls: {
              ...(prev.perFoodTypeUrls || {}),
              [foodTypeKey]: image.url,
            },
            perFoodTypeLibraryMap: {
              ...(prev.perFoodTypeLibraryMap || {}),
              [foodTypeKey]: null,
            },
            perFoodTypeLibraryUrls: {
              ...(prev.perFoodTypeLibraryUrls || {}),
              [foodTypeKey]: null,
            },
          };
        }
        return {
          ...prev,
          singleImageId: image.id,
          singleImageUrl: image.url,
          singleLibraryImageId: null,
          singleLibraryImageUrl: null,
        };
      });
      setPendingUploadByKey(prev => ({
        ...prev,
        [foodTypeKey || 'single']: true,
      }));
      setSuccess(
        'Image uploaded. Save preferences to apply. Receiver cards display uploaded photos after admin approval.'
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Image upload failed.');
    } finally {
      setUploadingKey('');
    }
  };

  const selectLibraryImage = (foodTypeKey, libraryImage) => {
    setSettings(prev => {
      if (foodTypeKey) {
        return {
          ...prev,
          perFoodTypeLibraryMap: {
            ...(prev.perFoodTypeLibraryMap || {}),
            [foodTypeKey]: libraryImage.id,
          },
          perFoodTypeLibraryUrls: {
            ...(prev.perFoodTypeLibraryUrls || {}),
            [foodTypeKey]: libraryImage.url,
          },
          perFoodTypeMap: {
            ...(prev.perFoodTypeMap || {}),
            [foodTypeKey]: null,
          },
          perFoodTypeUrls: {
            ...(prev.perFoodTypeUrls || {}),
            [foodTypeKey]: null,
          },
        };
      }
      return {
        ...prev,
        singleLibraryImageId: libraryImage.id,
        singleLibraryImageUrl: libraryImage.url,
        singleImageId: null,
        singleImageUrl: null,
      };
    });
    setPendingUploadByKey(prev => ({
      ...prev,
      [foodTypeKey || 'single']: false,
    }));
  };

  const save = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      const payload = {
        displayType: settings.displayType,
        singleImageId: settings.singleImageId || null,
        singleLibraryImageId: settings.singleLibraryImageId || null,
        perFoodTypeMap: settings.perFoodTypeMap || {},
        perFoodTypeLibraryMap: settings.perFoodTypeLibraryMap || {},
      };
      const resp = await donorPhotoSettingsAPI.update(payload);
      setSettings(prev => ({ ...prev, ...(resp.data || {}) }));
      setSuccess('Photo display preferences saved.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save preferences.');
    } finally {
      setSaving(false);
    }
  };

  const selectedCount =
    settings.displayType === 'SINGLE'
      ? Number(Boolean(settings.singleImageId || settings.singleLibraryImageId))
      : Object.values(settings.perFoodTypeMap || {}).filter(Boolean).length +
        Object.values(settings.perFoodTypeLibraryMap || {}).filter(Boolean)
          .length;

  if (loading) {
    return (
      <div className="settings-section">
        <div className="section-content">Loading photo preferences...</div>
      </div>
    );
  }

  return (
    <div className="settings-section donor-photo-section">
      <div className="section-header-with-icon donor-photo-header">
        <div className="icon-circle">
          <ImageIcon size={24} />
        </div>
        <div className="section-title-group donor-photo-title">
          <h2>Display Preferences</h2>
          <p className="section-description">
            {settings.displayType === 'SINGLE'
              ? 'Mode: Single photo'
              : 'Mode: Per food type'}{' '}
            • {selectedCount} image{selectedCount === 1 ? '' : 's'} selected
          </p>
        </div>
        <button
          type="button"
          className="donor-photo-toggle-btn"
          onClick={() => setIsExpanded(prev => !prev)}
          aria-expanded={isExpanded}
          aria-label="Toggle display preferences"
        >
          {isExpanded ? 'Hide' : 'Edit'} {isExpanded ? '▲' : '▼'}
        </button>
      </div>
      {isExpanded && (
        <div className="section-content donor-photo-content">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="notification-list donor-display-mode-list">
            <label className="notification-item donor-display-mode-item">
              <div className="notification-info">
                <h4 className="notification-title">
                  Single photo for all donations
                </h4>
              </div>
              <input
                type="radio"
                aria-label="Single photo for all donations"
                name="displayType"
                checked={settings.displayType === 'SINGLE'}
                onChange={() =>
                  setSettings(prev => ({ ...prev, displayType: 'SINGLE' }))
                }
              />
            </label>
            <label className="notification-item donor-display-mode-item">
              <div className="notification-info">
                <h4 className="notification-title">Photo per food type</h4>
              </div>
              <input
                type="radio"
                aria-label="Photo per food type"
                name="displayType"
                checked={settings.displayType === 'PER_FOOD_TYPE'}
                onChange={() =>
                  setSettings(prev => ({
                    ...prev,
                    displayType: 'PER_FOOD_TYPE',
                  }))
                }
              />
            </label>
          </div>

          {settings.displayType === 'SINGLE' && (
            <div className="form-field donor-photo-mode-card">
              <label className="field-label">Single donation image</label>
              <input
                type="file"
                aria-label="Single donation image"
                data-testid="single-image-upload"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={e => handleUpload(e.target.files?.[0])}
              />
              {uploadingKey === 'single' && (
                <div className="input-help-text">Uploading...</div>
              )}
              {(settings.singleImageUrl || settings.singleLibraryImageUrl) && (
                <div className="donor-photo-preview-wrap">
                  <img
                    src={toAbsoluteImageUrl(
                      settings.singleImageUrl || settings.singleLibraryImageUrl
                    )}
                    alt="Selected single"
                    className="donor-photo-preview"
                  />
                  {pendingUploadByKey.single && (
                    <span className="donor-photo-pending-badge">
                      Pending approval
                    </span>
                  )}
                </div>
              )}
              <div className="input-help-text">
                Or select from internal library:
              </div>
              <div className="donor-library-grid">
                {(libraryByFoodType.GENERIC || library.slice(0, 6)).map(
                  item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectLibraryImage(null, item)}
                      className="donor-library-card"
                    >
                      <img
                        src={toAbsoluteImageUrl(item.url)}
                        alt={`Library ${item.id}`}
                        className="donor-library-card-image"
                      />
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {settings.displayType === 'PER_FOOD_TYPE' && (
            <div className="donor-per-type-grid">
              {foodTypeOptions.map(option => (
                <div
                  key={option.value}
                  className="form-field donor-photo-mode-card"
                >
                  <label className="field-label">{option.label}</label>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={e =>
                      handleUpload(e.target.files?.[0], option.value)
                    }
                  />
                  {uploadingKey === option.value && (
                    <div className="input-help-text">Uploading...</div>
                  )}
                  {(settings.perFoodTypeUrls?.[option.value] ||
                    settings.perFoodTypeLibraryUrls?.[option.value]) && (
                    <div className="donor-photo-preview-wrap">
                      <img
                        src={toAbsoluteImageUrl(
                          settings.perFoodTypeUrls?.[option.value] ||
                            settings.perFoodTypeLibraryUrls?.[option.value]
                        )}
                        alt={`${option.label} selected`}
                        className="donor-photo-preview"
                      />
                      {pendingUploadByKey[option.value] && (
                        <span className="donor-photo-pending-badge">
                          Pending approval
                        </span>
                      )}
                    </div>
                  )}
                  <div className="donor-library-grid">
                    {[
                      ...(libraryByFoodType[option.value] || []),
                      ...(libraryByFoodType.GENERIC || []),
                    ]
                      .slice(0, 6)
                      .map(item => (
                        <button
                          key={`${option.value}-${item.id}`}
                          type="button"
                          onClick={() => selectLibraryImage(option.value, item)}
                          className="donor-library-card donor-library-card-small"
                        >
                          <img
                            src={toAbsoluteImageUrl(item.url)}
                            alt={`Library ${item.id}`}
                            className="donor-library-card-image donor-library-card-image-small"
                          />
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            className="save-changes-btn"
            onClick={save}
            disabled={saving}
            style={{ marginTop: 12 }}
          >
            {saving ? 'Saving...' : 'Save Photo Preferences'}
          </button>
          <p className="input-help-text">
            Note: uploaded donor images are reviewed by admin before showing on
            receiver donation cards.
          </p>
        </div>
      )}
    </div>
  );
}
