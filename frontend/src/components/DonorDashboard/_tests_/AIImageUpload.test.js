import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import AIImageUpload from '../AIImageUpload';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: key => key,
    i18n: { language: 'en' },
  }),
}));

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

  const renderComponent = () =>
    render(
      <AIImageUpload
        onImageSelect={mockOnImageSelect}
        onManualEntry={mockOnManualEntry}
      />
    );

  beforeEach(() => {
    jest.clearAllMocks();
    URL.createObjectURL = jest.fn(() => 'mock-url');
    URL.revokeObjectURL = jest.fn();
    global.FileReader = class {
      constructor() {
        this.result = 'data:image/jpeg;base64,mocked';
        this.onloadend = null;
      }
      readAsDataURL() {
        if (typeof this.onloadend === 'function') {
          this.onloadend();
        }
      }
    };
  });

  test('renders initial upload state', () => {
    renderComponent();
    expect(screen.getByText('aiDonation.upload.title')).toBeInTheDocument();
    expect(screen.getByText('aiDonation.upload.subtitle')).toBeInTheDocument();
    expect(
      screen.getByText('aiDonation.upload.chooseFile')
    ).toBeInTheDocument();
    expect(
      screen.getByText('aiDonation.upload.manualEntry')
    ).toBeInTheDocument();
  });

  test('calls onManualEntry when manual button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(
      screen.getByRole('button', { name: /aidonation\.upload\.manualentry/i })
    );

    expect(mockOnManualEntry).toHaveBeenCalledTimes(1);
  });

  test('shows error for invalid file type', async () => {
    renderComponent();

    const file = new File(['test'], 'bad.txt', { type: 'text/plain' });
    fireEvent.change(document.querySelector('#image-upload'), {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(
        screen.getByText('aiDonation.upload.errors.unsupportedType')
      ).toBeInTheDocument();
    });
  });

  test('shows error for oversized file', async () => {
    renderComponent();

    const largeFile = new File(['a'.repeat(6 * 1024 * 1024)], 'large.jpg', {
      type: 'image/jpeg',
    });

    fireEvent.change(document.querySelector('#image-upload'), {
      target: { files: [largeFile] },
    });

    await waitFor(() => {
      expect(
        screen.getByText('aiDonation.upload.errors.fileTooLarge')
      ).toBeInTheDocument();
    });
  });

  test('shows preview and file info after valid upload', async () => {
    renderComponent();

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    fireEvent.change(document.querySelector('#image-upload'), {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(
        screen.getByText('aiDonation.upload.selectedFile')
      ).toBeInTheDocument();
      expect(screen.getByText('test.jpg')).toBeInTheDocument();
      expect(screen.getByAltText('Label preview')).toBeInTheDocument();
    });
  });

  test('shows continue button after valid upload', async () => {
    renderComponent();

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    fireEvent.change(document.querySelector('#image-upload'), {
      target: { files: [file] },
    });

    await waitFor(() => {
      expect(
        screen.getByRole('button', {
          name: /aidonation\.upload\.continuetoreview/i,
        })
      ).toBeInTheDocument();
    });
  });

  test('calls onImageSelect when continue button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    fireEvent.change(document.querySelector('#image-upload'), {
      target: { files: [file] },
    });

    const continueButton = await screen.findByRole('button', {
      name: /aidonation\.upload\.continuetoreview/i,
    });

    await user.click(continueButton);

    expect(mockOnImageSelect).toHaveBeenCalledTimes(1);
    expect(mockOnImageSelect).toHaveBeenCalledWith(file);
  });

  test('clears preview when remove is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    fireEvent.change(document.querySelector('#image-upload'), {
      target: { files: [file] },
    });

    const removeButton = await screen.findByRole('button', {
      name: /aidonation\.upload\.remove/i,
    });

    await user.click(removeButton);

    await waitFor(() => {
      expect(
        screen.queryByText('aiDonation.upload.selectedFile')
      ).not.toBeInTheDocument();
      expect(
        screen.getByText('aiDonation.upload.dragAndDrop')
      ).toBeInTheDocument();
    });
  });

  test('handles drag enter and leave', () => {
    renderComponent();
    const dropzone = document.querySelector('.dropzone');

    fireEvent.dragEnter(dropzone, { dataTransfer: { files: [] } });
    expect(dropzone).toHaveClass('dragging');

    fireEvent.dragLeave(dropzone, { dataTransfer: { files: [] } });
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
});
