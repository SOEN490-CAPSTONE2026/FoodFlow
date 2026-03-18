import React, { useState } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authAPI } from '../services/api';
import './ChangePasswordModal.css';

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear field-specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate current password
    if (!formData.currentPassword) {
      newErrors.currentPassword = t(
        'changePasswordModal.errors.currentPasswordRequired'
      );
      setErrors(newErrors);
      return false;
    }

    // Validate new password
    if (!formData.newPassword) {
      newErrors.newPassword = t(
        'changePasswordModal.errors.newPasswordRequired'
      );
      setErrors(newErrors);
      return false;
    }

    if (formData.newPassword.length < 8) {
      newErrors.newPassword = t(
        'changePasswordModal.errors.newPasswordMinLength'
      );
      setErrors(newErrors);
      return false;
    }

    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = t(
        'changePasswordModal.errors.newPasswordDifferent'
      );
      setErrors(newErrors);
      return false;
    }

    // Validate confirm password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t(
        'changePasswordModal.errors.confirmPasswordRequired'
      );
      setErrors(newErrors);
      return false;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = t(
        'changePasswordModal.errors.passwordsDoNotMatch'
      );
      setErrors(newErrors);
      return false;
    }

    setErrors(newErrors);
    return true;
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await authAPI.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });

      setSuccessMessage(
        response.data.message || t('changePasswordModal.messages.success')
      );

      // Clear form after 2 seconds and close modal
      setTimeout(() => {
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setSuccessMessage('');
        onClose();
      }, 2000);
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        t('changePasswordModal.messages.changeFailed');

      // Map backend errors to specific fields
      if (errorMessage.toLowerCase().includes('incorrect current password')) {
        setErrors({ currentPassword: errorMessage });
      } else if (errorMessage.toLowerCase().includes('do not match')) {
        setErrors({ confirmPassword: errorMessage });
      } else if (errorMessage.toLowerCase().includes('same as current')) {
        setErrors({ newPassword: errorMessage });
      } else {
        setErrors({ general: errorMessage });
      }
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = field => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleCancel = () => {
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div className="modal-overlay" onClick={handleCancel}></div>
      <div className="change-password-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{t('changePasswordModal.title')}</h3>
          <button
            className="close-button"
            onClick={handleCancel}
            aria-label={t('changePasswordModal.aria.closeModal')}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="change-password-form">
          <div className="form-group">
            <label htmlFor="currentPassword">
              {t('changePasswordModal.fields.currentPassword')}
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPassword.current ? 'text' : 'password'}
                id="currentPassword"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                className={errors.currentPassword ? 'error' : ''}
                placeholder={t(
                  'changePasswordModal.placeholders.currentPassword'
                )}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => togglePasswordVisibility('current')}
                aria-label={t(
                  'changePasswordModal.aria.togglePasswordVisibility'
                )}
              >
                {showPassword.current ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>
            {errors.currentPassword && (
              <span className="error-message">{errors.currentPassword}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">
              {t('changePasswordModal.fields.newPassword')}
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPassword.new ? 'text' : 'password'}
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className={errors.newPassword ? 'error' : ''}
                placeholder={t('changePasswordModal.placeholders.newPassword')}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => togglePasswordVisibility('new')}
                aria-label={t(
                  'changePasswordModal.aria.togglePasswordVisibility'
                )}
              >
                {showPassword.new ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.newPassword && (
              <span className="error-message">{errors.newPassword}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">
              {t('changePasswordModal.fields.confirmNewPassword')}
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPassword.confirm ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={errors.confirmPassword ? 'error' : ''}
                placeholder={t(
                  'changePasswordModal.placeholders.confirmNewPassword'
                )}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => togglePasswordVisibility('confirm')}
                aria-label={t(
                  'changePasswordModal.aria.togglePasswordVisibility'
                )}
              >
                {showPassword.confirm ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="error-message">{errors.confirmPassword}</span>
            )}
          </div>

          <div className="password-requirements">
            <h4>{t('changePasswordModal.requirements.title')}</h4>
            <ul>
              <li>{t('changePasswordModal.requirements.minLength')}</li>
              <li>
                {t('changePasswordModal.requirements.differentFromCurrent')}
              </li>
            </ul>
          </div>

          {errors.general && (
            <div className="error-message general-error">{errors.general}</div>
          )}

          {successMessage && (
            <div className="success-message">{successMessage}</div>
          )}
        </form>

        <div className="modal-actions">
          <button
            type="button"
            className="cancel-button"
            onClick={handleCancel}
            disabled={loading}
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            className="confirm-button"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? t('changePasswordModal.changing') : t('common.confirm')}
          </button>
        </div>
      </div>
    </>
  );
};

export default ChangePasswordModal;
