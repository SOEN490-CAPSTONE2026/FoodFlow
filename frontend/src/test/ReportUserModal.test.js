import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import ReportUserModal from '../components/ReportUserModal';

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(
  () => 'blob:http://localhost/mock-blob-url'
);

describe('ReportUserModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn();
  const mockReportedUser = {
    id: '123',
    name: 'John Doe',
  };
  const mockDonationId = 'donation-456';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  test('does not render when isOpen is false', () => {
    render(
      <ReportUserModal
        isOpen={false}
        onClose={mockOnClose}
        reportedUser={mockReportedUser}
        donationId={mockDonationId}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.queryByText('Report User')).not.toBeInTheDocument();
  });

  test('renders modal when isOpen is true', () => {
    render(
      <ReportUserModal
        isOpen={true}
        onClose={mockOnClose}
        reportedUser={mockReportedUser}
        donationId={mockDonationId}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText('Report User')).toBeInTheDocument();
    expect(screen.getByText(/You are reporting/)).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  test('displays donation link message when donationId is provided', () => {
    render(
      <ReportUserModal
        isOpen={true}
        onClose={mockOnClose}
        reportedUser={mockReportedUser}
        donationId={mockDonationId}
        onSubmit={mockOnSubmit}
      />
    );

    expect(
      screen.getByText(/This report will be linked to the donation/)
    ).toBeInTheDocument();
  });

  test('does not display donation link message when donationId is not provided', () => {
    render(
      <ReportUserModal
        isOpen={true}
        onClose={mockOnClose}
        reportedUser={mockReportedUser}
        donationId={null}
        onSubmit={mockOnSubmit}
      />
    );

    expect(
      screen.queryByText(/This report will be linked to the donation/)
    ).not.toBeInTheDocument();
  });

  test('displays "this user" when reportedUser name is not available', () => {
    render(
      <ReportUserModal
        isOpen={true}
        onClose={mockOnClose}
        reportedUser={{ id: '123' }}
        donationId={mockDonationId}
        onSubmit={mockOnSubmit}
      />
    );

    expect(screen.getByText('this user')).toBeInTheDocument();
  });

  test('updates description when typing', () => {
    render(
      <ReportUserModal
        isOpen={true}
        onClose={mockOnClose}
        reportedUser={mockReportedUser}
        donationId={mockDonationId}
        onSubmit={mockOnSubmit}
      />
    );

    const textarea = screen.getByPlaceholderText(
      'Please describe what happened...'
    );
    fireEvent.change(textarea, { target: { value: 'Test description' } });

    expect(textarea).toHaveValue('Test description');
  });

  test('displays character count', () => {
    render(
      <ReportUserModal
        isOpen={true}
        onClose={mockOnClose}
        reportedUser={mockReportedUser}
        donationId={mockDonationId}
        onSubmit={mockOnSubmit}
      />
    );

    const textarea = screen.getByPlaceholderText(
      'Please describe what happened...'
    );
    fireEvent.change(textarea, { target: { value: 'Test' } });

    expect(screen.getByText('4/1000')).toBeInTheDocument();
  });

  test('shows error when file size exceeds 5MB', () => {
    render(
      <ReportUserModal
        isOpen={true}
        onClose={mockOnClose}
        reportedUser={mockReportedUser}
        donationId={mockDonationId}
        onSubmit={mockOnSubmit}
      />
    );

    const file = new File(['a'.repeat(6 * 1024 * 1024)], 'large.jpg', {
      type: 'image/jpeg',
    });
    const fileInput = document.querySelector('input[type="file"]');

    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(
      screen.getByText('Photo size must be less than 5MB')
    ).toBeInTheDocument();
  });

  test('handles valid photo upload', () => {
    const mockFileReader = {
      readAsDataURL: jest.fn(),
      onloadend: null,
    };
    global.FileReader = jest.fn(() => mockFileReader);

    render(
      <ReportUserModal
        isOpen={true}
        onClose={mockOnClose}
        reportedUser={mockReportedUser}
        donationId={mockDonationId}
        onSubmit={mockOnSubmit}
      />
    );

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('input[type="file"]');

    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(file);

    // Simulate FileReader completion
    mockFileReader.onloadend();
  });

  test('displays photo preview after upload', async () => {
    const mockFileReader = {
      readAsDataURL: jest.fn(),
      onloadend: null,
      result: 'data:image/jpeg;base64,mockdata',
    };
    global.FileReader = jest.fn(() => mockFileReader);

    render(
      <ReportUserModal
        isOpen={true}
        onClose={mockOnClose}
        reportedUser={mockReportedUser}
        donationId={mockDonationId}
        onSubmit={mockOnSubmit}
      />
    );

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('input[type="file"]');

    fireEvent.change(fileInput, { target: { files: [file] } });

    // Simulate FileReader completion
    mockFileReader.result = 'data:image/jpeg;base64,mockdata';
    mockFileReader.onloadend();

    await waitFor(() => {
      expect(screen.getByAltText('Evidence preview')).toBeInTheDocument();
    });
  });

  test('removes photo when remove button is clicked', async () => {
    const mockFileReader = {
      readAsDataURL: jest.fn(),
      onloadend: null,
      result: 'data:image/jpeg;base64,mockdata',
    };
    global.FileReader = jest.fn(() => mockFileReader);

    render(
      <ReportUserModal
        isOpen={true}
        onClose={mockOnClose}
        reportedUser={mockReportedUser}
        donationId={mockDonationId}
        onSubmit={mockOnSubmit}
      />
    );

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('input[type="file"]');

    fireEvent.change(fileInput, { target: { files: [file] } });
    mockFileReader.result = 'data:image/jpeg;base64,mockdata';
    mockFileReader.onloadend();

    await waitFor(() => {
      expect(screen.getByAltText('Evidence preview')).toBeInTheDocument();
    });

    const removeButton = screen.getByRole('button', { name: /Remove/i });
    fireEvent.click(removeButton);

    expect(screen.queryByAltText('Evidence preview')).not.toBeInTheDocument();
    expect(screen.getByText('Click to upload photo')).toBeInTheDocument();
  });

  test('shows error when submitting without description', async () => {
    render(
      <ReportUserModal
        isOpen={true}
        onClose={mockOnClose}
        reportedUser={mockReportedUser}
        donationId={mockDonationId}
        onSubmit={mockOnSubmit}
      />
    );

    const textarea = screen.getByPlaceholderText(
      'Please describe what happened...'
    );
    const form = textarea.closest('form');

    // Submit form with empty description
    fireEvent.submit(form);

    await waitFor(() => {
      expect(
        screen.getByText('Please provide a description')
      ).toBeInTheDocument();
    });
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  test('submit button is disabled when description is empty', () => {
    render(
      <ReportUserModal
        isOpen={true}
        onClose={mockOnClose}
        reportedUser={mockReportedUser}
        donationId={mockDonationId}
        onSubmit={mockOnSubmit}
      />
    );

    const submitButton = screen.getByText('Submit Report');
    expect(submitButton).toBeDisabled();
  });

  test('submit button is enabled when description is provided', () => {
    render(
      <ReportUserModal
        isOpen={true}
        onClose={mockOnClose}
        reportedUser={mockReportedUser}
        donationId={mockDonationId}
        onSubmit={mockOnSubmit}
      />
    );

    const textarea = screen.getByPlaceholderText(
      'Please describe what happened...'
    );
    fireEvent.change(textarea, { target: { value: 'Test description' } });

    const submitButton = screen.getByText('Submit Report');
    expect(submitButton).not.toBeDisabled();
  });

  test('successfully submits report without photo', async () => {
    mockOnSubmit.mockResolvedValue();

    render(
      <ReportUserModal
        isOpen={true}
        onClose={mockOnClose}
        reportedUser={mockReportedUser}
        donationId={mockDonationId}
        onSubmit={mockOnSubmit}
      />
    );

    const textarea = screen.getByPlaceholderText(
      'Please describe what happened...'
    );
    fireEvent.change(textarea, {
      target: { value: 'Test report description' },
    });

    const submitButton = screen.getByText('Submit Report');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        reportedUserId: '123',
        donationId: 'donation-456',
        description: 'Test report description',
        photoEvidenceUrl: null,
      });
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('displays error message on submission failure', async () => {
    mockOnSubmit.mockRejectedValue(new Error('Network error'));

    render(
      <ReportUserModal
        isOpen={true}
        onClose={mockOnClose}
        reportedUser={mockReportedUser}
        donationId={mockDonationId}
        onSubmit={mockOnSubmit}
      />
    );

    const textarea = screen.getByPlaceholderText(
      'Please describe what happened...'
    );
    fireEvent.change(textarea, { target: { value: 'Test description' } });

    const submitButton = screen.getByText('Submit Report');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test('displays generic error message on unknown failure', async () => {
    mockOnSubmit.mockRejectedValue({});

    render(
      <ReportUserModal
        isOpen={true}
        onClose={mockOnClose}
        reportedUser={mockReportedUser}
        donationId={mockDonationId}
        onSubmit={mockOnSubmit}
      />
    );

    const textarea = screen.getByPlaceholderText(
      'Please describe what happened...'
    );
    fireEvent.change(textarea, { target: { value: 'Test description' } });

    const submitButton = screen.getByText('Submit Report');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Failed to submit report. Please try again.')
      ).toBeInTheDocument();
    });
  });

  test('shows submitting state during submission', async () => {
    mockOnSubmit.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );

    render(
      <ReportUserModal
        isOpen={true}
        onClose={mockOnClose}
        reportedUser={mockReportedUser}
        donationId={mockDonationId}
        onSubmit={mockOnSubmit}
      />
    );

    const textarea = screen.getByPlaceholderText(
      'Please describe what happened...'
    );
    fireEvent.change(textarea, { target: { value: 'Test description' } });

    const submitButton = screen.getByText('Submit Report');
    fireEvent.click(submitButton);

    expect(screen.getByText('Submitting...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  test('closes modal when close button is clicked', () => {
    render(
      <ReportUserModal
        isOpen={true}
        onClose={mockOnClose}
        reportedUser={mockReportedUser}
        donationId={mockDonationId}
        onSubmit={mockOnSubmit}
      />
    );

    const closeButton = screen.getByRole('button', { name: '' });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('closes modal when cancel button is clicked', () => {
    render(
      <ReportUserModal
        isOpen={true}
        onClose={mockOnClose}
        reportedUser={mockReportedUser}
        donationId={mockDonationId}
        onSubmit={mockOnSubmit}
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('closes modal when clicking overlay', () => {
    render(
      <ReportUserModal
        isOpen={true}
        onClose={mockOnClose}
        reportedUser={mockReportedUser}
        donationId={mockDonationId}
        onSubmit={mockOnSubmit}
      />
    );

    const overlay = document.querySelector('.report-modal-overlay');
    fireEvent.click(overlay);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('does not close modal when clicking modal content', () => {
    render(
      <ReportUserModal
        isOpen={true}
        onClose={mockOnClose}
        reportedUser={mockReportedUser}
        donationId={mockDonationId}
        onSubmit={mockOnSubmit}
      />
    );

    const modalContent = document.querySelector('.report-modal-content');
    fireEvent.click(modalContent);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test('resets form when modal closes after submission', async () => {
    mockOnSubmit.mockResolvedValue();

    const { rerender } = render(
      <ReportUserModal
        isOpen={true}
        onClose={mockOnClose}
        reportedUser={mockReportedUser}
        donationId={mockDonationId}
        onSubmit={mockOnSubmit}
      />
    );

    const textarea = screen.getByPlaceholderText(
      'Please describe what happened...'
    );
    fireEvent.change(textarea, { target: { value: 'Test description' } });

    const submitButton = screen.getByText('Submit Report');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });

    // Reopen modal
    rerender(
      <ReportUserModal
        isOpen={true}
        onClose={mockOnClose}
        reportedUser={mockReportedUser}
        donationId={mockDonationId}
        onSubmit={mockOnSubmit}
      />
    );

    const newTextarea = screen.getByPlaceholderText(
      'Please describe what happened...'
    );
    expect(newTextarea).toHaveValue('');
  });

  test('clears error when uploading valid photo after size error', async () => {
    const mockFileReader = {
      readAsDataURL: jest.fn(),
      onloadend: null,
      result: 'data:image/jpeg;base64,mockdata',
    };
    global.FileReader = jest.fn(() => mockFileReader);

    render(
      <ReportUserModal
        isOpen={true}
        onClose={mockOnClose}
        reportedUser={mockReportedUser}
        donationId={mockDonationId}
        onSubmit={mockOnSubmit}
      />
    );

    const fileInput = document.querySelector('input[type="file"]');

    // Upload large file
    const largeFile = new File(['a'.repeat(6 * 1024 * 1024)], 'large.jpg', {
      type: 'image/jpeg',
    });
    Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 });
    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    await waitFor(() => {
      expect(
        screen.getByText('Photo size must be less than 5MB')
      ).toBeInTheDocument();
    });

    // Upload valid file
    const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(validFile, 'size', { value: 1024 });
    fireEvent.change(fileInput, { target: { files: [validFile] } });

    await waitFor(() => {
      expect(
        screen.queryByText('Photo size must be less than 5MB')
      ).not.toBeInTheDocument();
    });
  });

  test('disables buttons during submission', async () => {
    mockOnSubmit.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );

    render(
      <ReportUserModal
        isOpen={true}
        onClose={mockOnClose}
        reportedUser={mockReportedUser}
        donationId={mockDonationId}
        onSubmit={mockOnSubmit}
      />
    );

    const textarea = screen.getByPlaceholderText(
      'Please describe what happened...'
    );
    fireEvent.change(textarea, { target: { value: 'Test description' } });

    const submitButton = screen.getByText('Submit Report');
    fireEvent.click(submitButton);

    const cancelButton = screen.getByText('Cancel');
    expect(cancelButton).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });
});
