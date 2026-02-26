import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import CalendarOAuthCallback from '../CalendarOAuthCallback';
import { calendarAPI } from '../../services/api';
import { AuthContext } from '../../contexts/AuthContext';

// Mock the API
jest.mock('../../services/api', () => ({
  calendarAPI: {
    handleOAuthCallback: jest.fn(),
  },
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: key => key,
    i18n: { language: 'en' },
  }),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Loader: () => <div data-testid="loader-icon">Loader</div>,
  CheckCircle: () => <div data-testid="check-circle-icon">CheckCircle</div>,
  AlertCircle: () => <div data-testid="alert-circle-icon">AlertCircle</div>,
}));

const mockAuthContext = {
  userId: 'test-user-123',
  userRole: 'DONOR',
};

const renderWithRouter = (component, searchParams = '') => {
  return render(
    <MemoryRouter initialEntries={[`/calendar/callback${searchParams}`]}>
      <AuthContext.Provider value={mockAuthContext}>
        {component}
      </AuthContext.Provider>
    </MemoryRouter>
  );
};

describe('CalendarOAuthCallback Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Mock window.close
    global.window.close = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initial State', () => {
    it('should show processing state initially', () => {
      calendarAPI.handleOAuthCallback.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderWithRouter(
        <CalendarOAuthCallback />,
        '?code=test-code&state=test-state'
      );

      expect(screen.getByText('calendar.connecting')).toBeInTheDocument();
      expect(screen.getByText('calendar.processingAuth')).toBeInTheDocument();
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
    });
  });

  describe('Successful Authentication', () => {
    it('should handle successful callback with code and state', async () => {
      calendarAPI.handleOAuthCallback.mockResolvedValue({
        data: {
          success: true,
          message: 'Calendar connected successfully!',
        },
      });

      renderWithRouter(
        <CalendarOAuthCallback />,
        '?code=test-auth-code&state=test-state'
      );

      await waitFor(() => {
        expect(calendarAPI.handleOAuthCallback).toHaveBeenCalledWith(
          'test-auth-code',
          'test-state'
        );
      });

      await waitFor(() => {
        expect(screen.getByText('calendar.success')).toBeInTheDocument();
        expect(
          screen.getByText('Calendar connected successfully!')
        ).toBeInTheDocument();
      });

      // Fast forward time to trigger window.close
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(global.window.close).toHaveBeenCalled();
      });
    });

    it('should use default success message if none provided', async () => {
      calendarAPI.handleOAuthCallback.mockResolvedValue({
        data: {
          success: true,
        },
      });

      renderWithRouter(
        <CalendarOAuthCallback />,
        '?code=test-code&state=test-state'
      );

      await waitFor(() => {
        expect(screen.getByText('calendar.success')).toBeInTheDocument();
        expect(screen.getByText('calendar.authSuccess')).toBeInTheDocument();
      });
    });

    it('should close window after 1.5 seconds on success', async () => {
      calendarAPI.handleOAuthCallback.mockResolvedValue({
        data: {
          success: true,
          message: 'Success',
        },
      });

      renderWithRouter(
        <CalendarOAuthCallback />,
        '?code=test-code&state=test-state'
      );

      await waitFor(() => {
        expect(screen.getByText('calendar.success')).toBeInTheDocument();
      });

      expect(global.window.close).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        expect(global.window.close).toHaveBeenCalled();
      });
    });
  });

  describe('Failed Authentication', () => {
    it('should handle error parameter in URL', async () => {
      renderWithRouter(<CalendarOAuthCallback />, '?error=access_denied');

      await waitFor(() => {
        expect(screen.getByText('calendar.error')).toBeInTheDocument();
        expect(screen.getByText('calendar.authDenied')).toBeInTheDocument();
      });

      // Should close after 2 seconds
      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(global.window.close).toHaveBeenCalled();
      });
    });

    it('should handle missing authorization code', async () => {
      renderWithRouter(<CalendarOAuthCallback />, '?state=test-state');

      await waitFor(() => {
        expect(screen.getByText('calendar.error')).toBeInTheDocument();
        expect(
          screen.getByText('calendar.missingAuthCode')
        ).toBeInTheDocument();
      });

      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(global.window.close).toHaveBeenCalled();
      });
    });

    it('should handle API callback failure', async () => {
      calendarAPI.handleOAuthCallback.mockResolvedValue({
        data: {
          success: false,
          message: 'Invalid authorization code',
        },
      });

      renderWithRouter(
        <CalendarOAuthCallback />,
        '?code=invalid-code&state=test-state'
      );

      await waitFor(() => {
        expect(screen.getByText('calendar.error')).toBeInTheDocument();
        expect(
          screen.getByText('Invalid authorization code')
        ).toBeInTheDocument();
      });

      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(global.window.close).toHaveBeenCalled();
      });
    });

    it('should use default error message if none provided in failure response', async () => {
      calendarAPI.handleOAuthCallback.mockResolvedValue({
        data: {
          success: false,
        },
      });

      renderWithRouter(
        <CalendarOAuthCallback />,
        '?code=test-code&state=test-state'
      );

      await waitFor(() => {
        expect(screen.getByText('calendar.error')).toBeInTheDocument();
        expect(screen.getByText('calendar.authFailed')).toBeInTheDocument();
      });
    });

    it('should handle network/API errors', async () => {
      const errorResponse = {
        response: {
          data: {
            message: 'Network error occurred',
          },
        },
      };

      calendarAPI.handleOAuthCallback.mockRejectedValue(errorResponse);

      renderWithRouter(
        <CalendarOAuthCallback />,
        '?code=test-code&state=test-state'
      );

      await waitFor(() => {
        expect(screen.getByText('calendar.error')).toBeInTheDocument();
        expect(screen.getByText('Network error occurred')).toBeInTheDocument();
      });

      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(global.window.close).toHaveBeenCalled();
      });
    });

    it('should handle generic errors without response data', async () => {
      calendarAPI.handleOAuthCallback.mockRejectedValue(
        new Error('Unknown error')
      );

      renderWithRouter(
        <CalendarOAuthCallback />,
        '?code=test-code&state=test-state'
      );

      await waitFor(() => {
        expect(screen.getByText('calendar.error')).toBeInTheDocument();
        expect(screen.getByText('calendar.authError')).toBeInTheDocument();
      });
    });
  });

  describe('Window Closing Behavior', () => {
    it('should close window after 2 seconds on error', async () => {
      renderWithRouter(<CalendarOAuthCallback />, '?error=access_denied');

      await waitFor(() => {
        expect(screen.getByText('calendar.error')).toBeInTheDocument();
      });

      expect(global.window.close).not.toHaveBeenCalled();

      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(global.window.close).toHaveBeenCalled();
      });
    });

    it('should not close window prematurely', async () => {
      calendarAPI.handleOAuthCallback.mockResolvedValue({
        data: {
          success: true,
          message: 'Success',
        },
      });

      renderWithRouter(
        <CalendarOAuthCallback />,
        '?code=test-code&state=test-state'
      );

      await waitFor(() => {
        expect(screen.getByText('calendar.success')).toBeInTheDocument();
      });

      // Advance less than 1.5 seconds
      jest.advanceTimersByTime(1000);

      expect(global.window.close).not.toHaveBeenCalled();
    });
  });

  describe('URL Parameter Handling', () => {
    it('should correctly parse code and state from URL', async () => {
      calendarAPI.handleOAuthCallback.mockResolvedValue({
        data: {
          success: true,
        },
      });

      const code = 'complex_auth_code_123';
      const state = 'state_value_456';

      renderWithRouter(
        <CalendarOAuthCallback />,
        `?code=${code}&state=${state}`
      );

      await waitFor(() => {
        expect(calendarAPI.handleOAuthCallback).toHaveBeenCalledWith(
          code,
          state
        );
      });
    });

    it('should handle null state parameter', async () => {
      calendarAPI.handleOAuthCallback.mockResolvedValue({
        data: {
          success: true,
        },
      });

      renderWithRouter(<CalendarOAuthCallback />, '?code=test-code');

      await waitFor(() => {
        expect(calendarAPI.handleOAuthCallback).toHaveBeenCalledWith(
          'test-code',
          null
        );
      });
    });
  });

  describe('UI States', () => {
    it('should show correct icon for processing state', () => {
      calendarAPI.handleOAuthCallback.mockImplementation(
        () => new Promise(() => {})
      );

      renderWithRouter(
        <CalendarOAuthCallback />,
        '?code=test-code&state=test-state'
      );

      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
    });

    it('should show correct icon for success state', async () => {
      calendarAPI.handleOAuthCallback.mockResolvedValue({
        data: {
          success: true,
        },
      });

      renderWithRouter(
        <CalendarOAuthCallback />,
        '?code=test-code&state=test-state'
      );

      await waitFor(() => {
        expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
      });
    });

    it('should show correct icon for error state', async () => {
      renderWithRouter(<CalendarOAuthCallback />, '?error=access_denied');

      await waitFor(() => {
        expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();
      });
    });

    it('should display correct styling for success state', async () => {
      calendarAPI.handleOAuthCallback.mockResolvedValue({
        data: {
          success: true,
          message: 'Success message',
        },
      });

      renderWithRouter(
        <CalendarOAuthCallback />,
        '?code=test-code&state=test-state'
      );

      await waitFor(() => {
        const heading = screen.getByText('calendar.success');
        expect(heading).toBeInTheDocument();
      });
    });

    it('should display correct styling for error state', async () => {
      renderWithRouter(<CalendarOAuthCallback />, '?error=access_denied');

      await waitFor(() => {
        const heading = screen.getByText('calendar.error');
        expect(heading).toBeInTheDocument();
      });
    });
  });

  describe('Console Logging', () => {
    it('should log errors to console', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const error = new Error('Test error');
      calendarAPI.handleOAuthCallback.mockRejectedValue(error);

      renderWithRouter(
        <CalendarOAuthCallback />,
        '?code=test-code&state=test-state'
      );

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'OAuth callback error:',
          error
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });
});
