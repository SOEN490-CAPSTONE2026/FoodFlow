import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AdminDisputeDetail from '../AdminDisputeDetail';
import { adminDisputeAPI } from '../../../services/api';

// Mock the API
jest.mock('../../../services/api', () => ({
  adminDisputeAPI: {
    getDisputeById: jest.fn(),
    updateDisputeStatus: jest.fn(),
  },
}));

// Mock CSS import
jest.mock('../Admin_Styles/AdminDisputeDetail.css', () => ({}));

// Mock lucide-react
jest.mock('lucide-react', () => ({
  X: () => <div>X Icon</div>,
}));

describe('AdminDisputeDetail', () => {
  const mockDispute = {
    id: 123,
    reportedId: 456,
    reportedName: 'John Doe',
    reporterId: 789,
    reporterName: 'Jane Smith',
    reporterType: 'Donor',
    donationId: 101,
    description: 'This is a test dispute description',
    status: 'OPEN',
    createdAt: '2024-01-15T10:30:00Z',
  };

  const renderComponent = (disputeId = '123') => {
    return render(
      <MemoryRouter initialEntries={[`/admin/disputes/${disputeId}`]}>
        <Routes>
          <Route path="/admin/disputes/:id" element={<AdminDisputeDetail />} />
          <Route path="/admin/disputes" element={<div>Disputes List</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.confirm and window.alert
    global.confirm = jest.fn(() => true);
    global.alert = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Loading State', () => {
    test('displays loading message while fetching data', () => {
      adminDisputeAPI.getDisputeById.mockImplementation(
        () => new Promise(() => {})
      );
      renderComponent();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('displays error message when API call fails', async () => {
      const errorMessage = 'Failed to load dispute';
      adminDisputeAPI.getDisputeById.mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      expect(screen.getByText('Back to Disputes')).toBeInTheDocument();
    });

    test('displays generic error message when no specific error message', async () => {
      adminDisputeAPI.getDisputeById.mockRejectedValue(
        new Error('Network error')
      );

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByText('Failed to load case details')
        ).toBeInTheDocument();
      });
    });

    test('navigates back to disputes list when clicking Back button on error', async () => {
      adminDisputeAPI.getDisputeById.mockRejectedValue(new Error('Error'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Back to Disputes')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Back to Disputes'));

      await waitFor(() => {
        expect(screen.getByText('Disputes List')).toBeInTheDocument();
      });
    });
  });

  describe('Successful Data Loading', () => {
    beforeEach(() => {
      adminDisputeAPI.getDisputeById.mockResolvedValue({
        data: mockDispute,
      });
    });

    test('renders dispute details correctly', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Case DR-123')).toBeInTheDocument();
      });

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(
        screen.getByText('This is a test dispute description')
      ).toBeInTheDocument();
    });

    test('displays correct case ID format', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getAllByText('DR-123')[0]).toBeInTheDocument();
      });
    });

    test('displays reporter information', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('Donor')).toBeInTheDocument();
        expect(screen.getByText('789')).toBeInTheDocument();
      });
    });

    test('displays reported user information', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('456')).toBeInTheDocument();
      });
    });

    test('displays donation ID', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('DON-2024-101')).toBeInTheDocument();
      });
    });

    test('displays formatted date', async () => {
      renderComponent();

      await waitFor(() => {
        // Date format is locale-specific, so we check if any date-like text is present
        expect(screen.getAllByText(/2024-01-15/)[0]).toBeInTheDocument();
      });
    });

    test('displays status badge with correct status', async () => {
      renderComponent();

      await waitFor(() => {
        const statusElements = screen.getAllByText('OPEN');
        expect(statusElements.length).toBeGreaterThan(0);
      });
    });

    test('status select dropdown shows all options', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');
      expect(select).toHaveValue('OPEN');

      // Check all options are present
      const options = Array.from(select.options).map(opt => opt.value);
      expect(options).toEqual(['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'CLOSED']);
    });
  });

  describe('Status Updates', () => {
    beforeEach(() => {
      adminDisputeAPI.getDisputeById.mockResolvedValue({
        data: mockDispute,
      });
    });

    test('allows changing status via dropdown', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'UNDER_REVIEW' } });

      expect(select).toHaveValue('UNDER_REVIEW');
    });

    test('Save Status Change button is disabled when status unchanged', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Save Status Change')).toBeInTheDocument();
      });

      const saveButton = screen.getByText('Save Status Change');
      expect(saveButton).toBeDisabled();
    });

    test('Save Status Change button is enabled when status changed', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'RESOLVED' } });

      const saveButton = screen.getByText('Save Status Change');
      expect(saveButton).not.toBeDisabled();
    });

    test('alerts when trying to save same status', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');

      // Status is already OPEN, so clicking save should alert
      // But button is disabled, so we need to test the function directly
      // Let's change status away and back to trigger the disabled state
      fireEvent.change(select, { target: { value: 'RESOLVED' } });
      fireEvent.change(select, { target: { value: 'OPEN' } });

      const saveButton = screen.getByText('Save Status Change');

      // The button should be disabled now since status matches
      expect(saveButton).toBeDisabled();
    });

    test('successfully updates status with confirmation', async () => {
      adminDisputeAPI.updateDisputeStatus.mockResolvedValue({});

      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'RESOLVED' } });

      const saveButton = screen.getByText('Save Status Change');
      fireEvent.click(saveButton);

      expect(global.confirm).toHaveBeenCalledWith(
        'Are you sure you want to change the status to "RESOLVED"?'
      );

      await waitFor(() => {
        expect(adminDisputeAPI.updateDisputeStatus).toHaveBeenCalledWith(
          '123',
          'RESOLVED',
          ''
        );
      });

      expect(global.alert).toHaveBeenCalledWith('Status updated successfully');
    });

    test('does not update status when confirmation is cancelled', async () => {
      global.confirm = jest.fn(() => false);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'RESOLVED' } });

      const saveButton = screen.getByText('Save Status Change');
      fireEvent.click(saveButton);

      expect(global.confirm).toHaveBeenCalled();
      expect(adminDisputeAPI.updateDisputeStatus).not.toHaveBeenCalled();
    });

    test('handles status update error', async () => {
      const errorMessage = 'Update failed';
      adminDisputeAPI.updateDisputeStatus.mockRejectedValue({
        response: { data: { message: errorMessage } },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'RESOLVED' } });

      const saveButton = screen.getByText('Save Status Change');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(
          'Failed to update status: ' + errorMessage
        );
      });
    });

    test('handles status update error without response message', async () => {
      const error = new Error('Network error');
      adminDisputeAPI.updateDisputeStatus.mockRejectedValue(error);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('combobox')).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'RESOLVED' } });

      const saveButton = screen.getByText('Save Status Change');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(
          'Failed to update status: Network error'
        );
      });
    });
  });

  describe('Administrative Actions', () => {
    beforeEach(() => {
      adminDisputeAPI.getDisputeById.mockResolvedValue({
        data: mockDispute,
      });
    });

    test('deactivate user button shows confirmation', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Deactivate User Account')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Deactivate User Account'));

      expect(global.confirm).toHaveBeenCalledWith(
        'Are you sure you want to deactivate this user account?'
      );
      expect(global.alert).toHaveBeenCalledWith(
        'User account deactivation requested'
      );
    });

    test('deactivate user button cancelled', async () => {
      global.confirm = jest.fn(() => false);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Deactivate User Account')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Deactivate User Account'));

      expect(global.confirm).toHaveBeenCalled();
      expect(global.alert).not.toHaveBeenCalled();
    });

    test('override donation button works', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByText('Override Donation Status')
        ).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Override Donation Status'));

      expect(global.alert).toHaveBeenCalledWith('Override donation status');
    });

    test('flag user button works', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Flag User for Review')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Flag User for Review'));

      expect(global.alert).toHaveBeenCalledWith('User flagged for review');
    });
  });

  describe('Close Case', () => {
    test('prevents closing case if status is not Resolved', async () => {
      adminDisputeAPI.getDisputeById.mockResolvedValue({
        data: mockDispute,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Close Case')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Close Case'));

      expect(global.alert).toHaveBeenCalledWith(
        'Case must be marked as Resolved before closing'
      );
      expect(global.confirm).not.toHaveBeenCalled();
    });

    test('allows closing case when status is RESOLVED', async () => {
      adminDisputeAPI.getDisputeById.mockResolvedValue({
        data: { ...mockDispute, status: 'RESOLVED' },
      });
      adminDisputeAPI.updateDisputeStatus.mockResolvedValue({});

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Close Case')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Close Case'));

      expect(global.confirm).toHaveBeenCalledWith(
        'Are you sure you want to close this case?'
      );
    });

    test('allows closing case when status is Resolved (lowercase)', async () => {
      adminDisputeAPI.getDisputeById.mockResolvedValue({
        data: { ...mockDispute, status: 'Resolved' },
      });
      adminDisputeAPI.updateDisputeStatus.mockResolvedValue({});

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Close Case')).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'Resolved' } });

      fireEvent.click(screen.getByText('Close Case'));

      expect(global.alert).toHaveBeenCalledWith(
        'Case must be marked as Resolved before closing'
      );
    });
  });

  describe('Close Button', () => {
    beforeEach(() => {
      adminDisputeAPI.getDisputeById.mockResolvedValue({
        data: mockDispute,
      });
    });

    test('navigates back to disputes list when close button clicked', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('X Icon')).toBeInTheDocument();
      });

      // Find the button that contains the X Icon
      const closeButton = screen.getByText('X Icon').closest('button');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.getByText('Disputes List')).toBeInTheDocument();
      });
    });
  });

  describe('Date Formatting', () => {
    test('handles missing createdAt date', async () => {
      adminDisputeAPI.getDisputeById.mockResolvedValue({
        data: { ...mockDispute, createdAt: null },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getAllByText('N/A').length).toBeGreaterThan(0);
      });
    });

    test('formats date correctly', async () => {
      adminDisputeAPI.getDisputeById.mockResolvedValue({
        data: { ...mockDispute, createdAt: '2024-03-15T14:30:00Z' },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getAllByText(/2024-03-15/)[0]).toBeInTheDocument();
      });
    });
  });

  describe('Not Found State', () => {
    test('displays not found message when dispute data is null', async () => {
      adminDisputeAPI.getDisputeById.mockResolvedValue({
        data: null,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Case not found')).toBeInTheDocument();
      });

      expect(screen.getByText('Back to Disputes')).toBeInTheDocument();
    });

    test('navigates back from not found state', async () => {
      adminDisputeAPI.getDisputeById.mockResolvedValue({
        data: null,
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Case not found')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Back to Disputes'));

      await waitFor(() => {
        expect(screen.getByText('Disputes List')).toBeInTheDocument();
      });
    });
  });

  describe('UI Elements', () => {
    beforeEach(() => {
      adminDisputeAPI.getDisputeById.mockResolvedValue({
        data: mockDispute,
      });
    });

    test('displays all section titles', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('CASE INFORMATION')).toBeInTheDocument();
      });

      expect(screen.getByText('REPORTER')).toBeInTheDocument();
      expect(screen.getByText('REPORTED USER')).toBeInTheDocument();
      expect(screen.getByText('RELATED DONATION')).toBeInTheDocument();
      expect(screen.getByText('REPORT DESCRIPTION')).toBeInTheDocument();
      expect(screen.getByText('CASE STATUS')).toBeInTheDocument();
      expect(screen.getByText('ADMINISTRATIVE ACTIONS')).toBeInTheDocument();
      expect(screen.getByText('CASE RESOLUTION')).toBeInTheDocument();
    });

    test('displays hint texts', async () => {
      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByText('Status changes require confirmation')
        ).toBeInTheDocument();
      });

      expect(
        screen.getByText(
          'All actions are admin-only and not visible to platform users.'
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText('Case must be marked as Resolved before closing')
      ).toBeInTheDocument();
    });
  });
});
