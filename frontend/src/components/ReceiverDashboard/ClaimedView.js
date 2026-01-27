import React, { useState, useEffect } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { foodTypeImages, getPrimaryFoodCategory } from '../../constants/foodConstants';
import './Receiver_Styles/ClaimedView.css';

const ClaimedView = ({ claim, isOpen, onClose, onBack }) => {
    const { t } = useTranslation();
    const post = claim?.surplusPost;
    const [timeRemaining, setTimeRemaining] = useState(null);

    useEffect(() => {
        // Get pickup time - prioritize confirmedPickupSlot, fallback to post data
        const pickupDate = claim?.confirmedPickupSlot?.pickupDate || 
                          claim?.confirmedPickupSlot?.date || 
                          post?.pickupDate;
        const pickupFrom = claim?.confirmedPickupSlot?.startTime || 
                          claim?.confirmedPickupSlot?.pickupFrom || 
                          post?.pickupFrom;

        if (!pickupDate || !pickupFrom) return;

        const calculateTimeRemaining = () => {
            const now = new Date();
            // Combine pickupDate (YYYY-MM-DD) and pickupFrom (HH:MM:SS) to create full datetime
            // Add 'Z' to treat as UTC (same timezone as backend scheduler)
            let pickupTimeStr = `${pickupDate}T${pickupFrom}`;
            if (!pickupTimeStr.endsWith('Z') && !pickupTimeStr.includes('+')) {
                pickupTimeStr = pickupTimeStr + 'Z';
            }
            const pickupTime = new Date(pickupTimeStr);
            const diff = pickupTime - now;

            if (diff <= 0) {
                setTimeRemaining({ expired: true });
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeRemaining({ days, hours, minutes, seconds, expired: false });
        };

        calculateTimeRemaining();
        const interval = setInterval(calculateTimeRemaining, 1000);

        return () => clearInterval(interval);
    }, [post?.pickupDate, post?.pickupFrom, isOpen]);

    if (!isOpen || !claim) return null;



    return (
        <div className="claimed-modal-overlay" onClick={onClose}>
            <div className="claimed-modal-container" onClick={(e) => e.stopPropagation()}>
                {/* Close Button */}
                <button className="claimed-modal-close-btn" onClick={onClose}>
                    <X size={24} />
                </button>

                {/* Header with Image */}
                <div className="claimed-modal-header">
                    <img
                        src={foodTypeImages[getPrimaryFoodCategory(post?.foodCategories)] || foodTypeImages['Prepared Meals']}
                        alt={post?.title || 'Donation'}
                        className="claimed-modal-header-image"
                    />
                    <span className="claimed-modal-status-badge claimed-status-claimed">
                        {t('claimedView.claimed')}
                    </span>
                    <div className="claimed-modal-header-overlay">
                        <h2 className="claimed-modal-title">{post?.title || t('claimedView.untitledDonation')}</h2>
                    </div>
                </div>

                {/* Body */}
                <div className="claimed-modal-body">
                    <h3 className="claimed-modal-section-title">{t('claimedView.pickupSteps')}</h3>

                    {/* Step 1 */}
                    <div className="pickup-step">
                        <div className="pickup-step-header">
                            <div className="pickup-step-number">1</div>
                            <div className="pickup-step-content">
                                <h4 className="pickup-step-title">{t('claimedView.reviewPickup.title')}</h4>
                                <p className="pickup-step-description">
                                    {t('claimedView.reviewPickup.description')}
                                </p>
                            </div>
                        </div>
                        {timeRemaining && (
                            <div className="pickup-step-timer">
                                <div className="timer-content">
                                    <div className="timer-display">
                                        {timeRemaining.days > 0 && (
                                            <div className="timer-unit">
                                                <span className="timer-value">{timeRemaining.days}</span>
                                                <span className="timer-unit-label">{timeRemaining.days === 1 ? t('claimedView.timeUnits.day') : t('claimedView.timeUnits.days')}</span>
                                            </div>
                                        )}
                                        <div className="timer-unit">
                                            <span className="timer-value">{String(timeRemaining.hours).padStart(2, '0')}</span>
                                            <span className="timer-unit-label">{t('claimedView.timeUnits.hrs')}</span>
                                        </div>
                                        <div className="timer-separator">:</div>
                                        <div className="timer-unit">
                                            <span className="timer-value">{String(timeRemaining.minutes).padStart(2, '0')}</span>
                                            <span className="timer-unit-label">{t('claimedView.timeUnits.min')}</span>
                                        </div>
                                        <div className="timer-separator">:</div>
                                        <div className="timer-unit">
                                            <span className="timer-value">{String(timeRemaining.seconds).padStart(2, '0')}</span>
                                            <span className="timer-unit-label">{t('claimedView.timeUnits.sec')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Step 2 */}
                    <div className="pickup-step-placeholder">
                        <div className="pickup-step-number-placeholder">2</div>
                        <div className="pickup-step-content">
                            <h4 className="pickup-step-title">Wait for the pickup window to start</h4>
                            <p className="pickup-step-description">
                                Once it starts, your pickup code will appear here.
                            </p>
                            <div className="pickup-code-placeholder">
                                <div className="pickup-dots">
                                    <span className="dot-1">•</span>
                                    <span className="dot-2">•</span>
                                    <span className="dot-3">•</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="pickup-step-placeholder">
                        <div className="pickup-step-number-placeholder">3</div>
                        <div className="pickup-step-content">
                            <h4 className="pickup-step-title">Arrival Confirmation</h4>
                            <p className="pickup-step-description">
                                Make sure to arrive on time and send a quick text to the donor to confirm you're on your way!
                            </p>
                            <div className="pickup-code-placeholder">
                                <div className="pickup-dots">
                                    <span className="dot-1">•</span>
                                    <span className="dot-2">•</span>
                                    <span className="dot-3">•</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="pickup-info-box">
                        Pickup code will unlock when it's time
                    </div>

                    {/* Action Buttons */}
                    <div className="claimed-modal-actions">
                        <button className="claimed-view-btn-back" onClick={onBack}>
                            Back to Details
                        </button>
                        <button className="claimed-view-btn-view">
                            View Pickup Steps
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

        {/* Body */}
        <div className="claimed-modal-body">
          <h3 className="claimed-modal-section-title">Pickup Steps</h3>

          {/* Step 1 */}
          <div className="pickup-step">
            <div className="pickup-step-header">
              <div className="pickup-step-number">1</div>
              <div className="pickup-step-content">
                <h4 className="pickup-step-title">
                  Review pickup time and location
                </h4>
                <p className="pickup-step-description">
                  Be on time to ensure your organization receives this donation.
                </p>
              </div>
            </div>
            {timeRemaining && (
              <div className="pickup-step-timer">
                <div className="timer-content">
                  <div className="timer-display">
                    {timeRemaining.days > 0 && (
                      <div className="timer-unit">
                        <span className="timer-value">
                          {timeRemaining.days}
                        </span>
                        <span className="timer-unit-label">
                          {timeRemaining.days === 1 ? 'day' : 'days'}
                        </span>
                      </div>
                    )}
                    <div className="timer-unit">
                      <span className="timer-value">
                        {String(timeRemaining.hours).padStart(2, '0')}
                      </span>
                      <span className="timer-unit-label">hrs</span>
                    </div>
                    <div className="timer-separator">:</div>
                    <div className="timer-unit">
                      <span className="timer-value">
                        {String(timeRemaining.minutes).padStart(2, '0')}
                      </span>
                      <span className="timer-unit-label">min</span>
                    </div>
                    <div className="timer-separator">:</div>
                    <div className="timer-unit">
                      <span className="timer-value">
                        {String(timeRemaining.seconds).padStart(2, '0')}
                      </span>
                      <span className="timer-unit-label">sec</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* Step 2 */}
          <div className="pickup-step-placeholder">
            <div className="pickup-step-number-placeholder">2</div>
            <div className="pickup-step-content">
              <h4 className="pickup-step-title">
                Wait for the pickup window to start
              </h4>
              <p className="pickup-step-description">
                Once it starts, your pickup code will appear here.
              </p>
              <div className="pickup-code-placeholder">
                <div className="pickup-dots">
                  <span className="dot-1">•</span>
                  <span className="dot-2">•</span>
                  <span className="dot-3">•</span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="pickup-step-placeholder">
            <div className="pickup-step-number-placeholder">3</div>
            <div className="pickup-step-content">
              <h4 className="pickup-step-title">Arrival Confirmation</h4>
              <p className="pickup-step-description">
                Make sure to arrive on time and send a quick text to the donor
                to confirm you're on your way!
              </p>
              <div className="pickup-code-placeholder">
                <div className="pickup-dots">
                  <span className="dot-1">•</span>
                  <span className="dot-2">•</span>
                  <span className="dot-3">•</span>
                </div>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="pickup-info-box">
            Pickup code will unlock when it's time
          </div>
          <div className="pickup-tolerance-info">
            💡 You can arrive up to 15 minutes early or 15 minutes late. The
            pickup code will be available during this window.
          </div>

          {/* Action Buttons */}
          <div className="claimed-modal-actions">
            <button className="claimed-view-btn-back" onClick={onBack}>
              Back to Details
            </button>
            <button className="claimed-view-btn-view">View Pickup Steps</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClaimedView;
