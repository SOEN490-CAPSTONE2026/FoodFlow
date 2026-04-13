import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import '@testing-library/jest-dom';
import AdminDisputeDetail from '../components/AdminDashboard/AdminDisputeDetail';
import { adminDisputeAPI } from '../services/api';

const mockedNavigate = jest.fn();
const mockT = key => key;

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: mockT }),
}));

jest.mock('../services/api', () => ({
  adminDisputeAPI: {
    getDisputeById: jest.fn(),
    updateDisputeStatus: jest.fn(),
  },
}));

jest.mock(
  '../components/AdminDashboard/Admin_Styles/AdminDisputeDetail.css',
  () => ({})
);

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

describe('AdminDisputeDetail', () => {
  const mockDispute = {
    id: 123,
    reportedId: 456,
    reportedName: 'John Doe',
    reporterId: 789,
    reporterName: 'Jane Smith',
    reporterType: 'Donor',
    donationId: 101,
    description: 'desc',
    status: 'OPEN',
    createdAt: '2024-01-15T10:30:00Z',
  };

  const renderComponent = () =>
    render(
      <MemoryRouter initialEntries={['/admin/disputes/123']}>
        <Routes>
          <Route path="/admin/disputes/:id" element={<AdminDisputeDetail />} />
          <Route path="/admin/disputes" element={<div>Disputes List</div>} />
        </Routes>
      </MemoryRouter>
    );

  beforeEach(() => {
    jest.clearAllMocks();
    global.alert = jest.fn();
    window.confirm = jest.fn();
  });

  test('renders loading key', () => {
    adminDisputeAPI.getDisputeById.mockImplementation(
      () => new Promise(() => {})
    );
    renderComponent();
    expect(screen.getByText('common.loading')).toBeInTheDocument();
  });

  test('renders key-based actions and labels after load', async () => {
    adminDisputeAPI.getDisputeById.mockResolvedValue({ data: mockDispute });
    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText('adminDisputeDetail.sections.caseInformation')
      ).toBeInTheDocument();
      expect(
        screen.getByText('adminDisputeDetail.saveStatusChange')
      ).toBeInTheDocument();
      expect(
        screen.getByText('adminDisputeDetail.actions.closeCase')
      ).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  test('renders API error message and navigates back from error state', async () => {
    adminDisputeAPI.getDisputeById.mockRejectedValueOnce({
      response: { data: { message: 'Custom load failure' } },
    });
    renderComponent();

    expect(await screen.findByText('Custom load failure')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'adminDisputeDetail.backToDisputes' })
    );
    expect(mockedNavigate).toHaveBeenCalledWith('/admin/disputes');
  });

  test('renders case-not-found state when API returns no dispute', async () => {
    adminDisputeAPI.getDisputeById.mockResolvedValueOnce({ data: null });
    renderComponent();

    expect(
      await screen.findByText('adminDisputeDetail.caseNotFound')
    ).toBeInTheDocument();
  });

  test('close button navigates back to disputes list', async () => {
    adminDisputeAPI.getDisputeById.mockResolvedValue({ data: mockDispute });
    renderComponent();

    await screen.findByText('John Doe');
    fireEvent.click(document.querySelector('.modal-close-btn'));

    expect(mockedNavigate).toHaveBeenCalledWith('/admin/disputes');
  });

  test('alerts when trying to save the same status', async () => {
    adminDisputeAPI.getDisputeById.mockResolvedValue({ data: mockDispute });
    renderComponent();

    await screen.findByText('John Doe');
    const saveButton = screen.getByRole('button', {
      name: 'adminDisputeDetail.saveStatusChange',
    });
    expect(saveButton).toBeDisabled();

    fireEvent.click(saveButton);
    expect(global.alert).not.toHaveBeenCalled();
  });

  test('updates dispute status after confirmation', async () => {
    adminDisputeAPI.getDisputeById.mockResolvedValue({ data: mockDispute });
    adminDisputeAPI.updateDisputeStatus.mockResolvedValueOnce({});
    window.confirm.mockReturnValue(true);
    renderComponent();

    await screen.findByText('adminDisputeDetail.saveStatusChange');
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'RESOLVED' },
    });
    fireEvent.click(screen.getByText('adminDisputeDetail.saveStatusChange'));

    await waitFor(() => {
      expect(adminDisputeAPI.updateDisputeStatus).toHaveBeenCalledWith(
        '123',
        'RESOLVED',
        ''
      );
    });
    expect(global.alert).toHaveBeenCalledWith(
      'adminDisputeDetail.alerts.statusUpdated'
    );
    expect(mockedNavigate).toHaveBeenCalledWith(0);
  });

  test('shows update failure alert when status change API fails', async () => {
    adminDisputeAPI.getDisputeById.mockResolvedValue({ data: mockDispute });
    adminDisputeAPI.updateDisputeStatus.mockRejectedValueOnce({
      response: { data: { message: 'status service down' } },
    });
    window.confirm.mockReturnValue(true);
    renderComponent();

    await screen.findByText('adminDisputeDetail.saveStatusChange');
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'UNDER_REVIEW' },
    });
    fireEvent.click(screen.getByText('adminDisputeDetail.saveStatusChange'));

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith(
        'adminDisputeDetail.alerts.updateFailed'
      );
    });
  });

  test('does not update status when confirmation is cancelled', async () => {
    adminDisputeAPI.getDisputeById.mockResolvedValue({ data: mockDispute });
    window.confirm.mockReturnValue(false);
    renderComponent();

    await screen.findByText('adminDisputeDetail.saveStatusChange');
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'UNDER_REVIEW' },
    });
    fireEvent.click(screen.getByText('adminDisputeDetail.saveStatusChange'));

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
    });
    expect(adminDisputeAPI.updateDisputeStatus).not.toHaveBeenCalled();
  });

  test('admin action buttons fire their alerts and confirmations', async () => {
    adminDisputeAPI.getDisputeById.mockResolvedValue({ data: mockDispute });
    window.confirm.mockReturnValue(true);
    renderComponent();

    await screen.findByText('adminDisputeDetail.actions.deactivateUser');

    fireEvent.click(
      screen.getByText('adminDisputeDetail.actions.deactivateUser')
    );
    fireEvent.click(
      screen.getByText('adminDisputeDetail.actions.overrideDonation')
    );
    fireEvent.click(screen.getByText('adminDisputeDetail.actions.flagUser'));

    expect(window.confirm).toHaveBeenCalledWith(
      'adminDisputeDetail.confirm.deactivateUser'
    );
    expect(global.alert).toHaveBeenCalledWith(
      'adminDisputeDetail.alerts.deactivateRequested'
    );
    expect(global.alert).toHaveBeenCalledWith(
      'adminDisputeDetail.alerts.overrideDonation'
    );
    expect(global.alert).toHaveBeenCalledWith(
      'adminDisputeDetail.alerts.userFlagged'
    );
  });

  test('close case requires resolved status first', async () => {
    adminDisputeAPI.getDisputeById.mockResolvedValue({ data: mockDispute });
    renderComponent();

    await screen.findByText('adminDisputeDetail.actions.closeCase');
    fireEvent.click(screen.getByText('adminDisputeDetail.actions.closeCase'));

    expect(global.alert).toHaveBeenCalledWith(
      'adminDisputeDetail.alerts.mustResolveBeforeClose'
    );
  });

  test('close case runs resolved flow through confirmation and update', async () => {
    adminDisputeAPI.getDisputeById.mockResolvedValue({ data: mockDispute });
    adminDisputeAPI.updateDisputeStatus.mockResolvedValueOnce({});
    window.confirm.mockReturnValue(true);
    renderComponent();

    await screen.findByText('adminDisputeDetail.actions.closeCase');
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'RESOLVED' },
    });
    fireEvent.click(screen.getByText('adminDisputeDetail.actions.closeCase'));

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith(
        'adminDisputeDetail.confirm.closeCase'
      );
    });
    expect(adminDisputeAPI.updateDisputeStatus).toHaveBeenCalledWith(
      '123',
      'RESOLVED',
      ''
    );
  });
});
