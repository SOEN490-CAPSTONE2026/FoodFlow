import React, { useEffect, useState, useContext } from 'react';
import { X, Star } from 'lucide-react';
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

  useEffect(() => {
    if (!isOpen || !claimId || !userId) {
      // Reset state if modal closes or claimId/userId is missing
      setAlreadySubmitted(false);
      return;
    }
    // Check if current user has already provided feedback for this claim
    const check = async () => {
      try {
        // Get all feedback for this claim
        const existingFeedback = await feedbackAPI.getFeedbackForClaim(claimId);
        console.log('Existing feedback for claim:', existingFeedback.data);

        // Check if the current user has already submitted feedback
        // (their userId should match a reviewerId in the feedback list)
        // Use == instead of === to handle string vs number comparison
        const hasSubmitted =
          existingFeedback.data &&
          existingFeedback.data.some(feedback => {
            console.log(
              'Comparing reviewerId:',
              feedback.reviewerId,
              'type:',
              typeof feedback.reviewerId,
              'with userId:',
              userId,
              'type:',
              typeof userId
            );
            return feedback.reviewerId == userId; // Use == for type coercion
          });
        setAlreadySubmitted(hasSubmitted);
      } catch (err) {
        // If error (like 404 or 500), assume they haven't submitted yet
        setAlreadySubmitted(false);
      }
    };
    check();
  }, [isOpen, claimId, userId]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async () => {
    console.log('🎯 Submit button clicked');
    console.log('🎯 Current rating:', rating);
    console.log('🎯 Current review:', review);
    console.log('🎯 Claim ID:', claimId);

    if (!rating) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        claimId,
        rating,
        reviewText: review.trim() || null,
      };
      const response = await feedbackAPI.submitFeedback(payload);
      setAlreadySubmitted(true);
      alert('Thank you for your feedback!');
      if (onSubmitted) {
        onSubmitted();
      }
      onClose();
    } catch (err) {
      alert(
        err.response?.data?.message ||
          err.response?.data ||
          'Failed to submit feedback. Please try again.'
      );
      console.error('❌ Failed to submit feedback', err);
      console.error('❌ Error response:', err.response);
      console.error('❌ Error status:', err.response?.status);
      console.error('❌ Error data:', err.response?.data);
      alert(
        err.response?.data?.message ||
          err.response?.data ||
          'Failed to submit feedback. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="feedback-overlay" onClick={onClose}>
      <div className="feedback-modal" onClick={e => e.stopPropagation()}>
        <button className="feedback-close" onClick={onClose}>
          <X size={20} />
        </button>

        <h2 className="feedback-title">Leave Feedback</h2>
        {targetUser && (
          <p className="feedback-subtitle">
            Review for {targetUser.name || 'the other user'}
          </p>
        )}

        {alreadySubmitted ? (
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
              placeholder="Optional short review"
              maxLength={500}
              value={review}
              onChange={e => setReview(e.target.value)}
            />

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

export default FeedbackModal;
