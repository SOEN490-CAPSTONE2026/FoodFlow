import React, { useEffect, useState } from 'react';
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
  const [reviewDraft, setReviewDraft] = useState(null);
  const [extractionError, setExtractionError] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [processingSeconds, setProcessingSeconds] = useState(0);

  const isUploadActive = step === 'upload' || step === 'processing';
  const isUploadCompleted = step === 'review' || step === 'submit';
  const isReviewActive = step === 'review';
  const isReviewCompleted = step === 'submit';
  const isSubmitActive = step === 'submit';

  useEffect(() => {
    if (step !== 'processing') {
      setProcessingSeconds(0);
      return undefined;
    }

    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      setProcessingSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [step]);

  const getExtractionErrorMessage = error => {
    const errorCode = error?.response?.data?.errorCode;
    const serverMessage = error?.response?.data?.errorMessage;

    if (errorCode === 'INVALID_IMAGE') {
      return (
        serverMessage ||
        'The image could not be used. Please upload a clearer photo of the food label.'
      );
    }

    if (errorCode === 'AI_UNAVAILABLE') {
      return 'FoodFlow could not reach the AI service right now. Your current work is safe. Please try again in a moment.';
    }

    if (error?.code === 'ECONNABORTED') {
      return 'Image analysis is taking longer than expected. Your image is still selected, so you can retry without starting over.';
    }

    if (serverMessage) {
      return serverMessage;
    }

    return 'We could not analyze this image. Your current work is still available, so please try again or continue manually.';
  };

  const handleImageUpload = async imageFile => {
    setSelectedImage(imageFile);
    setExtractionError('');
    setReviewError('');
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
        setReviewDraft(null);
        setExtractionError('');
        setStep('review');
        toast.success(t('aiDonation.toast.extractionComplete'));
      } else {
        const errorMessage =
          response.data.errorMessage || getExtractionErrorMessage();
        setExtractionError(errorMessage);
        toast.error(errorMessage);
        setStep(extractedData ? 'review' : 'upload');
      }
    } catch (error) {
      console.error('AI extraction error:', error);
      const errorMessage = getExtractionErrorMessage(error);
      setExtractionError(errorMessage);
      toast.error(errorMessage);
      setStep(extractedData ? 'review' : 'upload');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReUpload = () => {
    setSelectedImage(null);
    setExtractionError('');
    setStep('upload');
  };

  const handleManualEntry = () => {
    navigate('/donor/list');
  };

  const processingStage =
    processingSeconds < 7
      ? 'Reading the image'
      : processingSeconds < 15
        ? 'Analyzing food details'
        : processingSeconds < 24
          ? 'Building your donation draft'
          : 'Still working on the AI draft';

  const renderStep = () => {
    switch (step) {
      case 'upload':
        return (
          <AIImageUpload
            onImageSelect={handleImageUpload}
            onManualEntry={handleManualEntry}
            initialFile={selectedImage}
            externalError={extractionError}
          />
        );

      case 'processing':
        return (
          <div className="ai-processing-container">
            <div className="ai-spinner"></div>
            <h3>{t('aiDonation.processing.title')}</h3>
            <p className="processing-hint">{processingStage}</p>
            <p className="processing-hint">
              {t('aiDonation.processing.hint')} Elapsed: {processingSeconds}s
            </p>
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
            draft={reviewDraft}
            submitError={reviewError}
            onDraftChange={nextDraft => {
              setReviewDraft(nextDraft);
              if (reviewError) {
                setReviewError('');
              }
            }}
            onSubmitStart={() => {
              setReviewError('');
              setStep('submit');
            }}
            onSubmitError={message => {
              setReviewError(message || '');
              setStep('review');
            }}
          />
        );

      case 'submit':
        return (
          <div className="ai-processing-container">
            <div className="ai-spinner"></div>
            <h3>{t('aiDonation.submitting.title')}</h3>
            <p className="processing-hint">{t('aiDonation.submitting.hint')}</p>
            <p className="processing-hint">
              We are saving your donation. If something fails, your edits will
              stay in place.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="ai-donation-form-container"
      data-tour="donor-ai-donation-main"
    >
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
