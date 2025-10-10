import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import SurplusFeed from '../components/SurplusFeed';
import '@testing-library/jest-dom';

// Mock surplusAPI
jest.mock('../services/api', () => ({
    surplusAPI: {
        list: jest.fn()
    }
}));

const { surplusAPI } = require('../services/api');

describe('SurplusFeed Component', () => {
    beforeEach(() => {
        surplusAPI.list.mockReset();
    });

    test('renders loading state then shows empty message when no posts', async () => {
        surplusAPI.list.mockResolvedValueOnce({ data: [] });
        render(<SurplusFeed />);

        expect(screen.getByTestId('surplus-feed-loading')).toHaveTextContent(/loading surplus feed/i);

        await waitFor(() => {
            expect(screen.getByText(/no surplus items available right now/i)).toBeInTheDocument();
        });
    });
    test('renders posts and updates after polling interval', async () => {
        jest.useFakeTimers();

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

        // Advance timers and wait for next poll
        await act(async () => {
            jest.advanceTimersByTime(10050);
            await Promise.resolve(); // flush microtasks
        });

        await waitFor(() => {
            expect(screen.getByText('Apples')).toBeInTheDocument();
            const cards = screen.getAllByTestId('surplus-card');
            expect(cards.length).toBe(2);
        });

        expect(surplusAPI.list).toHaveBeenCalledTimes(2);

        jest.useRealTimers();
    });

    test('displays error message on fetch failure', async () => {
        surplusAPI.list.mockRejectedValueOnce(new Error('Network error'));
        render(<SurplusFeed />);

        await waitFor(() => {
            expect(screen.getByRole('alert')).toHaveTextContent(/failed to load surplus posts/i);
        });
    });
});