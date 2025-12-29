import React, { useState } from 'react';
import { X, Upload, AlertCircle } from 'lucide-react';
import './ReportUserModal.css';

const ReportUserModal = ({ 
  isOpen, 
  onClose, 
  reportedUser, 
  donationId, 
  onSubmit 
}) => {
  const [description, setDescription] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Photo size must be less than 5MB');
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!description.trim()) {
      setError('Please provide a description');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Mock photo upload - replace with actual API when backend is ready
      let photoUrl = null;
      if (photoFile) {
        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 500));
        photoUrl = URL.createObjectURL(photoFile);
      }

      await onSubmit({
        reportedUserId: reportedUser.id,
        donationId: donationId,
        description: description.trim(),
        photoEvidenceUrl: photoUrl
      });

      // Show success message
      alert('Report submitted successfully! Case ID will be provided once processed.');

      // Reset form
      setDescription('');
      setPhotoFile(null);
      setPhotoPreview(null);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setDescription('');
    setPhotoFile(null);
    setPhotoPreview(null);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="report-modal-overlay" onClick={handleClose}>
      <div className="report-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="report-modal-header">
          <h2>Report User</h2>
          <button className="report-modal-close" onClick={handleClose}>
            <X size={24} />
          </button>
        </div>

        <div className="report-modal-body">
          <div className="report-info-card">
            <AlertCircle size={20} />
            <p>
              You are reporting <strong>{reportedUser?.name || 'this user'}</strong>.
              {donationId && ' This report will be linked to the donation.'}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="report-form-group">
              <label htmlFor="description">
                Description <span className="required">*</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please describe what happened..."
                rows={5}
                required
                maxLength={1000}
              />
              <span className="char-count">{description.length}/1000</span>
            </div>

            <div className="report-form-group">
              <label htmlFor="photo">Photo Evidence (Optional)</label>
              <div className="photo-upload-area">
                {!photoPreview ? (
                  <label htmlFor="photo-input" className="photo-upload-label">
                    <Upload size={32} />
                    <span>Click to upload photo</span>
                    <span className="upload-hint">Max size: 5MB</span>
                  </label>
                ) : (
                  <div className="photo-preview">
                    <img src={photoPreview} alt="Evidence preview" />
                    <button
                      type="button"
                      className="remove-photo-btn"
                      onClick={() => {
                        setPhotoFile(null);
                        setPhotoPreview(null);
                      }}
                    >
                      <X size={16} /> Remove
                    </button>
                  </div>
                )}
                <input
                  id="photo-input"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            {error && (
              <div className="report-error-message">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div className="report-modal-actions">
              <button
                type="button"
                className="report-btn-cancel"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="report-btn-submit"
                disabled={isSubmitting || !description.trim()}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReportUserModal;
