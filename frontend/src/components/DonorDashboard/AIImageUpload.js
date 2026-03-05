import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertCircle,
  Camera,
  ChevronRight,
  Check,
  FileImage,
  FileUp,
  HardDrive,
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
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = e => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
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
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleProceed = () => {
    if (selectedFile) {
      onImageSelect(selectedFile);
    }
  };

  const handleClear = () => {
    setPreview(null);
    setSelectedFile(null);
    setError(null);
  };

  return (
    <div className="ai-image-upload-container">
      <div className="upload-section">
        <div className="upload-instructions">
          <h3>{t('aiDonation.upload.title')}</h3>
          <p>{t('aiDonation.upload.subtitle')}</p>
          <ul>
            <li>{t('aiDonation.upload.required.productName')}</li>
            <li>{t('aiDonation.upload.required.nutritionFacts')}</li>
            <li>{t('aiDonation.upload.required.ingredientsList')}</li>
            <li>{t('aiDonation.upload.required.expiryDate')}</li>
            <li>{t('aiDonation.upload.required.allergenInfo')}</li>
          </ul>
        </div>

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

            <div className="dropzone-content">
              <div className="upload-icon" aria-hidden="true">
                <FileUp size={20} />
              </div>
              <p className="dropzone-text">
                {t('aiDonation.upload.dragAndDrop')}
              </p>
              <p className="dropzone-or">{t('aiDonation.upload.or')}</p>
              <label htmlFor="image-upload" className="upload-button">
                {t('aiDonation.upload.chooseFile')}
              </label>
              <div className="constraint-pills">
                <span className="constraint-pill">
                  <FileImage size={12} />
                  {t('aiDonation.upload.fileTypes')}
                </span>
                <span className="constraint-pill">
                  <HardDrive size={12} />
                  {t('aiDonation.upload.maxSize')}
                </span>
              </div>
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
      </div>

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

      <div className="tips-section">
        <h4>
          <Camera size={16} />
          <span>{t('aiDonation.upload.guidelinesTitle')}</span>
        </h4>
        <ul className="tips-list">
          {[
            t('aiDonation.upload.tips.goodLighting'),
            t('aiDonation.upload.tips.noGlare'),
            t('aiDonation.upload.tips.labelVisible'),
            t('aiDonation.upload.tips.textInFocus'),
            t('aiDonation.upload.tips.includeExpiry'),
          ].map(item => (
            <li key={item}>
              <Check size={14} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="manual-hint">{t('aiDonation.upload.manualHint')}</p>
      </div>
    </div>
  );
}
