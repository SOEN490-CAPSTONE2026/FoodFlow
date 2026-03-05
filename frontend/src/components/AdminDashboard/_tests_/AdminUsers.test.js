import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
  act,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import axios from 'axios';
import AdminUsers from '../AdminUsers';
import { feedbackAPI } from '../../../services/api';

jest.mock('axios');

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: key => key,
  }),
}));

jest.mock('react-select', () => {
  return function MockSelect(props) {
    return (
      <select
        data-testid={props.placeholder}
        value={props.value?.value ?? ''}
        onChange={e => {
          const selected = props.options.find(
            opt => opt.value === e.target.value
          );
          props.onChange(selected);
        }}
      >
        {props.options.map(option => (
          <option key={option.value || 'empty'} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  };
});

jest.mock('../../../services/api', () => ({
  feedbackAPI: {
    getUserRating: jest.fn(),
  },
}));

describe('AdminUsers', () => {
  const mockUsers = [
    {
      id: 1,
      email: 'donor1@test.com',
      contactPerson: 'John Donor',
      organizationName: 'Food Bank A',
      phone: '1234567890',
      role: 'DONOR',
      verificationStatus: 'VERIFIED',
      accountStatus: 'ACTIVE',
      createdAt: '2024-12-01T00:00:00Z',
      donationCount: 10,
    },
    {
      id: 2,
      email: 'receiver1@test.com',
      contactPerson: 'Jane Receiver',
      organizationName: 'Shelter B',
      phone: '0987654321',
      role: 'RECEIVER',
      verificationStatus: 'PENDING',
      accountStatus: 'ACTIVE',
      createdAt: '2025-01-15T00:00:00Z',
      claimCount: 5,
    },
    {
      id: 4,
      email: 'deactivated@test.com',
      contactPerson: 'Deactivated User',
      organizationName: 'Inactive Org',
      phone: '1111111111',
      role: 'DONOR',
      verificationStatus: 'VERIFIED',
      accountStatus: 'DEACTIVATED',
      createdAt: '2024-06-01T00:00:00Z',
      donationCount: 3,
    },
  ];

  const mockResponse = {
    data: {
      content: mockUsers,
      totalPages: 1,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('jwtToken', 'test-token');
    process.env.REACT_APP_API_BASE_URL = 'http://localhost:8080';

    axios.get.mockResolvedValue(mockResponse);
    axios.put.mockResolvedValue({ data: {} });
    axios.post.mockResolvedValue({ data: {} });

    feedbackAPI.getUserRating.mockResolvedValue({
      data: { averageRating: 4.5, totalReviews: 10 },
    });
  });

  afterEach(() => {
    localStorage.clear();
    jest.useRealTimers();
  });

  test('loads and renders users', async () => {
    render(<AdminUsers />);

    expect(screen.getByText('Loading users...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('John Donor')).toBeInTheDocument();
      expect(screen.getByText('Jane Receiver')).toBeInTheDocument();
    });
  });

  test('filters users by search term', async () => {
    jest.useFakeTimers();
    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('John Donor')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(
      'adminUsers.searchPlaceholder'
    );
    fireEvent.change(searchInput, { target: { value: 'Jane' } });

    act(() => {
      jest.advanceTimersByTime(600);
    });

    await waitFor(() => {
      expect(screen.getByText('Jane Receiver')).toBeInTheDocument();
      expect(screen.queryByText('John Donor')).not.toBeInTheDocument();
    });
  });

  test('applies role filter via API params', async () => {
    render(<AdminUsers />);

    await screen.findByText('John Donor');

    fireEvent.change(screen.getByTestId('adminUsers.filters.allRoles'), {
      target: { value: 'DONOR' },
    });

    await waitFor(() => {
      expect(axios.get).toHaveBeenLastCalledWith(
        expect.stringContaining('/admin/users'),
        expect.objectContaining({
          params: expect.objectContaining({ role: 'DONOR' }),
        })
      );
    });
  });

  test('applies status filter via API params', async () => {
    render(<AdminUsers />);

    await screen.findByText('John Donor');

    fireEvent.change(screen.getByTestId('adminUsers.filters.allStatus'), {
      target: { value: 'ACTIVE' },
    });

    await waitFor(() => {
      expect(axios.get).toHaveBeenLastCalledWith(
        expect.stringContaining('/admin/users'),
        expect.objectContaining({
          params: expect.objectContaining({ accountStatus: 'ACTIVE' }),
        })
      );
    });
  });

  test('resets filters', async () => {
    render(<AdminUsers />);

    await screen.findByText('John Donor');
    const resetButton = await screen.findByRole('button', {
      name: 'adminUsers.filters.reset',
    });

    fireEvent.change(screen.getByTestId('adminUsers.filters.allRoles'), {
      target: { value: 'DONOR' },
    });

    fireEvent.click(resetButton);

    await waitFor(() => {
      expect(axios.get).toHaveBeenLastCalledWith(
        expect.stringContaining('/admin/users'),
        expect.objectContaining({
          params: expect.objectContaining({ page: 0, size: 20 }),
        })
      );
    });
  });

  test('shows error when loading users fails', async () => {
    axios.get.mockRejectedValueOnce(new Error('fail'));
    render(<AdminUsers />);

    await waitFor(() => {
      expect(
        screen.getByText('adminUsers.errors.loadFailed')
      ).toBeInTheDocument();
    });
  });

  test('shows empty state when no users returned', async () => {
    axios.get.mockResolvedValueOnce({ data: { content: [], totalPages: 0 } });
    render(<AdminUsers />);

    await waitFor(() => {
      expect(screen.getByText('adminUsers.empty')).toBeInTheDocument();
    });
  });

  test('opens deactivate modal and requires reason', async () => {
    render(<AdminUsers />);

    await screen.findByText('John Donor');

    fireEvent.click(screen.getAllByTitle('adminUsers.actions.deactivate')[0]);

    await waitFor(() => {
      expect(
        screen.getByText('adminUsers.modals.deactivate.title')
      ).toBeInTheDocument();
    });

    const modalTitle = screen.getByText('adminUsers.modals.deactivate.title');
    const modalRoot = modalTitle.closest('.modal-content');
    fireEvent.click(
      within(modalRoot).getByRole('button', {
        name: 'adminUsers.actions.deactivate',
      })
    );

    await waitFor(() => {
      expect(
        screen.getByText('adminUsers.notifications.reasonRequired')
      ).toBeInTheDocument();
    });
  });

  test('deactivates user with reason', async () => {
    render(<AdminUsers />);

    await screen.findByText('John Donor');

    fireEvent.click(screen.getAllByTitle('adminUsers.actions.deactivate')[0]);

    const modal = await screen.findByText('adminUsers.modals.deactivate.title');
    const modalRoot = modal.closest('.modal-content');

    fireEvent.change(
      within(modalRoot).getByPlaceholderText(
        'adminUsers.modals.deactivate.placeholder'
      ),
      { target: { value: 'Policy violation' } }
    );

    fireEvent.click(
      within(modalRoot).getByRole('button', {
        name: 'adminUsers.actions.deactivate',
      })
    );

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        expect.stringContaining('/admin/users/1/deactivate'),
        { adminNotes: 'Policy violation' },
        expect.any(Object)
      );
      expect(
        screen.getByText('adminUsers.notifications.deactivated')
      ).toBeInTheDocument();
    });
  });

  test('reactivates deactivated user', async () => {
    render(<AdminUsers />);

    await screen.findByText('Deactivated User');

    fireEvent.click(screen.getByTitle('adminUsers.actions.reactivate'));

    const modalTitle = await screen.findByText(
      'adminUsers.modals.reactivate.title'
    );
    const modalRoot = modalTitle.closest('.modal-content');

    fireEvent.click(
      within(modalRoot).getByRole('button', {
        name: 'adminUsers.actions.reactivate',
      })
    );

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        expect.stringContaining('/admin/users/4/reactivate'),
        {},
        expect.any(Object)
      );
      expect(
        screen.getByText('adminUsers.notifications.reactivated')
      ).toBeInTheDocument();
    });
  });

  test('opens alert modal and sends custom alert', async () => {
    render(<AdminUsers />);

    await screen.findByText('John Donor');

    fireEvent.click(screen.getAllByTitle('adminUsers.actions.sendAlert')[0]);

    const alertTitle = await screen.findByText('adminUsers.modals.alert.title');
    const modalRoot = alertTitle.closest('.modal-content');

    fireEvent.click(
      within(modalRoot)
        .getByText('adminUsers.alertTypes.custom')
        .closest('label')
    );

    fireEvent.change(
      within(modalRoot).getByPlaceholderText(
        'adminUsers.modals.alert.customPlaceholder'
      ),
      { target: { value: 'Important message' } }
    );

    fireEvent.click(
      within(modalRoot).getByRole('button', {
        name: 'adminUsers.actions.sendAlert',
      })
    );

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/admin/users/1/send-alert'),
        { message: 'Important message' },
        expect.any(Object)
      );
      expect(
        screen.getByText('adminUsers.notifications.alertSent')
      ).toBeInTheDocument();
    });
  });

  test('expands row and fetches user rating once', async () => {
    render(<AdminUsers />);

    await screen.findByText('John Donor');

    const expandButtons = screen
      .getAllByRole('button')
      .filter(btn => btn.className.includes('expand-btn'));

    fireEvent.click(expandButtons[0]);

    await waitFor(() => {
      expect(feedbackAPI.getUserRating).toHaveBeenCalledWith(1);
      expect(screen.getByText(/4\.5\/5/)).toBeInTheDocument();
    });

    fireEvent.click(expandButtons[0]);
    fireEvent.click(expandButtons[0]);

    await waitFor(() => {
      expect(feedbackAPI.getUserRating).toHaveBeenCalledTimes(1);
    });
  });

  test('handles rating API failure with fallback no-reviews state', async () => {
    feedbackAPI.getUserRating.mockRejectedValueOnce(new Error('rating fail'));
    render(<AdminUsers />);

    await screen.findByText('John Donor');

    const expandButtons = screen
      .getAllByRole('button')
      .filter(btn => btn.className.includes('expand-btn'));
    fireEvent.click(expandButtons[0]);

    await waitFor(() => {
      expect(feedbackAPI.getUserRating).toHaveBeenCalledWith(1);
      expect(screen.getByText('adminUsers.details.noReviews')).toBeInTheDocument();
    });
  });

  test('falls back to row user when detail API fails', async () => {
    axios.get.mockImplementation(url => {
      if (url.endsWith('/admin/users')) {
        return Promise.resolve(mockResponse);
      }
      if (url.endsWith('/admin/users/1')) {
        return Promise.reject(new Error('detail fail'));
      }
      return Promise.resolve(mockResponse);
    });

    render(<AdminUsers />);
    await screen.findByText('John Donor');

    fireEvent.click(screen.getAllByTitle('adminUsers.actions.viewDetails')[0]);

    await waitFor(() => {
      expect(screen.getByText('User Details')).toBeInTheDocument();
      expect(screen.getAllByText('John Donor').length).toBeGreaterThan(0);
    });
  });

  test('shows alert-required notification when sending empty alert', async () => {
    render(<AdminUsers />);
    await screen.findByText('John Donor');

    fireEvent.click(screen.getAllByTitle('adminUsers.actions.sendAlert')[0]);
    const alertTitle = await screen.findByText('adminUsers.modals.alert.title');
    const modalRoot = alertTitle.closest('.modal-content');
    fireEvent.click(
      within(modalRoot).getByRole('button', {
        name: 'adminUsers.actions.sendAlert',
      })
    );

    await waitFor(() => {
      expect(
        screen.getByText('adminUsers.notifications.alertRequired')
      ).toBeInTheDocument();
    });
  });
});
