import React from 'react';
import { X } from 'lucide-react';
import './Donor_Styles/ClaimedSuccessModal.css';

const ClaimedSuccessModal = ({ isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div className="claimed-success-overlay" onClick={onClose}>
        <div
          className="claimed-success-modal"
          onClick={e => e.stopPropagation()}
        >
          <button className="claimed-success-close" onClick={onClose}>
            <X size={24} />
          </button>

          <div className="claimed-success-content">
            <h2 className="claimed-success-title">
              Your donation has been claimed !
            </h2>
            <p className="claimed-success-subtitle">
              Your generosity is making a real difference.
            </p>

            <div className="claimed-success-icon">
              <svg
                width="160"
                height="160"
                viewBox="0 0 160 160"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Heart */}
                <path
                  d="M80 140C80 140 20 110 20 60C20 32 35 15 55 15C67 15 77 22 80 35C83 22 93 15 105 15C125 15 140 32 140 60C140 110 80 140 80 140Z"
                  fill="#A7F3D0"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ClaimedSuccessModal;
