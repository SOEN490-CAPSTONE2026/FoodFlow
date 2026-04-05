import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExportDropdown from '../../components/Common/ExportDropdown';

describe('ExportDropdown Component', () => {
  const mockOnExportCSV = jest.fn();
  const mockOnExportPDF = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders export button with correct label', () => {
    render(
      <ExportDropdown
        onExportCSV={mockOnExportCSV}
        onExportPDF={mockOnExportPDF}
        label="Export"
      />
    );

    const button = screen.getByRole('button', { name: /export/i });
    expect(button).toBeInTheDocument();
  });

  test('opens dropdown when button is clicked', async () => {
    render(
      <ExportDropdown
        onExportCSV={mockOnExportCSV}
        onExportPDF={mockOnExportPDF}
        label="Export"
      />
    );

    const button = screen.getByRole('button', { name: /export/i });
    fireEvent.click(button);

    const csvOption = await screen.findByText('Export CSV');
    expect(csvOption).toBeInTheDocument();
  });

  test('displays both CSV and PDF options in dropdown', async () => {
    render(
      <ExportDropdown
        onExportCSV={mockOnExportCSV}
        onExportPDF={mockOnExportPDF}
        label="Export"
      />
    );

    const button = screen.getByRole('button', { name: /export/i });
    fireEvent.click(button);

    const csvOption = await screen.findByText('Export CSV');
    const pdfOption = await screen.findByText('Export PDF');

    expect(csvOption).toBeInTheDocument();
    expect(pdfOption).toBeInTheDocument();
  });

  test('calls onExportCSV when CSV option is clicked', async () => {
    render(
      <ExportDropdown
        onExportCSV={mockOnExportCSV}
        onExportPDF={mockOnExportPDF}
        label="Export"
      />
    );

    const button = screen.getByRole('button', { name: /export/i });
    fireEvent.click(button);

    const csvOption = await screen.findByText('Export CSV');
    fireEvent.click(csvOption);

    expect(mockOnExportCSV).toHaveBeenCalledTimes(1);
    expect(mockOnExportPDF).not.toHaveBeenCalled();
  });

  test('calls onExportPDF when PDF option is clicked', async () => {
    render(
      <ExportDropdown
        onExportCSV={mockOnExportCSV}
        onExportPDF={mockOnExportPDF}
        label="Export"
      />
    );

    const button = screen.getByRole('button', { name: /export/i });
    fireEvent.click(button);

    const pdfOption = await screen.findByText('Export PDF');
    fireEvent.click(pdfOption);

    expect(mockOnExportPDF).toHaveBeenCalledTimes(1);
    expect(mockOnExportCSV).not.toHaveBeenCalled();
  });

  test('closes dropdown after selection', async () => {
    render(
      <ExportDropdown
        onExportCSV={mockOnExportCSV}
        onExportPDF={mockOnExportPDF}
        label="Export"
      />
    );

    const button = screen.getByRole('button', { name: /export/i });
    fireEvent.click(button);

    const csvOption = await screen.findByText('Export CSV');
    fireEvent.click(csvOption);

    // After click, dropdown menu should not be visible
    await waitFor(() => {
      expect(screen.queryByText('Export CSV')).not.toBeInTheDocument();
    });
  });

  test('closes dropdown when clicking outside', async () => {
    const { container } = render(
      <div>
        <div data-testid="outside">Outside Element</div>
        <ExportDropdown
          onExportCSV={mockOnExportCSV}
          onExportPDF={mockOnExportPDF}
          label="Export"
        />
      </div>
    );

    const button = screen.getByRole('button', { name: /export/i });
    fireEvent.click(button);

    const csvOption = await screen.findByText('Export CSV');
    expect(csvOption).toBeInTheDocument();

    // Click outside
    const outside = screen.getByTestId('outside');
    fireEvent.mouseDown(outside);

    await waitFor(() => {
      expect(screen.queryByText('Export CSV')).not.toBeInTheDocument();
    });
  });

  test('disables options when disabled prop is true', () => {
    render(
      <ExportDropdown
        onExportCSV={mockOnExportCSV}
        onExportPDF={mockOnExportPDF}
        label="Export"
        disabled={true}
      />
    );

    const button = screen.getByRole('button', { name: /export/i });
    expect(button).toBeDisabled();
  });

  test('displays hint text for each option', async () => {
    render(
      <ExportDropdown
        onExportCSV={mockOnExportCSV}
        onExportPDF={mockOnExportPDF}
        label="Export"
      />
    );

    const button = screen.getByRole('button', { name: /export/i });
    fireEvent.click(button);

    const csvHint = await screen.findByText(/for spreadsheet analysis/i);
    const pdfHint = await screen.findByText(/for presentation/i);

    expect(csvHint).toBeInTheDocument();
    expect(pdfHint).toBeInTheDocument();
  });

  test('toggles dropdown on multiple clicks', async () => {
    render(
      <ExportDropdown
        onExportCSV={mockOnExportCSV}
        onExportPDF={mockOnExportPDF}
        label="Export"
      />
    );

    const button = screen.getByRole('button', { name: /export/i });

    // First click - open
    fireEvent.click(button);
    expect(await screen.findByText('Export CSV')).toBeInTheDocument();

    // Second click - close
    fireEvent.click(button);
    await waitFor(() => {
      expect(screen.queryByText('Export CSV')).not.toBeInTheDocument();
    });

    // Third click - open again
    fireEvent.click(button);
    expect(await screen.findByText('Export CSV')).toBeInTheDocument();
  });
});
