import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import AIImageUpload from '../AIImageUpload';

// Mock dependencies
jest.mock('lucide-react', () => ({
  AlertCircle: () => <span>AlertCircleIcon</span>,
  Camera: () => <span>CameraIcon</span>,
  ChevronRight: () => <span>ChevronRightIcon</span>,
  Check: () => <span>CheckIcon</span>,
  FileImage: () => <span>FileImageIcon</span>,
  FileUp: () => <span>FileUpIcon</span>,
  HardDrive: () => <span>HardDriveIcon</span>,
  PencilLine: () => <span>PencilLineIcon</span>,
  Trash2: () => <span>Trash2Icon</span>,
}));

describe('AIImageUpload', () => {
  const mockOnImageSelect = jest.fn();
  const mockOnManualEntry = jest.fn();

  const renderComponent = (props = {}) => {
    const defaultProps = {
      onImageSelect: mockOnImageSelect,
      onManualEntry: mockOnManualEntry,
    };

    return render(<AIImageUpload {...defaultProps} {...props} />);
  };

  beforeEach(() => {
    jest.clearAllMocks();
    URL.createObjectURL = jest.fn(() => 'mock-url');
    URL.revokeObjectURL = jest.fn();
  });

  test('renders upload instructions', () => {
    renderComponent();

    expect(screen.getByText(/upload label image/i)).toBeInTheDocument();
    expect(screen.getByText(/upload a clear image that includes/i)).toBeInTheDocument();
  });

  test('renders file requirements', () => {
    renderComponent();

    expect(screen.getByText(/jpg, png, heic/i)).toBeInTheDocument();
    expect(screen.getByText(/max 5 mb/i)).toBeInTheDocument();
  });

  test('renders file input', () => {
    renderComponent();

    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute(
      'accept',
      'image/jpeg,image/jpg,image/png,image/heic'
    );
  });

  test('renders dropzone', () => {
    renderComponent();

    const dropzone = document.querySelector('.dropzone');
    expect(dropzone).toBeInTheDocument();
  });

  test('renders upload tips', () => {
    renderComponent();

    expect(screen.getByText(/product name/i)).toBeInTheDocument();
    expect(screen.getByText(/nutrition facts/i)).toBeInTheDocument();
    expect(screen.getByText(/allergen information/i)).toBeInTheDocument();
  });

  test('renders manual entry button', () => {
    renderComponent();

    const manualButton = screen.getByRole('button', {
      name: /continue with manual entry/i,
    });
    expect(manualButton).toBeInTheDocument();
  });

  test('calls onManualEntry when manual entry button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    const manualButton = screen.getByRole('button', {
      name: /continue with manual entry/i,
    });
    await user.click(manualButton);

    expect(mockOnManualEntry).toHaveBeenCalledTimes(1);
  });

  test('renders product label requirements', () => {
    renderComponent();

    expect(screen.getByText(/product name/i)).toBeInTheDocument();
    expect(screen.getByText(/nutrition facts/i)).toBeInTheDocument();
    expect(screen.getByText(/ingredients list/i)).toBeInTheDocument();
    expect(screen.getByText(/expiry or best-before date/i)).toBeInTheDocument();
  });

  test('renders choose file label', () => {
    renderComponent();

    expect(screen.getByText(/choose file/i)).toBeInTheDocument();
  });

  test('renders drag and drop text', () => {
    renderComponent();

    expect(screen.getByText(/drag and drop a label image/i)).toBeInTheDocument();
  });

  test('handles valid file upload', async () => {
    renderComponent();

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('#image-upload');

    await waitFor(() => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await waitFor(() => {
      expect(screen.getByText(/selected file/i)).toBeInTheDocument();
      expect(screen.getByAltText(/label preview/i)).toBeInTheDocument();
    });
  });

  test('shows error for invalid file type', async () => {
    renderComponent();

    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    const fileInput = document.querySelector('#image-upload');

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(
        screen.getByText(/unsupported file type\. use jpg, png, or heic\./i)
      ).toBeInTheDocument();
    });
  });

  test('shows error for oversized file', async () => {
    renderComponent();

    // Create a 6MB file (over 5MB limit)
    const largeFile = new File(['a'.repeat(6 * 1024 * 1024)], 'large.jpg', {
      type: 'image/jpeg',
    });
    const fileInput = document.querySelector('#image-upload');

    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    await waitFor(() => {
      expect(
        screen.getByText(/file size exceeds 5 mb\. select a smaller image\./i)
      ).toBeInTheDocument();
    });
  });

  test('displays file preview with name and size', async () => {
    renderComponent();

    const file = new File(['test'], 'my-image.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('#image-upload');

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('my-image.jpg')).toBeInTheDocument();
      expect(screen.getByText(/MB/i)).toBeInTheDocument();
    });
  });

  test('shows remove button after file selection', async () => {
    renderComponent();

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('#image-upload');

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /remove/i })
      ).toBeInTheDocument();
    });
  });

  test('clears preview when remove button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('#image-upload');

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /remove/i })
      ).toBeInTheDocument();
    });

    const removeButton = screen.getByRole('button', { name: /remove/i });
    await user.click(removeButton);

    await waitFor(() => {
      expect(screen.queryByText(/selected file/i)).not.toBeInTheDocument();
      expect(screen.getByText(/drag and drop/i)).toBeInTheDocument();
    });
  });

  test('shows analyze button after file selection', async () => {
    renderComponent();

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('#image-upload');

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /continue to review/i })
      ).toBeInTheDocument();
    });
  });

  test('calls onImageSelect when analyze button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('#image-upload');

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /continue to review/i })
      ).toBeInTheDocument();
    });

    const analyzeButton = screen.getByRole('button', {
      name: /continue to review/i,
    });
    await user.click(analyzeButton);

    expect(mockOnImageSelect).toHaveBeenCalledTimes(1);
    expect(mockOnImageSelect).toHaveBeenCalledWith(file);
  });

  test('handles drag enter event', () => {
    renderComponent();

    const dropzone = document.querySelector('.dropzone');
    fireEvent.dragEnter(dropzone, {
      dataTransfer: { files: [] },
    });

    expect(dropzone).toHaveClass('dragging');
  });

  test('handles drag leave event', () => {
    renderComponent();

    const dropzone = document.querySelector('.dropzone');
    fireEvent.dragEnter(dropzone, {
      dataTransfer: { files: [] },
    });
    expect(dropzone).toHaveClass('dragging');

    fireEvent.dragLeave(dropzone, {
      dataTransfer: { files: [] },
    });
    expect(dropzone).not.toHaveClass('dragging');
  });

  test('handles file drop', async () => {
    renderComponent();

    const file = new File(['test'], 'dropped.jpg', { type: 'image/jpeg' });
    const dropzone = document.querySelector('.dropzone');

    fireEvent.drop(dropzone, {
      dataTransfer: { files: [file] },
    });

    await waitFor(() => {
      expect(screen.getByText('dropped.jpg')).toBeInTheDocument();
    });
  });

  test('has accessible file input', () => {
    renderComponent();

    const fileInput = document.querySelector('#image-upload');
    expect(fileInput).toBeInTheDocument();
  });
});
