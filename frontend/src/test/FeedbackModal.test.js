import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AuthContext } from '../contexts/AuthContext';
import FeedbackModal from '../components/FeedbackModal/FeedbackModal';
import { feedbackAPI } from '../services/api';

jest.mock('../services/api', () => ({
  feedbackAPI: {
    getFeedbackForClaim: jest.fn(),
    submitFeedback: jest.fn(),
  },
}));

jest.mock('lucide-react', () => ({
  X: () => <div data-testid="x-icon">X</div>,
  Star: () => <div data-testid="star-icon">Star</div>,
  CheckCircle2: () => <div data-testid="success-icon">Check</div>,
}));

describe('FeedbackModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    feedbackAPI.getFeedbackForClaim.mockResolvedValue({ data: [] });
  });

  const renderModal = (props = {}, authValue = { userId: 1 }) => {
    const defaultProps = {
      isOpen: true,
      onClose: jest.fn(),
      claimId: 123,
      targetUser: { name: 'Test User' },
      onSubmitted: jest.fn(),
    };

    return render(
      <AuthContext.Provider value={authValue}>
        <FeedbackModal {...defaultProps} {...props} />
      </AuthContext.Provider>
    );
  };

  test('does not render when closed', () => {
    renderModal({ isOpen: false });
    expect(screen.queryByText('Leave Feedback')).not.toBeInTheDocument();
  });

  test('shows the already submitted state when the current reviewer is found', async () => {
    feedbackAPI.getFeedbackForClaim.mockResolvedValue({
      data: [{ reviewerId: '1' }],
    });

    renderModal();

    await waitFor(() => {
      expect(
        screen.getByText(
          'You have already submitted feedback for this donation.'
        )
      ).toBeInTheDocument();
    });
  });

  test('submits feedback successfully with a trimmed review', async () => {
    feedbackAPI.submitFeedback.mockResolvedValue({ data: {} });
    const onClose = jest.fn();
    const onSubmitted = jest.fn();

    renderModal({ onClose, onSubmitted });

    const starButtons = screen.getAllByRole('button');
    fireEvent.click(
      starButtons.find(button => button.className.includes('star-btn'))
    );
    fireEvent.change(
      screen.getByPlaceholderText(
        'Example: Pickup was smooth, communication was clear, and the food was in great condition.'
      ),
      {
        target: { value: '  helpful pickup  ' },
      }
    );
    fireEvent.click(screen.getByRole('button', { name: 'Submit Feedback' }));

    await waitFor(() => {
      expect(feedbackAPI.submitFeedback).toHaveBeenCalledWith({
        claimId: 123,
        rating: 1,
        reviewText: 'helpful pickup',
      });
    });

    expect(
      await screen.findByText('Thank you for helping the FoodFlow community.')
    ).toBeInTheDocument();
    expect(onSubmitted).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  test('does not submit when no rating is selected', () => {
    renderModal();

    fireEvent.click(screen.getByRole('button', { name: 'Submit Feedback' }));
    expect(feedbackAPI.submitFeedback).not.toHaveBeenCalled();
  });

  test('shows the API error message and resets on close', async () => {
    feedbackAPI.submitFeedback.mockRejectedValue({
      response: { data: { message: 'Feedback failed' }, status: 400 },
    });
    const onClose = jest.fn();
    const { container } = renderModal({ onClose });

    const starButtons = screen.getAllByRole('button');
    fireEvent.mouseEnter(
      starButtons.find(button => button.className.includes('star-btn'))
    );
    fireEvent.mouseLeave(
      starButtons.find(button => button.className.includes('star-btn'))
    );
    fireEvent.click(
      starButtons.find(button => button.className.includes('star-btn'))
    );
    fireEvent.click(screen.getByRole('button', { name: 'Submit Feedback' }));

    await waitFor(() => {
      expect(feedbackAPI.submitFeedback).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText('Feedback failed')).toBeInTheDocument();
    });

    fireEvent.click(container.querySelector('.feedback-overlay'));
    expect(onClose).not.toHaveBeenCalled();
  });

  test('does not close when clicking overlay and preserves feedback text', () => {
    const onClose = jest.fn();
    const { container } = renderModal({ onClose });

    const starButtons = screen.getAllByRole('button');
    fireEvent.click(
      starButtons.find(button => button.className.includes('star-btn'))
    );
    const textarea = screen.getByPlaceholderText(
      'Example: Pickup was smooth, communication was clear, and the food was in great condition.'
    );
    fireEvent.change(textarea, { target: { value: 'Keep this feedback' } });

    fireEvent.click(container.querySelector('.feedback-overlay'));

    expect(onClose).not.toHaveBeenCalled();
    expect(textarea).toHaveValue('Keep this feedback');
  });

  test('resets and skips the lookup when claimId or userId is missing', async () => {
    renderModal({ claimId: null }, { userId: null });

    expect(feedbackAPI.getFeedbackForClaim).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: 'Submit Feedback' })
    ).toBeDisabled();
  });
});
