import React, { useState, useCallback } from 'react';
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
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic'];

  const validateFile = file => {
    setError(null);

    if (!file) {
      setError('Select an image file to continue.');
      return false;
    }

    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      setError('Unsupported file type. Use JPG, PNG, or HEIC.');
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('File size exceeds 5 MB. Select a smaller image.');
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
          <h3>Upload label image</h3>
          <p>Upload a clear image that includes:</p>
          <ul>
            <li>Product name</li>
            <li>Nutrition facts</li>
            <li>Ingredients list</li>
            <li>Expiry or best-before date</li>
            <li>Allergen information</li>
          </ul>
        </div>

        {!preview ? (
          <div
            className={`dropzone ${isDragging ? 'dragging' : ''}`}
            role="button"
            tabIndex={0}
            aria-label="Upload label image"
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
              <p className="dropzone-text">Drag and drop a label image</p>
              <p className="dropzone-or">or</p>
              <label htmlFor="image-upload" className="upload-button">
                Choose file
              </label>
              <div className="constraint-pills">
                <span className="constraint-pill">
                  <FileImage size={12} />
                  JPG, PNG, HEIC
                </span>
                <span className="constraint-pill">
                  <HardDrive size={12} />
                  Max 5 MB
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="preview-container">
            <div className="preview-header">
              <h4>Selected file</h4>
              <button
                className="clear-button"
                onClick={handleClear}
                type="button"
              >
                <Trash2 size={16} />
                <span>Remove</span>
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
              Continue to review
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
          <span>Alternative</span>
        </div>
        <button
          className="manual-entry-button"
          onClick={onManualEntry}
          type="button"
        >
          <PencilLine size={16} />
          <span>Continue with manual entry</span>
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="tips-section">
        <h4>
          <Camera size={16} />
          <span>Image guidelines</span>
        </h4>
        <ul className="tips-list">
          {[
            'Good lighting',
            'No glare',
            'Label fully visible',
            'Keep text in focus',
            'Include expiry/best-before when available',
          ].map(item => (
            <li key={item}>
              <Check size={14} />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="manual-hint">Clear images improve extraction accuracy.</p>
      </div>
    </div>
  );
}
