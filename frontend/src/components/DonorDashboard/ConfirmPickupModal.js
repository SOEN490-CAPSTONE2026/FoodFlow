import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { surplusAPI } from '../../services/api';
import './Donor_Styles/ConfirmPickupModal.css';

// Tolerance configuration (in minutes) - should match backend
const EARLY_TOLERANCE_MINUTES = 15;
const LATE_TOLERANCE_MINUTES = 30;

const ConfirmPickupModal = ({ isOpen, onClose, donationItem, onSuccess }) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timingWarning, setTimingWarning] = useState(null);

  useEffect(() => {
    if (!isOpen || !donationItem) {
      return;
    }

    // Get confirmed pickup slot - check both confirmedPickupSlot and direct properties
    const confirmedSlot = donationItem.confirmedPickupSlot;
    const pickupDate = confirmedSlot?.pickupDate || donationItem.pickupDate;
    const startTime = confirmedSlot?.startTime || donationItem.pickupFrom;
    const endTime = confirmedSlot?.endTime || donationItem.pickupTo;

    if (!pickupDate || !startTime || !endTime) {
      setTimingWarning(null);
      return;
    }

    const checkTiming = () => {
      const now = new Date();
      // Parse times - add 'Z' to treat as UTC (same timezone as backend)
      let startTimeStr = `${pickupDate}T${startTime}`;
      let endTimeStr = `${pickupDate}T${endTime}`;
      if (!startTimeStr.endsWith('Z') && !startTimeStr.includes('+')) {
        startTimeStr += 'Z';
        endTimeStr += 'Z';
      }
      const startDateTime = new Date(startTimeStr);
      const endDateTime = new Date(endTimeStr);

      const earlyToleranceMs = EARLY_TOLERANCE_MINUTES * 60 * 1000;
      const lateToleranceMs = LATE_TOLERANCE_MINUTES * 60 * 1000;

      const windowStart = new Date(startDateTime.getTime() - earlyToleranceMs);
      const windowEnd = new Date(endDateTime.getTime() + lateToleranceMs);

      if (now < windowStart) {
        const minutesUntilWindow = Math.ceil((windowStart - now) / 60000);
        const minutesUntilStart = Math.ceil((startDateTime - now) / 60000);
        setTimingWarning({
          type: 'error',
          message: `Pickup window starts in ${minutesUntilStart} minutes. You can confirm up to ${EARLY_TOLERANCE_MINUTES} minutes early.`,
          canConfirm: false,
        });
      } else if (now < startDateTime) {
        const minutesEarly = Math.ceil((startDateTime - now) / 60000);
        setTimingWarning({
          type: 'warning',
          message: `You are confirming ${minutesEarly} minutes before the scheduled pickup time.`,
          canConfirm: true,
        });
      } else if (now > windowEnd) {
        const minutesLate = Math.ceil((now - endDateTime) / 60000);
        setTimingWarning({
          type: 'error',
          message: `Pickup window ended ${minutesLate} minutes ago. Maximum allowed is ${LATE_TOLERANCE_MINUTES} minutes late.`,
          canConfirm: false,
        });
      } else if (now > endDateTime) {
        const minutesLate = Math.ceil((now - endDateTime) / 60000);
        setTimingWarning({
          type: 'warning',
          message: `You are confirming ${minutesLate} minutes after the scheduled pickup window ended.`,
          canConfirm: true,
        });
      } else {
        setTimingWarning(null);
      }
    };

    checkTiming();
    const interval = setInterval(checkTiming, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [isOpen, donationItem]);

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

        {timingWarning && (
          <div
            className={`confirm-pickup-timing-warning ${timingWarning.type}`}
          >
            {timingWarning.message}
          </div>
        )}

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
            disabled={
              isSubmitting || (timingWarning && !timingWarning.canConfirm)
            }
          >
            {isSubmitting ? 'Verifying...' : 'Confirm Pickup'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmPickupModal;
