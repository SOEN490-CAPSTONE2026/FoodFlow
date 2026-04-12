import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { CheckCircle2, Star, X } from 'lucide-react';
import { feedbackAPI } from '../../services/api';
import { AuthContext } from '../../contexts/AuthContext';
import './FeedbackModal.css';

const FeedbackModal = ({
  isOpen,
  onClose,
  claimId,
  targetUser,
  onSubmitted,
}) => {
  const { userId } = useContext(AuthContext);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showSuccessState, setShowSuccessState] = useState(false);

  useEffect(() => {
    if (!isOpen || !claimId || !userId) {
      setRating(0);
      setHover(0);
      setReview('');
      setIsSubmitting(false);
      setAlreadySubmitted(false);
      setSubmitError('');
      setShowSuccessState(false);
      return;
    }

    setRating(0);
    setHover(0);
    setReview('');
    setIsSubmitting(false);
    setAlreadySubmitted(false);
    setSubmitError('');
    setShowSuccessState(false);

    const check = async () => {
      try {
        const existingFeedback = await feedbackAPI.getFeedbackForClaim(claimId);
        const hasSubmitted =
          existingFeedback.data &&
          existingFeedback.data.some(feedback => feedback.reviewerId == userId);
        setAlreadySubmitted(hasSubmitted);
      } catch (err) {
        setAlreadySubmitted(false);
      }
    };

    check();
  }, [isOpen, claimId, userId]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async () => {
    if (!rating) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      await feedbackAPI.submitFeedback({
        claimId,
        rating,
        reviewText: review.trim() || null,
      });
      setAlreadySubmitted(true);
      setShowSuccessState(true);
      if (onSubmitted) {
        onSubmitted();
      }
    } catch (err) {
      setSubmitError(
        err.response?.data?.message ||
          err.response?.data ||
          'Failed to submit feedback. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="feedback-overlay">
      <div className="feedback-modal" onClick={e => e.stopPropagation()}>
        <button className="feedback-close" onClick={onClose}>
          <X size={20} />
        </button>

        <h2 className="feedback-title">
          {showSuccessState ? 'Feedback Sent' : 'Leave Feedback'}
        </h2>
        {targetUser && !showSuccessState && (
          <p className="feedback-subtitle">
            Review for {targetUser.name || 'the other user'}
          </p>
        )}

        {showSuccessState ? (
          <div className="feedback-success-state">
            <div className="feedback-success-icon">
              <CheckCircle2 size={40} />
            </div>
            <p className="feedback-success-heading">
              Thank you for helping the FoodFlow community.
            </p>
            <p className="feedback-success-copy">
              Your feedback has been submitted successfully and will help build
              trust for future pickups.
            </p>
            <button
              className="feedback-submit feedback-success-button"
              onClick={onClose}
            >
              Done
            </button>
          </div>
        ) : alreadySubmitted ? (
          <div className="feedback-already">
            <p>You have already submitted feedback for this donation.</p>
          </div>
        ) : (
          <>
            <div className="feedback-stars">
              {[1, 2, 3, 4, 5].map(i => (
                <button
                  key={i}
                  type="button"
                  className={`star-btn ${i <= (hover || rating) ? 'filled' : ''}`}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(i)}
                >
                  <Star />
                </button>
              ))}
            </div>

            <textarea
              className="feedback-textarea"
              placeholder="Example: Pickup was smooth, communication was clear, and the food was in great condition."
              maxLength={500}
              value={review}
              onChange={e => setReview(e.target.value)}
            />

            {submitError && <div className="feedback-error">{submitError}</div>}

            <div className="feedback-actions">
              <button
                className="feedback-cancel"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                className="feedback-submit"
                onClick={handleSubmit}
                disabled={!rating || isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

FeedbackModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  claimId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  targetUser: PropTypes.shape({
    name: PropTypes.string,
  }),
  onSubmitted: PropTypes.func,
};

export default FeedbackModal;
