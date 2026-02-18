import React, { useState, useCallback } from 'react';
import {
  AlertCircle,
  FileUp,
  ImagePlus,
  Trash2,
  PenSquare,
  Camera,
} from 'lucide-react';
import './Donor_Styles/AIDonation.css';

/**
 * Component for uploading food label images
 * Supports drag-and-drop and file selection
 */
export default function AIImageUpload({ onImageSelect, onManualEntry }) {
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic'];

  /**
   * Validate image file
   */
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

  /**
   * Handle file selection
   */
  const handleFileSelect = file => {
    if (validateFile(file)) {
      setSelectedFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * Handle file input change
   */
  const handleInputChange = e => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  /**
   * Handle drag events
   */
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

  /**
   * Handle proceed with selected image
   */
  const handleProceed = () => {
    if (selectedFile) {
      onImageSelect(selectedFile);
    }
  };

  /**
   * Handle clear/reset
   */
  const handleClear = () => {
    setPreview(null);
    setSelectedFile(null);
    setError(null);
  };

  return (
    <div className="ai-image-upload-container">
      <div className="upload-section">
        <div className="upload-instructions">
          <h3>Upload food label</h3>
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
            aria-label="Upload food label image"
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
                Select image
              </label>
              <p className="file-requirements">JPG, PNG, HEIC · Max 5 MB</p>
            </div>
          </div>
        ) : (
          <div className="preview-container">
            <div className="preview-header">
              <h4>Selected image</h4>
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
              <img src={preview} alt="Food label preview" />
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
              <ImagePlus size={16} />
              <span>Continue to review</span>
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
          <PenSquare size={16} />
          <span>Enter details manually</span>
        </button>
        <p className="manual-hint">You may also complete the form manually.</p>
      </div>

      <div className="tips-section">
        <h4>
          <Camera size={16} />
          <span>Image guidelines</span>
        </h4>
        <ul className="tips-list">
          <li>Use even lighting and avoid shadows</li>
          <li>Keep the label flat and in focus</li>
          <li>Include the full label in the frame</li>
          <li>Avoid glare on reflective packaging</li>
        </ul>
      </div>
    </div>
  );
}
