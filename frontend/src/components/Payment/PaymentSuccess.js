import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './PaymentPage.css';

function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [paymentStatus, setPaymentStatus] = useState('loading');

  useEffect(() => {
    const paymentIntent = searchParams.get('payment_intent');
    const paymentIntentClientSecret = searchParams.get(
      'payment_intent_client_secret'
    );
    const redirectStatus = searchParams.get('redirect_status');

    if (redirectStatus === 'succeeded') {
      setPaymentStatus('success');
    } else if (redirectStatus === 'failed') {
      setPaymentStatus('failed');
    } else {
      setPaymentStatus('processing');
    }
  }, [searchParams]);

  const handleReturnHome = () => {
    navigate('/');
  };

  const handleTryAgain = () => {
    navigate('/payment');
  };

  if (paymentStatus === 'loading' || paymentStatus === 'processing') {
    return (
      <div className="payment-page">
        <div className="payment-container success-container">
          <div className="success-icon processing">⏳</div>
          <h1>Processing Your Payment...</h1>
          <p>Please wait while we confirm your donation.</p>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'failed') {
    return (
      <div className="payment-page">
        <div className="payment-container success-container">
          <div className="success-icon failed">❌</div>
          <h1>Payment Failed</h1>
          <p>Unfortunately, your payment could not be processed.</p>
          <p>Please check your payment details and try again.</p>

          <div className="success-actions">
            <button onClick={handleTryAgain} className="primary-btn">
              Try Again
            </button>
            <button onClick={handleReturnHome} className="secondary-btn">
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <div className="payment-container success-container">
        <div className="success-icon">✓</div>
        <h1>Thank You for Your Donation!</h1>
        <p>
          Your generous contribution helps us fight food waste and feed
          communities in need.
        </p>

        <div className="success-details">
          <p>A receipt has been sent to your email address.</p>
          <p className="payment-reference">
            Payment ID: {searchParams.get('payment_intent')?.substring(0, 20)}
            ...
          </p>
        </div>

        <div className="impact-message">
          <h3>Your Impact</h3>
          <p>
            Your donation will help redirect surplus food to those who need it
            most, reducing waste and fighting hunger in your community.
          </p>
        </div>

        <div className="success-actions">
          <button onClick={handleReturnHome} className="primary-btn">
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentSuccess;
