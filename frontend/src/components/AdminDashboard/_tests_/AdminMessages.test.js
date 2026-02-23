import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import { TimezoneProvider } from '../../../contexts/TimezoneContext';
import AdminMessages from '../AdminMessages';

// Mock the API
jest.mock('../../../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: [] })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} })),
  },
}));

describe('AdminMessages', () => {
  it('renders Messages heading and placeholder', () => {
    const mockTimezoneContext = {
      userTimezone: 'America/Toronto',
      userRegion: 'CA',
    };

    render(
      <MemoryRouter>
        <TimezoneProvider value={mockTimezoneContext}>
          <AdminMessages />
        </TimezoneProvider>
      </MemoryRouter>
    );
    expect(
      screen.getByText(/select a conversation from the sidebar or start a new one/i)
    ).toBeInTheDocument();
  });
});
