import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ExportDropdown from './ExportDropdown';

jest.mock('lucide-react', () => ({
  Download: () => <span data-testid="download-icon" />,
  File: () => <span data-testid="file-icon" />,
  FileText: () => <span data-testid="file-text-icon" />,
}));

describe('ExportDropdown', () => {
  test('opens menu and exports CSV and PDF', () => {
    const onExportCSV = jest.fn();
    const onExportPDF = jest.fn();

    render(
      <ExportDropdown
        onExportCSV={onExportCSV}
        onExportPDF={onExportPDF}
        label="Download"
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Download' }));
    expect(screen.getByText('Export CSV')).toBeInTheDocument();
    expect(screen.getByText('Export PDF')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Export CSV/i }));
    expect(onExportCSV).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Export PDF')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Download' }));
    fireEvent.click(screen.getByRole('button', { name: /Export PDF/i }));
    expect(onExportPDF).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Export CSV')).not.toBeInTheDocument();
  });

  test('closes when clicking outside and respects disabled state', () => {
    const onExportCSV = jest.fn();
    const onExportPDF = jest.fn();

    const { rerender } = render(
      <ExportDropdown onExportCSV={onExportCSV} onExportPDF={onExportPDF} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Export' }));
    expect(screen.getByText('Export CSV')).toBeInTheDocument();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByText('Export CSV')).not.toBeInTheDocument();

    rerender(
      <ExportDropdown
        onExportCSV={onExportCSV}
        onExportPDF={onExportPDF}
        disabled
      />
    );

    expect(screen.getByRole('button', { name: 'Export' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Export' }));
    expect(screen.queryByText('Export CSV')).not.toBeInTheDocument();
  });
});
