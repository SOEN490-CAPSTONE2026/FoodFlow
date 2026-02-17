import React, { useState, useCallback } from 'react';
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
      setError('Please select a file');
      return false;
    }

    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      setError('Invalid file type. Please upload JPG, PNG, or HEIC images.');
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('File size exceeds 5MB limit. Please choose a smaller image.');
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
          <h3>📸 Upload Food Label Photo</h3>
          <p>Take a clear photo of the food product label showing:</p>
          <ul>
            <li>✓ Product name</li>
            <li>✓ Nutrition facts</li>
            <li>✓ Ingredients list</li>
            <li>✓ Expiry/Best before date</li>
            <li>✓ Allergen information</li>
          </ul>
        </div>

        {!preview ? (
          <div
            className={`dropzone ${isDragging ? 'dragging' : ''}`}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="image-upload"
              accept="image/jpeg,image/jpg,image/png,image/heic"
              onChange={handleInputChange}
              style={{ display: 'none' }}
            />

            <div className="dropzone-content">
              <div className="upload-icon">📤</div>
              <p className="dropzone-text">
                Drag & drop your food label image here
              </p>
              <p className="dropzone-or">or</p>
              <label htmlFor="image-upload" className="upload-button">
                Choose File
              </label>
              <p className="file-requirements">JPG, PNG, HEIC • Max 5MB</p>
            </div>
          </div>
        ) : (
          <div className="preview-container">
            <div className="preview-header">
              <h4>Selected Image</h4>
              <button
                className="clear-button"
                onClick={handleClear}
                type="button"
              >
                ✕ Remove
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
              Analyze with AI →
            </button>
          </div>
        )}

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}
      </div>

      <div className="alternative-section">
        <div className="divider">
          <span>OR</span>
        </div>
        <button
          className="manual-entry-button"
          onClick={onManualEntry}
          type="button"
        >
          <span className="manual-icon">✏️</span>
          Use Manual Entry Instead
        </button>
        <p className="manual-hint">
          Prefer to fill out the form yourself? No problem!
        </p>
      </div>

      <div className="tips-section">
        <h4>💡 Tips for Best Results</h4>
        <ul className="tips-list">
          <li>Ensure good lighting and avoid shadows</li>
          <li>Keep the label flat and in focus</li>
          <li>Include the entire label in the frame</li>
          <li>Avoid glare or reflections on plastic packaging</li>
        </ul>
      </div>
    </div>
  );
}
