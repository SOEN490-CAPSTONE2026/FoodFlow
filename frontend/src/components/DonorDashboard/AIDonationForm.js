import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useLoadScript } from '@react-google-maps/api';
import api from '../../services/api';
import AIImageUpload from './AIImageUpload';
import AIExtractionReview from './AIExtractionReview';
import './Donor_Styles/AIDonation.css';

// Define libraries for Google Maps
const libraries = ['places'];

/**
 * Main component for AI-powered donation creation.
 * Handles the flow: Upload Image → AI Processing → Review & Edit → Submit
 */
export default function AIDonationForm() {
  const navigate = useNavigate();
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: libraries,
  });
  const [step, setStep] = useState('upload'); // upload, processing, review
  const [selectedImage, setSelectedImage] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Handle image upload and trigger AI extraction
   */
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
        timeout: 35000, // 35 second timeout
      });

      if (response.data.success) {
        setExtractedData(response.data);
        setStep('review');
        toast.success(
          'AI extraction completed! Please review and edit the fields.'
        );
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

  /**
   * Handle re-upload request
   */
  const handleReUpload = () => {
    setSelectedImage(null);
    setExtractedData(null);
    setStep('upload');
  };

  /**
   * Handle manual entry fallback
   */
  const handleManualEntry = () => {
    navigate('/donor/list');
  };

  /**
   * Render current step
   */
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
            <h3>AI is analyzing your image...</h3>
            <p className="processing-hint">This may take up to 30 seconds</p>
            <div className="processing-steps">
              <div className="processing-step active">
                <div className="step-icon">📸</div>
                <span>Reading label</span>
              </div>
              <div className="processing-step active">
                <div className="step-icon">🔍</div>
                <span>Extracting data</span>
              </div>
              <div className="processing-step">
                <div className="step-icon">✅</div>
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
              <h3>Loading maps...</h3>
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
          ← Back to Dashboard
        </button>
        <h1>Create Donation with AI</h1>
        <p className="ai-subtitle">
          Upload a photo of your food label and let AI fill out the details
          automatically
        </p>
      </div>

      <div className="ai-step-indicator">
        <div
          className={`step ${step === 'upload' || step === 'processing' || step === 'review' ? 'active' : ''}`}
        >
          <div className="step-number">1</div>
          <span>Upload</span>
        </div>
        <div className="step-line"></div>
        <div className={`step ${step === 'review' ? 'active' : ''}`}>
          <div className="step-number">2</div>
          <span>Review</span>
        </div>
        <div className="step-line"></div>
        <div className="step">
          <div className="step-number">3</div>
          <span>Submit</span>
        </div>
      </div>

      <div className="ai-form-content">{renderStep()}</div>
    </div>
  );
}
