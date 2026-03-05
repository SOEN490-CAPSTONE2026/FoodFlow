import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import '@testing-library/jest-dom';
import AdminDisputeDetail from '../AdminDisputeDetail';
import { adminDisputeAPI } from '../../../services/api';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key }),
}));

jest.mock('../../../services/api', () => ({
  adminDisputeAPI: {
    getDisputeById: jest.fn(),
    updateDisputeStatus: jest.fn(),
  },
}));

jest.mock('../Admin_Styles/AdminDisputeDetail.css', () => ({}));

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
});
