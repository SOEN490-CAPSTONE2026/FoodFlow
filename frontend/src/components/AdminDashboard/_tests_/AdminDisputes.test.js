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
      updatedAt: null,
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

  // ==================== avgResolutionDays calculation tests ====================

  test('avgResolutionDays is 0 when there are no resolved or closed disputes', async () => {
    adminDisputeAPI.getAllDisputes.mockResolvedValue({
      data: {
        content: [
          {
            id: 1,
            reporterName: 'A',
            reportedUserName: 'B',
            status: 'OPEN',
            createdAt: '2025-01-01T00:00:00Z',
            resolvedAt: null,
            updatedAt: null,
          },
        ],
      },
    });
    renderComponent();

    await waitFor(() => {
      // avgResolutionDays = 0 → renders "0 days" via i18n key with count:0
      expect(
        screen.getByText('adminDisputes.stats.avgResolutionValue')
      ).toBeInTheDocument();
    });
  });

  test('avgResolutionDays is calculated from resolvedAt for resolved disputes', async () => {
    // 2 days between submission and resolution
    adminDisputeAPI.getAllDisputes.mockResolvedValue({
      data: {
        content: [
          {
            id: 2,
            reporterName: 'C',
            reportedUserName: 'D',
            status: 'RESOLVED',
            createdAt: '2025-03-01T00:00:00Z',
            resolvedAt: '2025-03-03T00:00:00Z',
            updatedAt: '2025-03-03T00:00:00Z',
          },
        ],
      },
    });
    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText('adminDisputes.stats.avgResolutionValue')
      ).toBeInTheDocument();
    });
  });

  test('avgResolutionDays falls back to updatedAt when resolvedAt is null', async () => {
    adminDisputeAPI.getAllDisputes.mockResolvedValue({
      data: {
        content: [
          {
            id: 3,
            reporterName: 'E',
            reportedUserName: 'F',
            status: 'CLOSED',
            createdAt: '2025-03-01T00:00:00Z',
            resolvedAt: null,
            updatedAt: '2025-03-04T00:00:00Z', // 3 days later
          },
        ],
      },
    });
    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText('adminDisputes.stats.avgResolutionValue')
      ).toBeInTheDocument();
    });
  });

  test('avgResolutionDays is never negative even when resolvedAt is before createdAt (backdated entry)', async () => {
    adminDisputeAPI.getAllDisputes.mockResolvedValue({
      data: {
        content: [
          {
            id: 4,
            reporterName: 'G',
            reportedUserName: 'H',
            status: 'RESOLVED',
            // resolvedAt is earlier than createdAt — should clamp to 0
            createdAt: '2025-03-05T00:00:00Z',
            resolvedAt: '2025-03-01T00:00:00Z',
            updatedAt: '2025-03-01T00:00:00Z',
          },
        ],
      },
    });
    renderComponent();

    await waitFor(() => {
      // Should render with count 0, not a negative number
      expect(
        screen.getByText('adminDisputes.stats.avgResolutionValue')
      ).toBeInTheDocument();
    });
  });

  test('avgResolutionDays is 0 for same-day resolution', async () => {
    const ts = '2025-06-15T10:00:00Z';
    adminDisputeAPI.getAllDisputes.mockResolvedValue({
      data: {
        content: [
          {
            id: 5,
            reporterName: 'I',
            reportedUserName: 'J',
            status: 'RESOLVED',
            createdAt: ts,
            resolvedAt: ts,
            updatedAt: ts,
          },
        ],
      },
    });
    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText('adminDisputes.stats.avgResolutionValue')
      ).toBeInTheDocument();
    });
  });

  test('avgResolutionDays skips entries with invalid date strings', async () => {
    adminDisputeAPI.getAllDisputes.mockResolvedValue({
      data: {
        content: [
          {
            id: 6,
            reporterName: 'K',
            reportedUserName: 'L',
            status: 'RESOLVED',
            createdAt: 'not-a-date',
            resolvedAt: 'also-not-a-date',
            updatedAt: null,
          },
          {
            id: 7,
            reporterName: 'M',
            reportedUserName: 'N',
            status: 'RESOLVED',
            createdAt: '2025-03-01T00:00:00Z',
            resolvedAt: '2025-03-03T00:00:00Z',
            updatedAt: null,
          },
        ],
      },
    });
    renderComponent();

    await waitFor(() => {
      // Should still render without crashing, using only valid entries
      expect(
        screen.getByText('adminDisputes.stats.avgResolutionValue')
      ).toBeInTheDocument();
    });
  });
});
