import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: libraries,
  });
  const [step, setStep] = useState('upload');
  const [selectedImage, setSelectedImage] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

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
        toast.success('Extraction complete. Review the details before submit.');
      } else {
        toast.error(response.data.errorMessage || 'AI extraction failed');
        setStep('upload');
      }
    } catch (error) {
      console.error('AI extraction error:', error);

      if (error.response) {
        const errorMsg =
          error.response.data?.errorMessage || 'Failed to analyze image';
        toast.error(errorMsg);
      } else if (error.code === 'ECONNABORTED') {
        toast.error('Request timed out. Please try with a smaller image.');
      } else {
        toast.error(
          'Network error. Please check your connection and try again.'
        );
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
            <h3>Processing image</h3>
            <p className="processing-hint">This can take up to 30 seconds.</p>
            <div className="processing-steps">
              <div className="processing-step active">
                <div className="step-icon">
                  <Upload size={16} />
                </div>
                <span>Reading label</span>
              </div>
              <div className="processing-step active">
                <div className="step-icon">
                  <ScanSearch size={16} />
                </div>
                <span>Extracting data</span>
              </div>
              <div className="processing-step">
                <div className="step-icon">
                  <FileCheck2 size={16} />
                </div>
                <span>Preparing results</span>
              </div>
            </div>
          </div>
        );

      case 'review':
        if (!isLoaded) {
          return (
            <div className="ai-processing-container">
              <div className="ai-spinner"></div>
              <h3>Loading maps</h3>
            </div>
          );
        }
        return (
          <AIExtractionReview
            data={extractedData}
            imageFile={selectedImage}
            onReUpload={handleReUpload}
            onCancel={() => navigate('/donor/dashboard')}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="ai-donation-form-container">
      <div className="ai-donation-header">
        <button
          className="back-button"
          onClick={() => navigate('/donor/dashboard')}
          disabled={isProcessing}
        >
          <ArrowLeft size={16} />
          <span>Back to dashboard</span>
        </button>
        <h1>Create donation with AI</h1>
        <p className="ai-subtitle">
          Upload a label photo to extract product details. You can review before
          submitting.
        </p>
      </div>

      <div className="ai-step-indicator">
        <div
          className={`step ${
            step === 'upload' || step === 'processing' || step === 'review'
              ? 'active'
              : ''
          }`}
        >
          <div className="step-number">
            <Upload size={14} />
          </div>
          <span>Upload</span>
        </div>
        <div className="step-line"></div>
        <div className={`step ${step === 'review' ? 'active' : ''}`}>
          <div className="step-number">
            <FileCheck2 size={14} />
          </div>
          <span>Review</span>
        </div>
        <div className="step-line"></div>
        <div className="step">
          <div className="step-number">
            <Send size={14} />
          </div>
          <span>Submit</span>
        </div>
      </div>

      <div className="ai-form-content">{renderStep()}</div>
    </div>
  );
}
