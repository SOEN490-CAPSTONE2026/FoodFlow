import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AuthContext } from '../../../contexts/AuthContext';
import FeedbackModal from '../FeedbackModal';
import { feedbackAPI } from '../../../services/api';

jest.mock('../../../services/api', () => ({
  feedbackAPI: {
    getFeedbackForClaim: jest.fn(() => Promise.resolve({ data: [] })),
    submitFeedback: jest.fn(),
  },
}));

jest.mock('lucide-react', () => ({
  X: () => <div data-testid="x-icon">X</div>,
  Star: () => <div data-testid="star-icon">Star</div>,
}));

describe('FeedbackModal', () => {
  const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
    feedbackAPI.getFeedbackForClaim.mockResolvedValue({ data: [] });
    feedbackAPI.submitFeedback.mockResolvedValue({ data: {} });
  });

  afterAll(() => {
    alertMock.mockRestore();
  });

  const renderModal = (props = {}) => {
    const defaultProps = {
      isOpen: true,
      onClose: jest.fn(),
      claimId: 123,
      targetUser: { name: 'Test User' },
      onSubmitted: jest.fn(),
    };

    return render(
      <AuthContext.Provider value={{ userId: 1 }}>
        <FeedbackModal {...defaultProps} {...props} />
      </AuthContext.Provider>
    );
  };

  test('does not render when closed', () => {
    renderModal({ isOpen: false });
    expect(screen.queryByText('Leave Feedback')).not.toBeInTheDocument();
  });

  test('renders title when open', async () => {
    renderModal();

    await waitFor(() => {
      expect(screen.getByText('Leave Feedback')).toBeInTheDocument();
    });
  });

  test('shows already submitted state when current user already reviewed', async () => {
    feedbackAPI.getFeedbackForClaim.mockResolvedValueOnce({
      data: [{ reviewerId: '1' }],
    });

    renderModal();

    expect(
      await screen.findByText(
        'You have already submitted feedback for this donation.'
      )
    ).toBeInTheDocument();
    expect(screen.queryByText('Submit Feedback')).not.toBeInTheDocument();
  });

  test('submits feedback and closes modal', async () => {
    const onClose = jest.fn();
    const onSubmitted = jest.fn();

    renderModal({ onClose, onSubmitted });

    const stars = await screen.findAllByRole('button');
    fireEvent.click(stars[1]);
    fireEvent.change(screen.getByPlaceholderText('Optional short review'), {
      target: { value: 'Very smooth pickup' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit Feedback' }));

    await waitFor(() => {
      expect(feedbackAPI.submitFeedback).toHaveBeenCalledWith({
        claimId: 123,
        rating: 1,
        reviewText: 'Very smooth pickup',
      });
    });

    expect(alertMock).toHaveBeenCalledWith('Thank you for your feedback!');
    expect(onSubmitted).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  test('does not submit when rating is missing', async () => {
    renderModal();

    await screen.findByText('Leave Feedback');
    fireEvent.click(screen.getByRole('button', { name: 'Submit Feedback' }));

    expect(feedbackAPI.submitFeedback).not.toHaveBeenCalled();
  });

  test('shows API error message when submission fails', async () => {
    feedbackAPI.submitFeedback.mockRejectedValueOnce({
      response: {
        data: {
          message: 'Server rejected feedback',
        },
      },
    });

    renderModal();

    const stars = await screen.findAllByRole('button');
    fireEvent.click(stars[2]);
    fireEvent.click(screen.getByRole('button', { name: 'Submit Feedback' }));

    await waitFor(() => {
      expect(feedbackAPI.submitFeedback).toHaveBeenCalled();
    });

    expect(alertMock).toHaveBeenCalledWith('Server rejected feedback');
  });

  test('falls back when feedback lookup fails and resets state on close', async () => {
    feedbackAPI.getFeedbackForClaim.mockRejectedValueOnce(
      new Error('lookup failed')
    );

    const { rerender } = renderModal();

    const stars = await screen.findAllByRole('button');
    fireEvent.click(stars[4]);
    fireEvent.change(screen.getByPlaceholderText('Optional short review'), {
      target: { value: 'Saved text' },
    });

    rerender(
      <AuthContext.Provider value={{ userId: 1 }}>
        <FeedbackModal
          isOpen={false}
          onClose={jest.fn()}
          claimId={123}
          targetUser={{ name: 'Test User' }}
          onSubmitted={jest.fn()}
        />
      </AuthContext.Provider>
    );

    expect(screen.queryByText('Leave Feedback')).not.toBeInTheDocument();
  });
});
