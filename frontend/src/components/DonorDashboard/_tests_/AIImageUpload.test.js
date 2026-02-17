import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import AIImageUpload from '../AIImageUpload';

// Mock dependencies
jest.mock('lucide-react', () => ({
  Upload: () => <span>UploadIcon</span>,
  X: () => <span>XIcon</span>,
  Camera: () => <span>CameraIcon</span>,
  Image: () => <span>ImageIcon</span>,
}));

describe('AIImageUpload', () => {
  const mockOnImageSelected = jest.fn();

  const renderComponent = (props = {}) => {
    const defaultProps = {
      onImageSelected: mockOnImageSelected,
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

    expect(screen.getByText(/upload food label photo/i)).toBeInTheDocument();
    expect(screen.getByText(/take a clear photo/i)).toBeInTheDocument();
  });

  test('renders file requirements', () => {
    renderComponent();

    expect(screen.getByText(/jpg, png, heic/i)).toBeInTheDocument();
    expect(screen.getByText(/max 5mb/i)).toBeInTheDocument();
  });

  test('renders file input', () => {
    renderComponent();

    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('accept', 'image/jpeg,image/jpg,image/png,image/heic');
  });

  test('renders dropzone', () => {
    renderComponent();

    const dropzone = document.querySelector('.dropzone');
    expect(dropzone).toBeInTheDocument();
  });

  test('renders upload tips', () => {
    renderComponent();

    expect(screen.getByText(/tips for best results/i)).toBeInTheDocument();
    expect(screen.getByText(/ensure good lighting/i)).toBeInTheDocument();
    expect(screen.getByText(/keep the label flat/i)).toBeInTheDocument();
  });

  test('renders manual entry button', () => {
    renderComponent();

    const manualButton = screen.getByRole('button', { name: /use manual entry instead/i });
    expect(manualButton).toBeInTheDocument();
  });

  test('renders product label requirements', () => {
    renderComponent();

    expect(screen.getByText(/product name/i)).toBeInTheDocument();
    expect(screen.getByText(/nutrition facts/i)).toBeInTheDocument();
    expect(screen.getByText(/ingredients list/i)).toBeInTheDocument();
    expect(screen.getByText(/expiry\/best before date/i)).toBeInTheDocument();
  });

  test('renders choose file label', () => {
    renderComponent();

    expect(screen.getByText(/choose file/i)).toBeInTheDocument();
  });

  test('renders drag and drop text', () => {
    renderComponent();

    expect(screen.getByText(/drag & drop your food label image here/i)).toBeInTheDocument();
  });

  test('has accessible file input', () => {
    renderComponent();

    const fileInput = document.querySelector('#image-upload');
    expect(fileInput).toBeInTheDocument();
  });
});
