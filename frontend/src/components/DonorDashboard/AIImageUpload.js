import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertCircle,
  Camera,
  Check,
  ChevronRight,
  FileUp,
  PencilLine,
  Trash2,
} from 'lucide-react';
import './Donor_Styles/AIDonation.css';

export default function AIImageUpload({ onImageSelect, onManualEntry }) {
  const { t } = useTranslation();
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic'];

  const validateFile = file => {
    setError(null);
    if (!file) {
      setError(t('aiDonation.upload.errors.selectFile'));
      return false;
    }
    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      setError(t('aiDonation.upload.errors.unsupportedType'));
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError(t('aiDonation.upload.errors.fileTooLarge'));
      return false;
    }
    return true;
  };

  const handleFileSelect = file => {
    if (validateFile(file)) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = e => {
    const file = e.target.files[0];
    if (file) handleFileSelect(file);
  };

  const handleDragEnter = useCallback(e => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(e => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback(e => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(e => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) handleFileSelect(files[0]);
  }, []);

  const handleProceed = () => {
    if (selectedFile) onImageSelect(selectedFile);
  };

  const handleClear = () => {
    setPreview(null);
    setSelectedFile(null);
    setError(null);
  };

  return (
    <div className="ai-image-upload-container">
      {/* Upload / Preview area */}
      {!preview ? (
        <div
          className={`dropzone ${isDragging ? 'dragging' : ''}`}
          role="button"
          tabIndex={0}
          aria-label={t('aiDonation.upload.ariaLabel')}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onKeyDown={event => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              document.getElementById('image-upload')?.click();
            }
          }}
        >
          <input
            type="file"
            id="image-upload"
            accept="image/jpeg,image/jpg,image/png,image/heic"
            onChange={handleInputChange}
            style={{ display: 'none' }}
          />
          <input
            type="file"
            id="image-capture"
            accept="image/*"
            capture="environment"
            onChange={handleInputChange}
            style={{ display: 'none' }}
          />

          <div className="dropzone-content">
            <div className="upload-icon-teal" aria-hidden="true">
              <FileUp size={26} />
            </div>
            <p className="dropzone-title">{t('aiDonation.upload.title')}</p>
            <p className="dropzone-text">
              {t('aiDonation.upload.dragAndDrop')}
            </p>
            <div className="upload-buttons-row">
              <label htmlFor="image-upload" className="upload-btn-primary">
                <FileUp size={15} />
                {t('aiDonation.upload.chooseFile')}
              </label>
              <label htmlFor="image-capture" className="upload-btn-secondary">
                <Camera size={15} />
                {t('aiDonation.upload.takePhoto')}
              </label>
            </div>
            <p className="file-constraints">
              Supported formats: {t('aiDonation.upload.fileTypes')} •{' '}
              {t('aiDonation.upload.maxSize')}
            </p>
          </div>
        </div>
      ) : (
        <div className="preview-container">
          <div className="preview-header">
            <h4>{t('aiDonation.upload.selectedFile')}</h4>
            <button
              className="clear-button"
              onClick={handleClear}
              type="button"
            >
              <Trash2 size={16} />
              <span>{t('aiDonation.upload.remove')}</span>
            </button>
          </div>
          <div className="image-preview">
            <img src={preview} alt="Label preview" />
          </div>
          <div className="preview-info">
            <p className="file-name">{selectedFile?.name}</p>
            <p className="file-size">
              {(selectedFile?.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <button
            className="proceed-button"
            onClick={handleProceed}
            type="button"
          >
            {t('aiDonation.upload.continueToReview')}
          </button>
        </div>
      )}

      {error && (
        <div className="error-message">
          <span className="error-icon">
            <AlertCircle size={16} />
          </span>
          {error}
        </div>
      )}

      {/* Two info cards */}
      <div className="upload-info-cards">
        <div className="upload-info-card upload-info-card--blue">
          <div className="upload-info-card-header">
            <div className="upload-info-card-icon upload-info-card-icon--blue">
              <Camera size={18} />
            </div>
            <div>
              <h4>{t('aiDonation.upload.uploadCardTitle')}</h4>
              <p>{t('aiDonation.upload.uploadCardSubtitle')}</p>
            </div>
          </div>
          <ul className="upload-info-list">
            {[
              t('aiDonation.upload.required.productName'),
              t('aiDonation.upload.required.nutritionFacts'),
              t('aiDonation.upload.required.ingredientsList'),
              t('aiDonation.upload.required.expiryDate'),
              t('aiDonation.upload.required.allergenInfo'),
            ].map(item => (
              <li key={item}>
                <Check size={14} className="upload-info-check" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="upload-info-card upload-info-card--teal">
          <div className="upload-info-card-header">
            <div className="upload-info-card-icon upload-info-card-icon--teal">
              <FileUp size={18} />
            </div>
            <div>
              <h4>{t('aiDonation.upload.guidelinesTitle')}</h4>
              <p>{t('aiDonation.upload.guidelinesSubtitle')}</p>
            </div>
          </div>
          <ul className="upload-info-list">
            {[
              t('aiDonation.upload.tips.goodLighting'),
              t('aiDonation.upload.tips.noGlare'),
              t('aiDonation.upload.tips.labelVisible'),
              t('aiDonation.upload.tips.textInFocus'),
              t('aiDonation.upload.tips.includeExpiry'),
            ].map(item => (
              <li key={item}>
                <Check size={14} className="upload-info-check" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* OR + Manual entry */}
      <div className="alternative-section">
        <div className="divider">
          <span>{t('aiDonation.upload.alternative')}</span>
        </div>
        <button
          className="manual-entry-button"
          onClick={onManualEntry}
          type="button"
        >
          <PencilLine size={16} />
          <span>{t('aiDonation.upload.manualEntry')}</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
