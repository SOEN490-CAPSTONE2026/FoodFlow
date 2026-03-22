import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { useLoadScript } from '@react-google-maps/api';
import { ArrowLeft, FileCheck2, Send, ScanSearch, Upload } from 'lucide-react';
import api from '../../services/api';
import AIImageUpload from './AIImageUpload';
import AIExtractionReview from './AIExtractionReview';
import './Donor_Styles/AIDonation.css';

const libraries = ['places'];

export default function AIDonationForm() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: libraries,
  });
  const [step, setStep] = useState('upload');
  const [selectedImage, setSelectedImage] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const isUploadActive = step === 'upload' || step === 'processing';
  const isUploadCompleted = step === 'review' || step === 'submit';
  const isReviewActive = step === 'review';
  const isReviewCompleted = step === 'submit';
  const isSubmitActive = step === 'submit';

  const handleImageUpload = async imageFile => {
    setSelectedImage(imageFile);
    setStep('processing');
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await api.post('/ai/extract-donation', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 35000,
      });

      if (response.data.success) {
        setExtractedData(response.data);
        setStep('review');
        toast.success(t('aiDonation.toast.extractionComplete'));
      } else {
        toast.error(
          response.data.errorMessage || t('aiDonation.toast.aiFailed')
        );
        setStep('upload');
      }
    } catch (error) {
      console.error('AI extraction error:', error);

      if (error.response) {
        const errorMsg =
          error.response.data?.errorMessage ||
          t('aiDonation.toast.analysisFailed');
        toast.error(errorMsg);
      } else if (error.code === 'ECONNABORTED') {
        toast.error(t('aiDonation.toast.requestTimedOut'));
      } else {
        toast.error(t('aiDonation.toast.networkError'));
      }

      setStep('upload');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReUpload = () => {
    setSelectedImage(null);
    setExtractedData(null);
    setStep('upload');
  };

  const handleManualEntry = () => {
    navigate('/donor/list');
  };

  const renderStep = () => {
    switch (step) {
      case 'upload':
        return (
          <AIImageUpload
            onImageSelect={handleImageUpload}
            onManualEntry={handleManualEntry}
          />
        );

      case 'processing':
        return (
          <div className="ai-processing-container">
            <div className="ai-spinner"></div>
            <h3>{t('aiDonation.processing.title')}</h3>
            <p className="processing-hint">{t('aiDonation.processing.hint')}</p>
            <div className="processing-steps">
              <div className="processing-step active">
                <div className="step-icon">
                  <Upload size={16} />
                </div>
                <span>{t('aiDonation.processing.readingLabel')}</span>
              </div>
              <div className="processing-step active">
                <div className="step-icon">
                  <ScanSearch size={16} />
                </div>
                <span>{t('aiDonation.processing.extractingData')}</span>
              </div>
              <div className="processing-step">
                <div className="step-icon">
                  <FileCheck2 size={16} />
                </div>
                <span>{t('aiDonation.processing.preparingResults')}</span>
              </div>
            </div>
          </div>
        );

      case 'review':
        if (!isLoaded) {
          return (
            <div className="ai-processing-container">
              <div className="ai-spinner"></div>
              <h3>{t('aiDonation.processing.loadingMaps')}</h3>
            </div>
          );
        }
        return (
          <AIExtractionReview
            data={extractedData}
            imageFile={selectedImage}
            onReUpload={handleReUpload}
            onCancel={() => navigate('/donor/list')}
            onSubmitStart={() => setStep('submit')}
            onSubmitError={() => setStep('review')}
          />
        );

      case 'submit':
        return (
          <div className="ai-processing-container">
            <div className="ai-spinner"></div>
            <h3>{t('aiDonation.submitting.title')}</h3>
            <p className="processing-hint">{t('aiDonation.submitting.hint')}</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="ai-donation-form-container">
      <div className="ai-donation-header">
        <button
          className="ai-back-button"
          onClick={() => navigate('/donor/list')}
          disabled={isProcessing}
        >
          <ArrowLeft size={16} />
          <span>{t('aiDonation.backToDashboard')}</span>
        </button>
        <div className="ai-donation-title-block">
          <h1>{t('aiDonation.title')}</h1>
          <p className="ai-subtitle">{t('aiDonation.subtitle')}</p>
        </div>
      </div>

      <div className="ai-step-indicator">
        <div
          className={`ai-step ${isUploadActive ? 'active' : ''} ${isUploadCompleted ? 'completed' : ''}`}
        >
          <div className="ai-step-number">
            <Upload size={16} />
          </div>
          <span className="ai-step-label">{t('aiDonation.steps.upload')}</span>
          <span className="ai-step-sublabel">Step 1</span>
        </div>
        <div
          className={`ai-step-line ${isUploadCompleted ? 'completed' : ''}`}
        ></div>
        <div
          className={`ai-step ${isReviewActive ? 'active' : ''} ${isReviewCompleted ? 'completed' : ''}`}
        >
          <div className="ai-step-number">
            <FileCheck2 size={16} />
          </div>
          <span className="ai-step-label">{t('aiDonation.steps.review')}</span>
          <span className="ai-step-sublabel">Step 2</span>
        </div>
        <div
          className={`ai-step-line ${isReviewCompleted ? 'completed' : ''}`}
        ></div>
        <div className={`ai-step ${isSubmitActive ? 'active' : ''}`}>
          <div className="ai-step-number">
            <Send size={16} />
          </div>
          <span className="ai-step-label">{t('aiDonation.steps.submit')}</span>
          <span className="ai-step-sublabel">Step 3</span>
        </div>
      </div>

      <div className="ai-form-content">{renderStep()}</div>
    </div>
  );
}
