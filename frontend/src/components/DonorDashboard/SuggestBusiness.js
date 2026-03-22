import React, { useState } from 'react';
import { referralAPI } from '../../services/api';
import { Building2, Lightbulb, CheckCircle2, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './Donor_Styles/SuggestBusiness.css';

export default function SuggestBusiness() {
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
      errs.businessName = t('suggestBusiness.validation.businessNameRequired');
    } else if (formData.businessName.trim().length > 200) {
      errs.businessName = t('suggestBusiness.validation.businessNameTooLong');
    }
    if (!formData.contactEmail.trim()) {
      errs.contactEmail = t('suggestBusiness.validation.contactEmailRequired');
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail.trim())
    ) {
      errs.contactEmail = t('suggestBusiness.validation.contactEmailInvalid');
    }
    if (formData.message.length > 500) {
      errs.message = t('suggestBusiness.validation.messageTooLong');
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
        referralType: 'SUGGEST_BUSINESS',
        businessName: formData.businessName.trim(),
        contactEmail: formData.contactEmail.trim(),
        contactPhone: formData.contactPhone.trim() || null,
        message: formData.message.trim() || null,
      });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.response?.data || t('suggestBusiness.errors.generic'));
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
    <div className="suggest-business-page">
      <div className="suggest-business-layout">
        {/* Left column — info cards */}
        <div className="suggest-info-column">
          {/* Tips for Suggestions */}
          <div className="suggest-info-card">
            <div className="suggest-info-card-header">
              <Lightbulb size={27} className="suggest-info-icon" />
              <h3>Tips for Suggestions</h3>
            </div>
            <ul className="suggest-tips-list">
              <li>
                Restaurants, bakeries, and grocery stores are great candidates
              </li>
              <li>Include accurate contact information to help us reach out</li>
              <li>A personal message increases the chance they'll join</li>
              <li>We'll contact them within 48 hours of your suggestion</li>
            </ul>
          </div>

          {/* Great Business Types */}
          <div className="suggest-info-card">
            <div className="suggest-info-card-header">
              <Building2 size={27} className="suggest-info-icon" />
              <h3>Great Business Types</h3>
            </div>
            <ul className="suggest-business-types-list">
              {[
                { name: 'Bakeries', desc: 'Day-old bread and pastries' },
                { name: 'Restaurants', desc: 'Prepared food at closing' },
                { name: 'Grocery Stores', desc: 'Near-expiration products' },
                { name: 'Catering Companies', desc: 'Post-event surplus' },
                { name: 'Cafeterias', desc: 'Daily prepared meals' },
              ].map(biz => (
                <li key={biz.name}>
                  <CheckCircle2 size={16} className="suggest-check-icon" />
                  <div>
                    <span className="suggest-biz-name">{biz.name}</span>
                    <span className="suggest-biz-desc">{biz.desc}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Community Impact */}
          <div className="suggest-impact-card">
            <div className="suggest-info-card-header">
              <Users size={18} className="suggest-info-icon" />
              <h3>Community Impact</h3>
            </div>
            <div className="suggest-impact-stats">
              <div>
                <span className="suggest-stat-value">2,450+</span>
                <span className="suggest-stat-label">Partner Businesses</span>
              </div>
              <div>
                <span className="suggest-stat-value">89%</span>
                <span className="suggest-stat-label">Join After Outreach</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column — form */}
        <div className="suggest-form-column">
          <div className="suggest-business-card">
            {/* Form header */}
            <div className="suggest-business-header">
              <div className="suggest-business-icon">
                <Building2 size={30} />
              </div>
              <div>
                <h2 className="suggest-business-title">
                  {t('suggestBusiness.title')}
                </h2>
                <p className="suggest-business-subtitle">
                  Know a business that produces surplus food? Suggest them to
                  join FoodFlow as a donor.
                </p>
              </div>
            </div>

            {submitted ? (
              <div
                className="suggest-business-success"
                role="alert"
                data-testid="success-message"
              >
                <div className="suggest-business-success-icon">✓</div>
                <h3>{t('suggestBusiness.success.heading')}</h3>
                <p>
                  {t('suggestBusiness.success.body', {
                    email: formData.contactEmail,
                  })}
                </p>
                <button className="suggest-btn-secondary" onClick={handleReset}>
                  {t('suggestBusiness.success.submitAnother')}
                </button>
              </div>
            ) : (
              <form
                className="suggest-business-form"
                onSubmit={handleSubmit}
                noValidate
              >
                {submitError && (
                  <div className="suggest-business-error" role="alert">
                    {submitError}
                  </div>
                )}

                <div className="suggest-form-group">
                  <label htmlFor="suggest-businessName">
                    {t('suggestBusiness.form.businessNameLabel')}{' '}
                    <span className="required">*</span>
                  </label>
                  <input
                    id="suggest-businessName"
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    placeholder={t(
                      'suggestBusiness.form.businessNamePlaceholder'
                    )}
                    className={errors.businessName ? 'input-error' : ''}
                    disabled={submitting}
                  />
                  {errors.businessName && (
                    <span className="field-error" role="alert">
                      {errors.businessName}
                    </span>
                  )}
                </div>

                <div className="suggest-form-group">
                  <label htmlFor="suggest-contactEmail">
                    {t('suggestBusiness.form.contactEmailLabel')}{' '}
                    <span className="required">*</span>
                  </label>
                  <input
                    id="suggest-contactEmail"
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    placeholder={t(
                      'suggestBusiness.form.contactEmailPlaceholder'
                    )}
                    className={errors.contactEmail ? 'input-error' : ''}
                    disabled={submitting}
                  />
                  {errors.contactEmail && (
                    <span className="field-error" role="alert">
                      {errors.contactEmail}
                    </span>
                  )}
                </div>

                <div className="suggest-form-group">
                  <label htmlFor="suggest-contactPhone">
                    {t('suggestBusiness.form.contactPhoneLabel')}
                  </label>
                  <input
                    id="suggest-contactPhone"
                    type="tel"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    placeholder={t(
                      'suggestBusiness.form.contactPhonePlaceholder'
                    )}
                    disabled={submitting}
                  />
                </div>

                <div className="suggest-form-group">
                  <label htmlFor="suggest-message">
                    {t('suggestBusiness.form.messageLabel')}
                    <span className="char-count">
                      {formData.message.length}/500
                    </span>
                  </label>
                  <textarea
                    id="suggest-message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={5}
                    placeholder={t('suggestBusiness.form.messagePlaceholder')}
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

                <button
                  type="submit"
                  className="suggest-btn-primary"
                  disabled={submitting}
                  data-testid="submit-button"
                >
                  {submitting
                    ? t('suggestBusiness.form.submitting')
                    : t('suggestBusiness.form.submitButton')}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
