import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthContext } from '../../../contexts/AuthContext';
import FeedbackModal from '../FeedbackModal';

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
});
