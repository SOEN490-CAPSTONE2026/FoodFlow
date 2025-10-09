import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import SurplusFeed from '../components/SurplusFeed';
import '@testing-library/jest-dom';

// Mock surplusAPI
jest.mock('../services/api', () => ({
  surplusAPI: {
    list: jest.fn()
  }
}));

const { surplusAPI } = require('../services/api');

// Helper to flush pending microtasks
const flushPromises = () => new Promise(setImmediate);

describe('SurplusFeed Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(global, 'setInterval');
    surplusAPI.list.mockReset();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('renders loading state then shows empty message when no posts', async () => {
    surplusAPI.list.mockResolvedValueOnce({ data: [] });
    render(<SurplusFeed />);

    expect(screen.getByRole('status')).toHaveTextContent(/loading feed/i);

    await waitFor(() => {
      expect(screen.getByText(/no surplus food is currently available/i)).toBeInTheDocument();
    });
  });

  test('renders posts and updates after polling interval', async () => {
    const firstData = [
      { id: 1, type: 'Bread', quantity: '10 loaves', expiryDate: new Date(Date.now() + 3600000).toISOString(), pickupTime: new Date().toISOString(), location: 'Downtown', createdAt: new Date().toISOString() }
    ];
    const secondData = [
      ...firstData,
      { id: 2, type: 'Apples', quantity: '25 kg', expiryDate: new Date(Date.now() + 7200000).toISOString(), pickupTime: new Date().toISOString(), location: 'Market', createdAt: new Date().toISOString() }
    ];

    surplusAPI.list
      .mockResolvedValueOnce({ data: firstData })
      .mockResolvedValueOnce({ data: secondData });

    render(<SurplusFeed />);

    // First load
    await waitFor(() => {
      expect(screen.getByText('Bread')).toBeInTheDocument();
      expect(screen.queryByText('Apples')).not.toBeInTheDocument();
    });

    // Advance timers to trigger polling (default 10s)
    jest.advanceTimersByTime(10050); // a bit more than interval
    await flushPromises();

    await waitFor(() => {
      expect(screen.getByText('Apples')).toBeInTheDocument();
      const cards = screen.getAllByTestId('surplus-card');
      expect(cards.length).toBe(2);
    });

    expect(surplusAPI.list).toHaveBeenCalledTimes(2); // initial + one poll
  });

  test('displays error message on fetch failure', async () => {
    surplusAPI.list.mockRejectedValueOnce(new Error('Network error'));
    render(<SurplusFeed />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/failed to load surplus feed/i);
    });
  });
});
