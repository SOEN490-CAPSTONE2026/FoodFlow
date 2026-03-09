import React, { useState } from 'react';
import { referralAPI } from '../../services/api';
import { Share2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './Receiver_Styles/InviteCommunity.css';

export default function InviteCommunity() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    businessName: '',
    contactEmail: '',
    contactPhone: '',
    message: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const validate = () => {
    const errs = {};
    if (!formData.businessName.trim()) {
      errs.businessName = t('inviteCommunity.validation.businessNameRequired');
    } else if (formData.businessName.trim().length > 200) {
      errs.businessName = t('inviteCommunity.validation.businessNameTooLong');
    }
    if (!formData.contactEmail.trim()) {
      errs.contactEmail = t('inviteCommunity.validation.contactEmailRequired');
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail.trim())
    ) {
      errs.contactEmail = t('inviteCommunity.validation.contactEmailInvalid');
    }
    if (formData.message.length > 500) {
      errs.message = t('inviteCommunity.validation.messageTooLong');
    }
    return errs;
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      await referralAPI.submit({
        referralType: 'INVITE_COMMUNITY',
        businessName: formData.businessName.trim(),
        contactEmail: formData.contactEmail.trim(),
        contactPhone: formData.contactPhone.trim() || null,
        message: formData.message.trim() || null,
      });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.response?.data || t('inviteCommunity.errors.generic'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      businessName: '',
      contactEmail: '',
      contactPhone: '',
      message: '',
    });
    setErrors({});
    setSubmitted(false);
    setSubmitError('');
  };

  return (
    <div className="invite-community-page">
      <div className="invite-community-card">
        <div className="invite-community-header">
          <div className="invite-community-icon">
            <Share2 size={28} />
          </div>
          <div>
            <h2 className="invite-community-title">
              {t('inviteCommunity.title')}
            </h2>
            <p className="invite-community-subtitle">
              {t('inviteCommunity.subtitle')}
            </p>
          </div>
        </div>

        {submitted ? (
          <div
            className="invite-community-success"
            role="alert"
            data-testid="success-message"
          >
            <div className="invite-community-success-icon">✓</div>
            <h3>{t('inviteCommunity.success.heading')}</h3>
            <p>
              {t('inviteCommunity.success.body', {
                email: formData.contactEmail,
              })}
            </p>
            <button className="invite-btn-secondary" onClick={handleReset}>
              {t('inviteCommunity.success.submitAnother')}
            </button>
          </div>
        ) : (
          <form
            className="invite-community-form"
            onSubmit={handleSubmit}
            noValidate
          >
            {submitError && (
              <div className="invite-community-error" role="alert">
                {submitError}
              </div>
            )}

            <div className="invite-form-group">
              <label htmlFor="invite-businessName">
                {t('inviteCommunity.form.businessNameLabel')}{' '}
                <span className="required">*</span>
              </label>
              <input
                id="invite-businessName"
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                placeholder={t('inviteCommunity.form.businessNamePlaceholder')}
                className={errors.businessName ? 'input-error' : ''}
                disabled={submitting}
              />
              {errors.businessName && (
                <span className="field-error" role="alert">
                  {errors.businessName}
                </span>
              )}
            </div>

            <div className="invite-form-group">
              <label htmlFor="invite-contactEmail">
                {t('inviteCommunity.form.contactEmailLabel')}{' '}
                <span className="required">*</span>
              </label>
              <input
                id="invite-contactEmail"
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                placeholder={t('inviteCommunity.form.contactEmailPlaceholder')}
                className={errors.contactEmail ? 'input-error' : ''}
                disabled={submitting}
              />
              {errors.contactEmail && (
                <span className="field-error" role="alert">
                  {errors.contactEmail}
                </span>
              )}
            </div>

            <div className="invite-form-group">
              <label htmlFor="invite-contactPhone">
                {t('inviteCommunity.form.contactPhoneLabel')}
              </label>
              <input
                id="invite-contactPhone"
                type="tel"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleChange}
                placeholder={t('inviteCommunity.form.contactPhonePlaceholder')}
                disabled={submitting}
              />
            </div>

            <div className="invite-form-group">
              <label htmlFor="invite-message">
                {t('inviteCommunity.form.messageLabel')}
                <span className="char-count">
                  {formData.message.length}/500
                </span>
              </label>
              <textarea
                id="invite-message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={3}
                placeholder={t('inviteCommunity.form.messagePlaceholder')}
                className={errors.message ? 'input-error' : ''}
                disabled={submitting}
                maxLength={500}
              />
              {errors.message && (
                <span className="field-error" role="alert">
                  {errors.message}
                </span>
              )}
            </div>

            <div className="invite-form-actions">
              <button
                type="submit"
                className="invite-btn-primary"
                disabled={submitting}
                data-testid="submit-button"
              >
                {submitting
                  ? t('inviteCommunity.form.submitting')
                  : t('inviteCommunity.form.submitButton')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
