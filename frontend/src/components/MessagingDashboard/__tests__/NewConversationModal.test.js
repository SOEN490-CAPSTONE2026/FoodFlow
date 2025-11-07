import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import NewConversationModal from '../NewConversationModal';

const mockPost = jest.fn();

jest.mock('../../../services/api', () => ({
  __esModule: true,
  default: {
    post: (...args) => mockPost(...args),
  },
}));

describe('NewConversationModal', () => {
  const mockOnClose = jest.fn();
  const mockOnConversationCreated = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockPost.mockClear();
  });

  test('renders modal with form fields', () => {
    render(
      <NewConversationModal
        onClose={mockOnClose}
        onConversationCreated={mockOnConversationCreated}
      />
    );

    expect(screen.getByText('Start New Conversation')).toBeInTheDocument();
    expect(screen.getByLabelText(/recipient email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start conversation/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  test('closes modal when close button is clicked', () => {
    render(
      <NewConversationModal
        onClose={mockOnClose}
        onConversationCreated={mockOnConversationCreated}
      />
    );

    const closeButton = screen.getByText('×');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('closes modal when cancel button is clicked', () => {
    render(
      <NewConversationModal
        onClose={mockOnClose}
        onConversationCreated={mockOnConversationCreated}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('closes modal when clicking outside', () => {
    render(
      <NewConversationModal
        onClose={mockOnClose}
        onConversationCreated={mockOnConversationCreated}
      />
    );

    const backdrop = screen.getByText('Start New Conversation').closest('.modal-backdrop');
    fireEvent.click(backdrop);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('does not close modal when clicking inside modal content', () => {
    render(
      <NewConversationModal
        onClose={mockOnClose}
        onConversationCreated={mockOnConversationCreated}
      />
    );

    const modalContent = screen.getByText('Start New Conversation').closest('.modal-content');
    fireEvent.click(modalContent);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test('submit button is disabled when email is empty initially', () => {
    render(
      <NewConversationModal
        onClose={mockOnClose}
        onConversationCreated={mockOnConversationCreated}
      />
    );

    const submitButton = screen.getByRole('button', { name: /start conversation/i });
    expect(submitButton).toBeDisabled();
  });

  test('successfully creates conversation', async () => {
    const newConversation = {
      id: 1,
      otherUserName: 'John Doe',
      otherUserEmail: 'john@test.com',
    };

    mockPost.mockResolvedValue({ data: newConversation });

    render(
      <NewConversationModal
        onClose={mockOnClose}
        onConversationCreated={mockOnConversationCreated}
      />
    );

    const emailInput = screen.getByLabelText(/recipient email address/i);
    const submitButton = screen.getByRole('button', { name: /start conversation/i });

    fireEvent.change(emailInput, { target: { value: 'john@test.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/conversations', {
        recipientEmail: 'john@test.com',
      });
      expect(mockOnConversationCreated).toHaveBeenCalledWith(newConversation);
    });
  });

  test('displays error when user not found', async () => {
    mockPost.mockRejectedValue({
      response: { status: 400 },
    });

    render(
      <NewConversationModal
        onClose={mockOnClose}
        onConversationCreated={mockOnConversationCreated}
      />
    );

    const emailInput = screen.getByLabelText(/recipient email address/i);
    const submitButton = screen.getByRole('button', { name: /start conversation/i });

    fireEvent.change(emailInput, { target: { value: 'nonexistent@test.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('User not found or invalid email')).toBeInTheDocument();
    });
  });

  test('displays generic error on network failure', async () => {
    mockPost.mockRejectedValue(new Error('Network error'));

    render(
      <NewConversationModal
        onClose={mockOnClose}
        onConversationCreated={mockOnConversationCreated}
      />
    );

    const emailInput = screen.getByLabelText(/recipient email address/i);
    const submitButton = screen.getByRole('button', { name: /start conversation/i });

    fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to start conversation. Please try again.')).toBeInTheDocument();
    });
  });

  test('disables submit button while loading', async () => {
    mockPost.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <NewConversationModal
        onClose={mockOnClose}
        onConversationCreated={mockOnConversationCreated}
      />
    );

    const emailInput = screen.getByLabelText(/recipient email address/i);
    const submitButton = screen.getByRole('button', { name: /start conversation/i });

    fireEvent.change(emailInput, { target: { value: 'test@test.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /starting.../i })).toBeDisabled();
    });
  });

});
