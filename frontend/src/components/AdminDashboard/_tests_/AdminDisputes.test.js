import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import '@testing-library/jest-dom';
import AdminDisputes from '../AdminDisputes';
import { adminDisputeAPI } from '../../../services/api';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: key => key }),
}));

jest.mock('../../../services/api', () => ({
  adminDisputeAPI: { getAllDisputes: jest.fn() },
}));

jest.mock('../Admin_Styles/AdminDisputes.css', () => ({}));

describe('AdminDisputes', () => {
  const disputes = [
    {
      id: 1,
      reporterId: 1,
      reporterName: 'John Donor',
      reporterType: 'DONOR',
      reportedUserId: 2,
      reportedUserName: 'Jane Receiver',
      donationId: 10,
      description: 'd1',
      status: 'OPEN',
      createdAt: '2024-01-01T00:00:00Z',
      resolvedAt: null,
    },
  ];

  const renderComponent = () =>
    render(
      <MemoryRouter initialEntries={['/admin/disputes']}>
        <Routes>
          <Route path="/admin/disputes" element={<AdminDisputes />} />
          <Route path="/admin/disputes/:id" element={<div>detail</div>} />
        </Routes>
      </MemoryRouter>
    );

  test('renders loading key', () => {
    adminDisputeAPI.getAllDisputes.mockImplementation(
      () => new Promise(() => {})
    );
    renderComponent();
    expect(screen.getByText('adminDisputes.loading')).toBeInTheDocument();
  });

  test('renders key-based table and search', async () => {
    adminDisputeAPI.getAllDisputes.mockResolvedValue({
      data: { content: disputes },
    });
    renderComponent();

    await waitFor(() => {
      expect(
        screen.getAllByText('adminDisputes.allCases').length
      ).toBeGreaterThan(0);
      expect(
        screen.getByPlaceholderText('adminDisputes.searchPlaceholder')
      ).toBeInTheDocument();
      expect(screen.getByText('John Donor')).toBeInTheDocument();
    });
  });

  test('filters by key tab', async () => {
    adminDisputeAPI.getAllDisputes.mockResolvedValue({
      data: { content: disputes },
    });
    renderComponent();

    await screen.findByText('John Donor');
    fireEvent.click(screen.getAllByText('adminDisputes.status.open')[0]);

    expect(screen.getByText('John Donor')).toBeInTheDocument();
  });
});
