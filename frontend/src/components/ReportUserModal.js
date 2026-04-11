import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { X, Upload, AlertCircle } from 'lucide-react';
import './ReportUserModal.css';

const ReportUserModal = ({
  isOpen,
  onClose,
  reportedUser,
  donationId,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [description, setDescription] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const predefinedMessages = [
    {
      key: 'noShow',
      title: t('reportUserModal.predefinedMessages.noShow.title'),
      body: t('reportUserModal.predefinedMessages.noShow.body'),
      text: t('reportUserModal.predefinedMessages.noShow.text'),
    },
    {
      key: 'unsafeBehavior',
      title: t('reportUserModal.predefinedMessages.unsafeBehavior.title'),
      body: t('reportUserModal.predefinedMessages.unsafeBehavior.body'),
      text: t('reportUserModal.predefinedMessages.unsafeBehavior.text'),
    },
  ];

  const handleTemplateSelect = template => {
    setSelectedTemplate(template.key);
    setDescription(template.text);
    setError('');
  };

  const handlePhotoChange = e => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        setError(t('reportUserModal.photoTooLarge'));
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

  const handleSubmit = async e => {
    e.preventDefault();

    if (!description.trim()) {
      setError(t('reportUserModal.descriptionRequired'));
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
        photoEvidenceUrl: photoUrl,
      });

      // Reset form and close - parent will handle success message
      setDescription('');
      setPhotoFile(null);
      setPhotoPreview(null);
      onClose();
    } catch (err) {
      setError(err.message || t('reportUserModal.submitFailed'));
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

  if (!isOpen) {
    return null;
  }

  return (
    <div className="report-modal-overlay" onClick={handleClose}>
      <div className="report-modal-content" onClick={e => e.stopPropagation()}>
        <div className="report-modal-header">
          <h2>{t('reportUserModal.title')}</h2>
          <button className="report-modal-close" onClick={handleClose}>
            <X size={24} />
          </button>
        </div>

        <div className="report-modal-body">
          <div className="report-info-card">
            <AlertCircle size={20} />
            <p>
              {t('reportUserModal.infoPrefix')}{' '}
              <strong>
                {reportedUser?.name || t('reportUserModal.thisUser')}
              </strong>
              .{donationId && ` ${t('reportUserModal.donationLinked')}`}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="report-form-group">
              <label>{t('reportUserModal.quickOptionsLabel')}</label>
              <div className="report-template-grid">
                {predefinedMessages.map(template => (
                  <button
                    key={template.key}
                    type="button"
                    className={`report-template-card ${selectedTemplate === template.key ? 'selected' : ''}`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <span className="report-template-title">
                      {template.title}
                    </span>
                    <span className="report-template-body">
                      {template.body}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="report-form-group">
              <label htmlFor="description">
                {t('reportUserModal.descriptionLabel')}{' '}
                <span className="required">*</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={t('reportUserModal.descriptionPlaceholder')}
                rows={5}
                required
                maxLength={1000}
              />
              <span className="char-count">{description.length}/1000</span>
            </div>

            <div className="report-form-group">
              <label htmlFor="photo">{t('reportUserModal.photoLabel')}</label>
              <div className="photo-upload-area">
                {!photoPreview ? (
                  <label htmlFor="photo-input" className="photo-upload-label">
                    <Upload size={32} />
                    <span>{t('reportUserModal.uploadPrompt')}</span>
                    <span className="upload-hint">
                      {t('reportUserModal.maxSize')}
                    </span>
                  </label>
                ) : (
                  <div className="photo-preview">
                    <img
                      src={photoPreview}
                      alt={t('reportUserModal.evidencePreviewAlt')}
                    />
                    <button
                      type="button"
                      className="remove-photo-btn"
                      onClick={() => {
                        setPhotoFile(null);
                        setPhotoPreview(null);
                      }}
                    >
                      <X size={16} /> {t('reportUserModal.removePhoto')}
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
                {t('reportUserModal.cancel')}
              </button>
              <button
                type="submit"
                className="report-btn-submit"
                disabled={isSubmitting || !description.trim()}
              >
                {isSubmitting
                  ? t('reportUserModal.submitting')
                  : t('reportUserModal.submit')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReportUserModal;

ReportUserModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  reportedUser: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
  }),
  donationId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onSubmit: PropTypes.func.isRequired,
};
