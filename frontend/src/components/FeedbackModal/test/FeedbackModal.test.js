import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import FeedbackModal from '../FeedbackModal';
import { feedbackAPI } from '../../../services/api';
import { AuthContext } from '../../../contexts/AuthContext';

// Mock the API
jest.mock('../../../services/api', () => ({
  feedbackAPI: {
    submitFeedback: jest.fn(),
    getFeedbackForClaim: jest.fn(),
  },
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  X: () => <svg data-testid="x-icon" />,
  Star: () => <svg data-testid="star-icon" />,
}));

describe('FeedbackModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSubmitted = jest.fn();
  const mockTargetUser = { id: 2, name: 'John Doe' };
  const mockClaimId = 123;
  const mockUserId = 1;

  // Mock window.alert
  const originalAlert = window.alert;

  beforeAll(() => {
    window.alert = jest.fn();
  });

  afterAll(() => {
    window.alert = originalAlert;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    feedbackAPI.getFeedbackForClaim.mockResolvedValue({ data: [] });
  });

  const renderModal = (props = {}) => {
    const defaultProps = {
      isOpen: true,
      onClose: mockOnClose,
      claimId: mockClaimId,
      targetUser: mockTargetUser,
      onSubmitted: mockOnSubmitted,
    };

    return render(
      <AuthContext.Provider value={{ userId: mockUserId }}>
        <FeedbackModal {...defaultProps} {...props} />
      </AuthContext.Provider>
    );
  };

  describe('Rendering', () => {
    test('should not render when isOpen is false', () => {
      const { container } = renderModal({ isOpen: false });
      expect(container.firstChild).toBeNull();
    });

    test('should render modal when isOpen is true', () => {
      renderModal();
      expect(screen.getByText('Leave Feedback')).toBeInTheDocument();
    });

    test('should render title correctly', () => {
      renderModal();
      expect(screen.getByText('Leave Feedback')).toHaveClass('feedback-title');
    });

    test('should render subtitle with target user name', () => {
      renderModal();
      expect(screen.getByText(/Review for John Doe/i)).toBeInTheDocument();
    });

    test('should render subtitle with default text when no target user name', () => {
      renderModal({ targetUser: { id: 2 } });
      expect(
        screen.getByText(/Review for the other user/i)
      ).toBeInTheDocument();
    });

    test('should not render subtitle when no target user', () => {
      renderModal({ targetUser: null });
      expect(screen.queryByText(/Review for/i)).not.toBeInTheDocument();
    });

    test('should render close button with X icon', () => {
      const { container } = renderModal();
      const closeButton = container.querySelector('.feedback-close');
      expect(closeButton).toBeInTheDocument();
      expect(closeButton.tagName).toBe('BUTTON');
      expect(within(closeButton).getByTestId('x-icon')).toBeInTheDocument();
    });

    test('should render 5 star buttons', () => {
      renderModal();
      const starButtons = screen
        .getAllByRole('button', { name: '' })
        .filter(btn => btn.className.includes('star-btn'));
      expect(starButtons).toHaveLength(5);
    });

    test('should render textarea for review', () => {
      renderModal();
      const textarea = screen.getByPlaceholderText('Optional short review');
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveClass('feedback-textarea');
      expect(textarea).toHaveAttribute('maxLength', '500');
    });

    test('should render Cancel button', () => {
      renderModal();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toHaveClass('feedback-cancel');
    });

    test('should render Submit button', () => {
      renderModal();
      expect(screen.getByText('Submit Feedback')).toBeInTheDocument();
      expect(screen.getByText('Submit Feedback')).toHaveClass(
        'feedback-submit'
      );
    });

    test('should render overlay', () => {
      const { container } = renderModal();
      expect(container.querySelector('.feedback-overlay')).toBeInTheDocument();
    });

    test('should render modal content', () => {
      const { container } = renderModal();
      expect(container.querySelector('.feedback-modal')).toBeInTheDocument();
    });
  });

  describe('Feedback Check on Mount', () => {
    test('should check for existing feedback when modal opens', async () => {
      renderModal();

      await waitFor(() => {
        expect(feedbackAPI.getFeedbackForClaim).toHaveBeenCalledWith(
          mockClaimId
        );
      });
    });

    test('should not check feedback when isOpen is false', () => {
      renderModal({ isOpen: false });
      expect(feedbackAPI.getFeedbackForClaim).not.toHaveBeenCalled();
    });

    test('should not check feedback when claimId is missing', () => {
      renderModal({ claimId: null });
      expect(feedbackAPI.getFeedbackForClaim).not.toHaveBeenCalled();
    });

    test('should not check feedback when userId is missing', () => {
      render(
        <AuthContext.Provider value={{ userId: null }}>
          <FeedbackModal
            isOpen={true}
            onClose={mockOnClose}
            claimId={mockClaimId}
            targetUser={mockTargetUser}
            onSubmitted={mockOnSubmitted}
          />
        </AuthContext.Provider>
      );
      expect(feedbackAPI.getFeedbackForClaim).not.toHaveBeenCalled();
    });

    test('should show already submitted message when user has already given feedback', async () => {
      feedbackAPI.getFeedbackForClaim.mockResolvedValue({
        data: [{ reviewerId: mockUserId, rating: 5, reviewText: 'Great!' }],
      });

      renderModal();

      await waitFor(() => {
        expect(
          screen.getByText(
            /You have already submitted feedback for this donation/i
          )
        ).toBeInTheDocument();
      });

      // Should not show rating stars or textarea
      expect(
        screen.queryByPlaceholderText('Optional short review')
      ).not.toBeInTheDocument();
      expect(screen.queryByText('Submit Feedback')).not.toBeInTheDocument();
    });

    test('should handle type coercion when checking existing feedback (string vs number)', async () => {
      feedbackAPI.getFeedbackForClaim.mockResolvedValue({
        data: [{ reviewerId: '1', rating: 5, reviewText: 'Great!' }], // String ID
      });

      renderModal();

      await waitFor(() => {
        expect(
          screen.getByText(
            /You have already submitted feedback for this donation/i
          )
        ).toBeInTheDocument();
      });
    });

    test('should not show already submitted when user has not given feedback', async () => {
      feedbackAPI.getFeedbackForClaim.mockResolvedValue({
        data: [{ reviewerId: 999, rating: 4 }], // Different user
      });

      renderModal();

      await waitFor(() => {
        expect(
          screen.queryByText(
            /You have already submitted feedback for this donation/i
          )
        ).not.toBeInTheDocument();
      });

      expect(
        screen.getByPlaceholderText('Optional short review')
      ).toBeInTheDocument();
    });

    test('should handle error when checking feedback and allow submission', async () => {
      feedbackAPI.getFeedbackForClaim.mockRejectedValue(new Error('API Error'));

      renderModal();

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText('Optional short review')
        ).toBeInTheDocument();
      });
    });

    test('should reset alreadySubmitted state when modal closes', async () => {
      feedbackAPI.getFeedbackForClaim.mockResolvedValue({
        data: [{ reviewerId: mockUserId, rating: 5 }],
      });

      const { rerender } = renderModal();

      await waitFor(() => {
        expect(
          screen.getByText(/You have already submitted feedback/i)
        ).toBeInTheDocument();
      });

      // Close modal
      rerender(
        <AuthContext.Provider value={{ userId: mockUserId }}>
          <FeedbackModal
            isOpen={false}
            onClose={mockOnClose}
            claimId={mockClaimId}
            targetUser={mockTargetUser}
            onSubmitted={mockOnSubmitted}
          />
        </AuthContext.Provider>
      );

      // Reopen with different claim (no existing feedback)
      feedbackAPI.getFeedbackForClaim.mockResolvedValue({ data: [] });
      rerender(
        <AuthContext.Provider value={{ userId: mockUserId }}>
          <FeedbackModal
            isOpen={true}
            onClose={mockOnClose}
            claimId={456}
            targetUser={mockTargetUser}
            onSubmitted={mockOnSubmitted}
          />
        </AuthContext.Provider>
      );

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText('Optional short review')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Star Rating Interaction', () => {
    test('should allow selecting a rating by clicking stars', async () => {
      const user = userEvent.setup();
      renderModal();

      await waitFor(() => {
        expect(feedbackAPI.getFeedbackForClaim).toHaveBeenCalled();
      });

      const starButtons = screen
        .getAllByRole('button')
        .filter(btn => btn.className.includes('star-btn'));

      await user.click(starButtons[2]); // Click 3rd star (rating 3)

      expect(starButtons[0]).toHaveClass('filled');
      expect(starButtons[1]).toHaveClass('filled');
      expect(starButtons[2]).toHaveClass('filled');
      expect(starButtons[3]).not.toHaveClass('filled');
      expect(starButtons[4]).not.toHaveClass('filled');
    });

    test('should show hover effect on stars', async () => {
      const user = userEvent.setup();
      renderModal();

      await waitFor(() => {
        expect(feedbackAPI.getFeedbackForClaim).toHaveBeenCalled();
      });

      const starButtons = screen
        .getAllByRole('button')
        .filter(btn => btn.className.includes('star-btn'));

      await user.hover(starButtons[3]); // Hover on 4th star

      expect(starButtons[0]).toHaveClass('filled');
      expect(starButtons[1]).toHaveClass('filled');
      expect(starButtons[2]).toHaveClass('filled');
      expect(starButtons[3]).toHaveClass('filled');
      expect(starButtons[4]).not.toHaveClass('filled');
    });

    test('should remove hover effect when mouse leaves', async () => {
      const user = userEvent.setup();
      renderModal();

      await waitFor(() => {
        expect(feedbackAPI.getFeedbackForClaim).toHaveBeenCalled();
      });

      const starButtons = screen
        .getAllByRole('button')
        .filter(btn => btn.className.includes('star-btn'));

      // Click 2 stars
      await user.click(starButtons[1]);
      expect(starButtons[1]).toHaveClass('filled');

      // Hover on 4 stars
      await user.hover(starButtons[3]);
      expect(starButtons[3]).toHaveClass('filled');

      // Unhover - should go back to clicked rating (2 stars)
      await user.unhover(starButtons[3]);
      expect(starButtons[1]).toHaveClass('filled');
      expect(starButtons[3]).not.toHaveClass('filled');
    });

    test('should update rating when clicking different star', async () => {
      const user = userEvent.setup();
      renderModal();

      await waitFor(() => {
        expect(feedbackAPI.getFeedbackForClaim).toHaveBeenCalled();
      });

      const starButtons = screen
        .getAllByRole('button')
        .filter(btn => btn.className.includes('star-btn'));

      await user.click(starButtons[4]); // 5 stars
      expect(starButtons[4]).toHaveClass('filled');

      await user.click(starButtons[1]); // Change to 2 stars
      expect(starButtons[1]).toHaveClass('filled');
      expect(starButtons[4]).not.toHaveClass('filled');
    });
  });

  describe('Review Text Input', () => {
    test('should allow typing in review textarea', async () => {
      const user = userEvent.setup();
      renderModal();

      await waitFor(() => {
        expect(feedbackAPI.getFeedbackForClaim).toHaveBeenCalled();
      });

      const textarea = screen.getByPlaceholderText('Optional short review');
      await user.type(textarea, 'Great service!');

      expect(textarea).toHaveValue('Great service!');
    });

    test('should respect maxLength of 500 characters', () => {
      renderModal();
      const textarea = screen.getByPlaceholderText('Optional short review');
      expect(textarea).toHaveAttribute('maxLength', '500');
    });
  });

  describe('Modal Close Interactions', () => {
    test('should call onClose when clicking close button', async () => {
      const user = userEvent.setup();
      renderModal();

      await waitFor(() => {
        expect(feedbackAPI.getFeedbackForClaim).toHaveBeenCalled();
      });

      const closeButton = screen
        .getAllByRole('button')
        .find(btn => btn.className.includes('feedback-close'));
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('should call onClose when clicking Cancel button', async () => {
      const user = userEvent.setup();
      renderModal();

      await waitFor(() => {
        expect(feedbackAPI.getFeedbackForClaim).toHaveBeenCalled();
      });

      await user.click(screen.getByText('Cancel'));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('should call onClose when clicking overlay', async () => {
      const user = userEvent.setup();
      const { container } = renderModal();

      await waitFor(() => {
        expect(feedbackAPI.getFeedbackForClaim).toHaveBeenCalled();
      });

      const overlay = container.querySelector('.feedback-overlay');
      await user.click(overlay);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('should not call onClose when clicking modal content', async () => {
      const user = userEvent.setup();
      const { container } = renderModal();

      await waitFor(() => {
        expect(feedbackAPI.getFeedbackForClaim).toHaveBeenCalled();
      });

      const modalContent = container.querySelector('.feedback-modal');
      await user.click(modalContent);

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    test('should disable submit button when no rating selected', async () => {
      renderModal();

      await waitFor(() => {
        expect(feedbackAPI.getFeedbackForClaim).toHaveBeenCalled();
      });

      const submitButton = screen.getByText('Submit Feedback');
      expect(submitButton).toBeDisabled();
    });

    test('should enable submit button when rating is selected', async () => {
      const user = userEvent.setup();
      renderModal();

      await waitFor(() => {
        expect(feedbackAPI.getFeedbackForClaim).toHaveBeenCalled();
      });

      const starButtons = screen
        .getAllByRole('button')
        .filter(btn => btn.className.includes('star-btn'));
      await user.click(starButtons[2]);

      const submitButton = screen.getByText('Submit Feedback');
      expect(submitButton).not.toBeDisabled();
    });

    test('should successfully submit feedback with rating only', async () => {
      const user = userEvent.setup();
      feedbackAPI.submitFeedback.mockResolvedValue({ data: { success: true } });

      renderModal();

      await waitFor(() => {
        expect(feedbackAPI.getFeedbackForClaim).toHaveBeenCalled();
      });

      // Select 4 stars
      const starButtons = screen
        .getAllByRole('button')
        .filter(btn => btn.className.includes('star-btn'));
      await user.click(starButtons[3]);

      // Submit
      await user.click(screen.getByText('Submit Feedback'));

      await waitFor(() => {
        expect(feedbackAPI.submitFeedback).toHaveBeenCalledWith({
          claimId: mockClaimId,
          rating: 4,
          reviewText: null,
        });
      });

      expect(window.alert).toHaveBeenCalledWith('Thank you for your feedback!');
      expect(mockOnSubmitted).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });

    test('should successfully submit feedback with rating and review', async () => {
      const user = userEvent.setup();
      feedbackAPI.submitFeedback.mockResolvedValue({ data: { success: true } });

      renderModal();

      await waitFor(() => {
        expect(feedbackAPI.getFeedbackForClaim).toHaveBeenCalled();
      });

      // Select 5 stars
      const starButtons = screen
        .getAllByRole('button')
        .filter(btn => btn.className.includes('star-btn'));
      await user.click(starButtons[4]);

      // Type review
      const textarea = screen.getByPlaceholderText('Optional short review');
      await user.type(textarea, 'Excellent experience!');

      // Submit
      await user.click(screen.getByText('Submit Feedback'));

      await waitFor(() => {
        expect(feedbackAPI.submitFeedback).toHaveBeenCalledWith({
          claimId: mockClaimId,
          rating: 5,
          reviewText: 'Excellent experience!',
        });
      });

      expect(window.alert).toHaveBeenCalledWith('Thank you for your feedback!');
      expect(mockOnSubmitted).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });

    test('should trim whitespace from review text', async () => {
      const user = userEvent.setup();
      feedbackAPI.submitFeedback.mockResolvedValue({ data: { success: true } });

      renderModal();

      await waitFor(() => {
        expect(feedbackAPI.getFeedbackForClaim).toHaveBeenCalled();
      });

      const starButtons = screen
        .getAllByRole('button')
        .filter(btn => btn.className.includes('star-btn'));
      await user.click(starButtons[2]);

      const textarea = screen.getByPlaceholderText('Optional short review');
      await user.type(textarea, '  Good service  ');

      await user.click(screen.getByText('Submit Feedback'));

      await waitFor(() => {
        expect(feedbackAPI.submitFeedback).toHaveBeenCalledWith({
          claimId: mockClaimId,
          rating: 3,
          reviewText: 'Good service',
        });
      });
    });

    test('should send null for empty review text', async () => {
      const user = userEvent.setup();
      feedbackAPI.submitFeedback.mockResolvedValue({ data: { success: true } });

      renderModal();

      await waitFor(() => {
        expect(feedbackAPI.getFeedbackForClaim).toHaveBeenCalled();
      });

      const starButtons = screen
        .getAllByRole('button')
        .filter(btn => btn.className.includes('star-btn'));
      await user.click(starButtons[2]);

      const textarea = screen.getByPlaceholderText('Optional short review');
      await user.type(textarea, '   '); // Only whitespace

      await user.click(screen.getByText('Submit Feedback'));

      await waitFor(() => {
        expect(feedbackAPI.submitFeedback).toHaveBeenCalledWith({
          claimId: mockClaimId,
          rating: 3,
          reviewText: null,
        });
      });
    });

    test('should show submitting state during submission', async () => {
      const user = userEvent.setup();
      let resolveSubmit;
      feedbackAPI.submitFeedback.mockReturnValue(
        new Promise(resolve => {
          resolveSubmit = resolve;
        })
      );

      renderModal();

      await waitFor(() => {
        expect(feedbackAPI.getFeedbackForClaim).toHaveBeenCalled();
      });

      const starButtons = screen
        .getAllByRole('button')
        .filter(btn => btn.className.includes('star-btn'));
      await user.click(starButtons[2]);

      const submitButton = screen.getByText('Submit Feedback');
      await user.click(submitButton);

      // Check submitting state
      await waitFor(() => {
        expect(screen.getByText('Submitting...')).toBeInTheDocument();
      });

      expect(screen.getByText('Submitting...')).toBeDisabled();
      expect(screen.getByText('Cancel')).toBeDisabled();

      // Resolve the promise
      resolveSubmit({ data: { success: true } });
    });

    test('should handle submission error with message from response data object', async () => {
      const user = userEvent.setup();
      feedbackAPI.submitFeedback.mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Invalid rating provided' },
        },
      });

      renderModal();

      await waitFor(() => {
        expect(feedbackAPI.getFeedbackForClaim).toHaveBeenCalled();
      });

      const starButtons = screen
        .getAllByRole('button')
        .filter(btn => btn.className.includes('star-btn'));
      await user.click(starButtons[2]);

      await user.click(screen.getByText('Submit Feedback'));

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Invalid rating provided');
      });

      // Should not call onSubmitted or onClose on error
      expect(mockOnSubmitted).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    test('should handle submission error with message from response data string', async () => {
      const user = userEvent.setup();
      feedbackAPI.submitFeedback.mockRejectedValue({
        response: {
          status: 500,
          data: 'Internal server error',
        },
      });

      renderModal();

      await waitFor(() => {
        expect(feedbackAPI.getFeedbackForClaim).toHaveBeenCalled();
      });

      const starButtons = screen
        .getAllByRole('button')
        .filter(btn => btn.className.includes('star-btn'));
      await user.click(starButtons[2]);

      await user.click(screen.getByText('Submit Feedback'));

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Internal server error');
      });
    });

    test('should handle submission error with default message', async () => {
      const user = userEvent.setup();
      feedbackAPI.submitFeedback.mockRejectedValue(new Error('Network error'));

      renderModal();

      await waitFor(() => {
        expect(feedbackAPI.getFeedbackForClaim).toHaveBeenCalled();
      });

      const starButtons = screen
        .getAllByRole('button')
        .filter(btn => btn.className.includes('star-btn'));
      await user.click(starButtons[2]);

      await user.click(screen.getByText('Submit Feedback'));

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(
          'Failed to submit feedback. Please try again.'
        );
      });
    });

    test('should not submit when submit button is clicked without rating', async () => {
      const user = userEvent.setup();
      renderModal();

      await waitFor(() => {
        expect(feedbackAPI.getFeedbackForClaim).toHaveBeenCalled();
      });

      const submitButton = screen.getByText('Submit Feedback');
      expect(submitButton).toBeDisabled();

      // Try to click (won't work because disabled)
      await user.click(submitButton);

      expect(feedbackAPI.submitFeedback).not.toHaveBeenCalled();
    });

    test('should work without onSubmitted callback', async () => {
      const user = userEvent.setup();
      feedbackAPI.submitFeedback.mockResolvedValue({ data: { success: true } });

      render(
        <AuthContext.Provider value={{ userId: mockUserId }}>
          <FeedbackModal
            isOpen={true}
            onClose={mockOnClose}
            claimId={mockClaimId}
            targetUser={mockTargetUser}
            onSubmitted={null}
          />
        </AuthContext.Provider>
      );

      await waitFor(() => {
        expect(feedbackAPI.getFeedbackForClaim).toHaveBeenCalled();
      });

      const starButtons = screen
        .getAllByRole('button')
        .filter(btn => btn.className.includes('star-btn'));
      await user.click(starButtons[2]);

      await user.click(screen.getByText('Submit Feedback'));

      await waitFor(() => {
        expect(feedbackAPI.submitFeedback).toHaveBeenCalled();
      });

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Already Submitted State', () => {
    test('should not show form elements when already submitted', async () => {
      feedbackAPI.getFeedbackForClaim.mockResolvedValue({
        data: [{ reviewerId: mockUserId, rating: 5 }],
      });

      renderModal();

      await waitFor(() => {
        expect(
          screen.getByText(/You have already submitted feedback/i)
        ).toBeInTheDocument();
      });

      expect(
        screen.queryByPlaceholderText('Optional short review')
      ).not.toBeInTheDocument();
      expect(screen.queryByText('Submit Feedback')).not.toBeInTheDocument();
      expect(screen.queryByText('Cancel')).not.toBeInTheDocument();

      const starButtons = screen
        .queryAllByRole('button')
        .filter(btn => btn.className.includes('star-btn'));
      expect(starButtons).toHaveLength(0);
    });

    test('should still show close button when already submitted', async () => {
      feedbackAPI.getFeedbackForClaim.mockResolvedValue({
        data: [{ reviewerId: mockUserId, rating: 5 }],
      });

      renderModal();

      await waitFor(() => {
        expect(
          screen.getByText(/You have already submitted feedback/i)
        ).toBeInTheDocument();
      });

      const closeButton = screen
        .getAllByRole('button')
        .find(btn => btn.className.includes('feedback-close'));
      expect(closeButton).toBeInTheDocument();
    });
  });
});
