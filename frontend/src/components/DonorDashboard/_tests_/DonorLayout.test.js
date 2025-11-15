import React from 'react';
import '@testing-library/jest-dom';
import { screen, render, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import DonorLayout from '../DonorLayout';
import { AuthContext } from '../../../contexts/AuthContext';
import * as socketModule from '../../../services/socket';

// --- Mocks ---

jest.mock('../../MessagingDashboard/MessageNotification', () => {
  return function MockMessageNotification({ notification, onClose }) {
    return (
      <div data-testid="message-notification">
        <div>{notification?.senderName}</div>
        <div>{notification?.message}</div>
        <button onClick={onClose}>Close</button>
      </div>
    );
  };
});

// Keep the handlers inside the mock AND spy on connectToUserQueue calls
jest.mock('../../../services/socket', () => {
  const handlers = { onMessage: null, onClaim: null, onCancel: null };
  return {
    connectToUserQueue: jest.fn((onMessage, onClaimNotification, onClaimCancelled) => {
      handlers.onMessage = onMessage;
      handlers.onClaim = onClaimNotification;
      handlers.onCancel = onClaimCancelled;
    }),
    disconnect: jest.fn(),
    __handlers: handlers,
  };
});

// --- Helpers ---

function renderWithRouter(initialPath = '/donor/dashboard') {
  const logout = jest.fn();

  return {
    ...render(
      <AuthContext.Provider value={{ logout }}>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route path="/donor" element={<DonorLayout />}>
              <Route index element={<div>Donor Home</div>} />
              <Route path="dashboard" element={<div>Dashboard Page</div>} />
              <Route path="list" element={<div>List Page</div>} />
              <Route path="requests" element={<div>Requests Page</div>} />
              <Route path="search" element={<div>Search Page</div>} />
              <Route path="messages" element={<div>Messages Page</div>} />
            </Route>
            <Route path="/" element={<div>Landing</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    ),
    logout,
  };
}

// Utility to get the three socket handlers AFTER the effect runs
async function getSocketHandlers() {
  await waitFor(() => {
    expect(socketModule.connectToUserQueue).toHaveBeenCalled();
  });
  const lastCall = socketModule.connectToUserQueue.mock.calls.at(-1);
  const [onMessage, onClaim, onCancel] = lastCall;
  return { onMessage, onClaim, onCancel };
}

// --- Tests ---

describe('DonorLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    if (socketModule.__handlers) {
      socketModule.__handlers.onMessage = null;
      socketModule.__handlers.onClaim = null;
      socketModule.__handlers.onCancel = null;
    }
  });

  test('renders dashboard header and description on /donor/dashboard', () => {
    renderWithRouter('/donor/dashboard');
    expect(screen.getByText('Donor Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Overview and quick actions')).toBeInTheDocument();
    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
  });

  test('highlights active nav link', () => {
    renderWithRouter('/donor/dashboard');
    const active = screen.getByRole('link', { name: /dashboard/i });
    expect(active).toHaveClass('active');
  });

  test('shows message notification when a message arrives and can be closed', async () => {
    renderWithRouter('/donor/dashboard');

    const { onMessage } = await getSocketHandlers();
    expect(typeof onMessage).toBe('function');

    // Simulate inbound message
    onMessage({ senderName: 'Receiver A', messageBody: 'Hello there!' });

    expect(await screen.findByTestId('message-notification')).toBeInTheDocument();
    expect(screen.getByText('Receiver A')).toBeInTheDocument();
    expect(screen.getByText('Hello there!')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Close'));
    expect(screen.queryByTestId('message-notification')).not.toBeInTheDocument();
  });

  test('handles message with alternative field names', async () => {
    renderWithRouter('/donor/dashboard');

    const { onMessage } = await getSocketHandlers();
    onMessage({ senderEmail: 'rx@example.com', message: 'Alternative message field' });

    expect(await screen.findByTestId('message-notification')).toBeInTheDocument();
    expect(screen.getByText('Alternative message field')).toBeInTheDocument();
  });

  test('handles claim notification with missing fields (fallback text)', async () => {
    renderWithRouter('/donor/dashboard');

    const { onClaim } = await getSocketHandlers();
    onClaim({}); // triggers fallbacks in component

    expect(
      await screen.findByText('A receiver has claimed your "your food item"')
    ).toBeInTheDocument();
  });

  test('navigates to Messages when Messages item clicked', () => {
    renderWithRouter('/donor/dashboard');
    fireEvent.click(screen.getAllByText('Messages')[0]);
    expect(screen.getByText('Messages Page')).toBeInTheDocument();
    expect(screen.queryByText('Overview and quick actions')).not.toBeInTheDocument();
  });

  test('renders user profile snippet', () => {
    renderWithRouter('/donor/dashboard');
    expect(screen.getByText('Donor')).toBeInTheDocument();
    expect(screen.getByText('donor')).toBeInTheDocument();
  });

  test('logout menu opens and calls logout', () => {
    const { logout } = renderWithRouter('/donor/dashboard');

    // Choose the dotted account menu button specifically (aria-label="Menu")
    const dottedBtn = screen.getByLabelText('Menu', { selector: 'button' });
    fireEvent.click(dottedBtn);

    fireEvent.click(screen.getByText('Logout'));
    expect(logout).toHaveBeenCalled();
  });
});
