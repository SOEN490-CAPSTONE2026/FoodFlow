import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MessageNotification from '../MessageNotification';

describe('MessageNotification', () => {
  const mockNotification = {
    senderName: 'Centroide',
    message: 'See you tomorrow at 9 AM',
  };

  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders notification with sender name and message', () => {
    render(
      <MessageNotification
        notification={mockNotification}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText(/New message from Centroide/i)).toBeInTheDocument();
    expect(screen.getByText(/See you tomorrow at 9 AM/i)).toBeInTheDocument();
  });

  it('displays sender name in bold', () => {
    render(
      <MessageNotification
        notification={mockNotification}
        onClose={mockOnClose}
      />
    );

    const header = screen.getByText(/New message from Centroide/i);
    expect(header).toBeInTheDocument();
    // Sender name is wrapped in <strong> tag for bold styling
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <MessageNotification
        notification={mockNotification}
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByRole('button', { name: '×' });
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('auto-dismisses after 5 seconds', () => {
    render(
      <MessageNotification
        notification={mockNotification}
        onClose={mockOnClose}
      />
    );

    expect(mockOnClose).not.toHaveBeenCalled();

    // Fast-forward time by 5 seconds
    jest.advanceTimersByTime(5000);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('does not render when notification is null', () => {
    const { container } = render(
      <MessageNotification notification={null} onClose={mockOnClose} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('does not render when notification is undefined', () => {
    const { container } = render(
      <MessageNotification notification={undefined} onClose={mockOnClose} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders with correct CSS classes', () => {
    render(
      <MessageNotification
        notification={mockNotification}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText(/New message from Centroide/i)).toBeInTheDocument();
    expect(screen.getByText(/See you tomorrow at 9 AM/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '×' })).toBeInTheDocument();
  });

  it('resets timer when notification changes', () => {
    const { rerender } = render(
      <MessageNotification
        notification={mockNotification}
        onClose={mockOnClose}
      />
    );

    // Fast-forward 3 seconds
    jest.advanceTimersByTime(3000);
    expect(mockOnClose).not.toHaveBeenCalled();

    // Change notification
    const newNotification = {
      senderName: 'John Doe',
      message: 'New message',
    };

    rerender(
      <MessageNotification
        notification={newNotification}
        onClose={mockOnClose}
      />
    );

    // Fast-forward 3 more seconds (6 total from original)
    jest.advanceTimersByTime(3000);
    expect(mockOnClose).not.toHaveBeenCalled();

    // Fast-forward 2 more seconds (5 from new notification)
    jest.advanceTimersByTime(2000);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('handles long messages correctly', () => {
    const longNotification = {
      senderName: 'Jane Smith',
      message:
        'This is a very long message that should be displayed correctly in the notification box without breaking the layout or causing any issues with the design.',
    };

    render(
      <MessageNotification
        notification={longNotification}
        onClose={mockOnClose}
      />
    );

    expect(
      screen.getByText(/This is a very long message/i)
    ).toBeInTheDocument();
  });

  it('cleans up timer on unmount', () => {
    const { unmount } = render(
      <MessageNotification
        notification={mockNotification}
        onClose={mockOnClose}
      />
    );

    unmount();

    // Fast-forward time after unmount
    jest.advanceTimersByTime(5000);

    // onClose should not be called after unmount
    expect(mockOnClose).not.toHaveBeenCalled();
  });
});
