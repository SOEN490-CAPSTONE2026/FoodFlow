import React, { useEffect, useState } from 'react';
import { X, Star } from 'lucide-react';
import { feedbackAPI } from '../../services/api';
import './FeedbackModal.css';

const FeedbackModal = ({ isOpen, onClose, claimId, targetUser, onSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  useEffect(() => {
    if (!isOpen || !claimId) return;
    // Check if current user can provide feedback for this claim
    const check = async () => {
      try {
        const response = await feedbackAPI.canProvideFeedback(claimId);
        // Backend returns true if user CAN provide feedback, false if already submitted
        const canProvide = response.data === true;
        setAlreadySubmitted(!canProvide);
      } catch (err) {
        console.error('Error checking feedback status:', err);
        // If error, assume they haven't submitted yet
        setAlreadySubmitted(false);
      }
    };
    check();
  }, [isOpen, claimId]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!rating) return;
    setIsSubmitting(true);
    try {
      await feedbackAPI.submitFeedback({
        claimId,
        targetUserId: targetUser?.id,
        rating,
        review: review.trim() || null,
      });
      setAlreadySubmitted(true);
      alert('Thank you for your feedback!');
      if (onSubmitted) onSubmitted();
      onClose();
    } catch (err) {
      console.error('Failed to submit feedback', err);
      alert(err.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="feedback-overlay" onClick={onClose}>
      <div className="feedback-modal" onClick={(e) => e.stopPropagation()}>
        <button className="feedback-close" onClick={onClose}><X size={20} /></button>

        <h2 className="feedback-title">Leave Feedback</h2>
        {targetUser && <p className="feedback-subtitle">Review for {targetUser.name || 'the other user'}</p>}

        {alreadySubmitted ? (
          <div className="feedback-already">
            <p>You have already submitted feedback for this donation.</p>
          </div>
        ) : (
          <>
            <div className="feedback-stars">
              {[1,2,3,4,5].map((i) => (
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
              onChange={(e) => setReview(e.target.value)}
            />

            <div className="feedback-actions">
              <button className="feedback-cancel" onClick={onClose} disabled={isSubmitting}>Cancel</button>
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
