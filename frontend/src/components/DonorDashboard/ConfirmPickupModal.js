import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Clock } from 'lucide-react';
import { surplusAPI } from '../../services/api';
import './Donor_Styles/ConfirmPickupModal.css';

const ConfirmPickupModal = ({ isOpen, onClose, donationItem, onSuccess }) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toleranceConfig, setToleranceConfig] = useState(null);
  const [pickupTimingInfo, setPickupTimingInfo] = useState(null);

  useEffect(() => {
    if (isOpen) {
      // Fetch tolerance configuration on modal open
      fetchToleranceConfig();
      calculatePickupTimingInfo();
    }
  }, [isOpen, donationItem]);

  const fetchToleranceConfig = async () => {
    try {
      const response = await surplusAPI.getPickupTolerance();
      setToleranceConfig(response.data);
    } catch (err) {
      console.error('Failed to fetch tolerance config:', err);
    }
  };

  const calculatePickupTimingInfo = () => {
    if (!donationItem?.confirmedPickupSlot) {
      setPickupTimingInfo(null);
      return;
    }

    const slot = donationItem.confirmedPickupSlot;
    const date = slot.pickupDate;
    const startTime = slot.startTime;
    const endTime = slot.endTime;

    if (date && startTime && endTime) {
      setPickupTimingInfo({
        date,
        startTime,
        endTime,
      });
    }
  };

  const getPickupWindowStatus = () => {
    if (!pickupTimingInfo || !toleranceConfig) return null;

    const now = new Date();
    const pickupDate = new Date(pickupTimingInfo.date);
    const [startHour, startMin] = pickupTimingInfo.startTime.split(':').map(Number);
    const [endHour, endMin] = pickupTimingInfo.endTime.split(':').map(Number);

    const windowStart = new Date(pickupDate);
    windowStart.setHours(startHour, startMin, 0, 0);

    const windowEnd = new Date(pickupDate);
    windowEnd.setHours(endHour, endMin, 0, 0);

    const earlyBuffer = toleranceConfig.earlyToleranceMinutes * 60 * 1000;
    const lateBuffer = toleranceConfig.lateToleranceMinutes * 60 * 1000;

    const allowedStart = new Date(windowStart.getTime() - earlyBuffer);
    const allowedEnd = new Date(windowEnd.getTime() + lateBuffer);

    if (now < allowedStart) {
      const minutesUntilAllowed = Math.ceil(
        (allowedStart - now) / (60 * 1000)
      );
      return {
        status: 'TOO_EARLY',
        message: `Pickup confirmation not yet available. Please wait ${minutesUntilAllowed} minute(s).`,
        type: 'error',
      };
    } else if (now > allowedEnd) {
      return {
        status: 'TOO_LATE',
        message: 'Pickup confirmation window has expired.',
        type: 'error',
      };
    } else if (now < windowStart) {
      const minutesEarly = Math.floor((windowStart - now) / (60 * 1000));
      return {
        status: 'EARLY',
        message: `You can confirm pickup. (${minutesEarly} minute(s) before scheduled time)`,
        type: 'warning',
      };
    } else if (now > windowEnd) {
      const minutesLate = Math.floor((now - windowEnd) / (60 * 1000));
      return {
        status: 'LATE',
        message: `You can confirm pickup. (${minutesLate} minute(s) after scheduled end)`,
        type: 'warning',
      };
    } else {
      return {
        status: 'ON_TIME',
        message: 'Pickup window is open. Confirm now.',
        type: 'info',
      };
    }
  };

  if (!isOpen) {
    return null;
  }

  const handleCodeChange = (index, value) => {
    // Only allow single digit numbers
    if (value.length > 1 || (value && !/^\d$/.test(value))) {
      return;
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-input-${index + 1}`);
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-input-${index - 1}`);
      if (prevInput) {
        prevInput.focus();
      }
    }
  };

  const handlePaste = e => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6);
    const newCode = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
    setCode(newCode);
  };

  const handleConfirm = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    if (!donationItem || !donationItem.id) {
      setError('Invalid donation item');
      return;
    }

    // Check pickup timing before attempting confirmation
    const timingStatus = getPickupWindowStatus();
    if (timingStatus && (timingStatus.status === 'TOO_EARLY' || timingStatus.status === 'TOO_LATE')) {
      setError(timingStatus.message);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await surplusAPI.completeSurplusPost(donationItem.id, fullCode);

      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Failed to verify code';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMyClaimsClick = () => {
    // TODO: Navigate to My Claims page
    console.log('Navigate to My Claims');
  };

  return (
    <div className="confirm-pickup-overlay" onClick={onClose}>
      <div className="confirm-pickup-modal" onClick={e => e.stopPropagation()}>
        <button className="confirm-pickup-close" onClick={onClose}>
          <X size={20} />
        </button>

        <h2 className="confirm-pickup-title">Confirm Pickup</h2>

        {/* Pickup Window Information Section */}
        {pickupTimingInfo && (
          <div className="confirm-pickup-window-info">
            <div className="confirm-pickup-window-header">
              <Clock size={18} />
              <span>Pickup Window</span>
            </div>
            <div className="confirm-pickup-window-details">
              <p className="pickup-window-date">{pickupTimingInfo.date}</p>
              <p className="pickup-window-time">
                {pickupTimingInfo.startTime} — {pickupTimingInfo.endTime}
              </p>
              {toleranceConfig && (
                <p className="pickup-window-tolerance">
                  Confirmation allowed: up to {toleranceConfig.earlyToleranceMinutes}
                  {' '}min early, {toleranceConfig.lateToleranceMinutes} min late
                </p>
              )}
            </div>
          </div>
        )}

        {/* Timing Status Alert */}
        {(() => {
          const timingStatus = getPickupWindowStatus();
          if (!timingStatus) return null;
          const alertClass = `confirm-pickup-${timingStatus.type}`;
          const IconComponent = timingStatus.type === 'error' || timingStatus.type === 'warning' ? AlertCircle : Clock;
          return (
            <div className={`confirm-pickup-status-alert ${alertClass}`}>
              <IconComponent size={16} />
              <span>{timingStatus.message}</span>
            </div>
          );
        })()}

        <p className="confirm-pickup-subtitle">
          Enter the 6-digit code shown by the receiver:
        </p>

        <div className="confirm-pickup-code-inputs">
          {code.map((digit, index) => (
            <input
              key={index}
              id={`code-input-${index}`}
              type="text"
              inputMode="numeric"
              pattern="\d*"
              maxLength="1"
              value={digit}
              onChange={e => handleCodeChange(index, e.target.value)}
              onKeyDown={e => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              className="confirm-pickup-code-input"
            />
          ))}
        </div>

        {error && <p className="confirm-pickup-error">{error}</p>}

        <p className="confirm-pickup-info">
          The receiver can find this code in their account:{' '}
          <button className="confirm-pickup-link" onClick={handleMyClaimsClick}>
            My Claims
          </button>
        </p>

        <div className="confirm-pickup-actions">
          <button
            className="confirm-pickup-button secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            className="confirm-pickup-button primary"
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Verifying...' : 'Confirm Pickup'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmPickupModal;
