import React, { useState } from 'react';
import { X } from 'lucide-react';
import './Donor_Styles/ConfirmPickupModal.css';

const ConfirmPickupModal = ({ isOpen, onClose, donationItem, onSuccess }) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleCodeChange = (index, value) => {
    // Only allow single digit numbers
    if (value.length > 1 || (value && !/^\d$/.test(value))) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
    setCode(newCode);
  };

  const handleConfirm = () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }
    
    // TODO: Implement actual verification logic with backend
    console.log('Confirming pickup with code:', fullCode);
    
    // Close this modal and show success modal
    onClose();
    if (onSuccess) {
      onSuccess();
    }
  };

  const handleMyClaimsClick = () => {
    // TODO: Navigate to My Claims page
    console.log('Navigate to My Claims');
  };

  return (
    <div className="confirm-pickup-overlay" onClick={onClose}>
      <div className="confirm-pickup-modal" onClick={(e) => e.stopPropagation()}>
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
              onChange={(e) => handleCodeChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              className="confirm-pickup-code-input"
            />
          ))}
        </div>

        {error && <p className="confirm-pickup-error">{error}</p>}

        <p className="confirm-pickup-info">
          The receiver can find this code in their account:{' '}
          <button 
            className="confirm-pickup-link" 
            onClick={handleMyClaimsClick}
          >
            My Claims
          </button>
        </p>

        <div className="confirm-pickup-actions">
          <button className="confirm-pickup-button secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="confirm-pickup-button primary" onClick={handleConfirm}>
            Confirm Pickup
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmPickupModal;
