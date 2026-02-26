import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CalendarSettings from '../CalendarSettings';
import { calendarAPI } from '../../services/api';
import { AuthContext } from '../../contexts/AuthContext';

// Mock the API
jest.mock('../../services/api', () => ({
  calendarAPI: {
    getStatus: jest.fn(),
    getPreferences: jest.fn(),
    getEvents: jest.fn(),
    initiateConnection: jest.fn(),
    disconnect: jest.fn(),
    updatePreferences: jest.fn(),
    testConnection: jest.fn(),
    sync: jest.fn(),
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
  Calendar: () => <div data-testid="calendar-icon">Calendar</div>,
  Link: () => <div data-testid="link-icon">Link</div>,
  Unlink: () => <div data-testid="unlink-icon">Unlink</div>,
  CheckCircle: () => <div data-testid="check-circle-icon">CheckCircle</div>,
  AlertCircle: () => <div data-testid="alert-circle-icon">AlertCircle</div>,
  Loader: () => <div data-testid="loader-icon">Loader</div>,
  ChevronDown: () => <div data-testid="chevron-down-icon">ChevronDown</div>,
  ChevronUp: () => <div data-testid="chevron-up-icon">ChevronUp</div>,
}));

const mockAuthContext = {
  userId: 'test-user-123',
  userRole: 'DONOR',
};

const mockDisconnectedStatus = {
  data: {
    data: {
      isConnected: false,
      provider: 'GOOGLE',
    },
  },
};

const mockConnectedStatus = {
  data: {
    data: {
      isConnected: true,
      provider: 'GOOGLE',
      connectedSince: '2026-02-01T10:00:00Z',
      googleAccountEmail: 'test@gmail.com',
      primaryCalendarName: 'My Calendar',
      calendarTimeZone: 'America/New_York',
      lastSuccessfulSync: '2026-02-24T15:30:00Z',
      lastFailedRefresh: null,
      grantedScopes:
        'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly',
    },
  },
};

const mockPreferences = {
  data: {
    data: {
      syncEnabled: true,
      autoCreateReminders: true,
      reminderSecondsBefore: 60,
      reminderType: 'EMAIL',
      eventColor: 'BLUE',
      eventVisibility: 'PRIVATE',
      eventDuration: 15,
    },
  },
};

const mockEvents = {
  data: {
    data: [
      {
        id: 'event-1',
        eventTitle: 'Food Pickup - Restaurant A',
        startTime: '2026-02-25T14:00:00Z',
        syncStatus: 'SYNCED',
      },
      {
        id: 'event-2',
        eventTitle: 'Food Pickup - Bakery B',
        startTime: '2026-02-26T10:00:00Z',
        syncStatus: 'SYNCED',
      },
    ],
  },
};

const renderWithContext = component => {
  return render(
    <AuthContext.Provider value={mockAuthContext}>
      {component}
    </AuthContext.Provider>
  );
};

describe('CalendarSettings Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Loading', () => {
    it('should show loading spinner initially', async () => {
      calendarAPI.getStatus.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderWithContext(<CalendarSettings />);

      expect(screen.getByText('common.loading')).toBeInTheDocument();
      expect(screen.getByTestId('loader-icon')).toBeInTheDocument();
    });

    it('should load calendar data on mount when disconnected', async () => {
      calendarAPI.getStatus.mockResolvedValue(mockDisconnectedStatus);

      renderWithContext(<CalendarSettings />);

      await waitFor(() => {
        expect(calendarAPI.getStatus).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByText('calendar.notConnected')).toBeInTheDocument();
      });
    });

    it('should load calendar data and preferences when connected', async () => {
      calendarAPI.getStatus.mockResolvedValue(mockConnectedStatus);
      calendarAPI.getPreferences.mockResolvedValue(mockPreferences);
      calendarAPI.getEvents.mockResolvedValue(mockEvents);

      renderWithContext(<CalendarSettings />);

      await waitFor(() => {
        expect(calendarAPI.getStatus).toHaveBeenCalled();
        expect(calendarAPI.getPreferences).toHaveBeenCalled();
        expect(calendarAPI.getEvents).toHaveBeenCalled();
      });

      expect(screen.getByText('calendar.connected')).toBeInTheDocument();
    });

    it('should handle loading error gracefully', async () => {
      calendarAPI.getStatus.mockRejectedValue(
        new Error('Failed to load status')
      );

      renderWithContext(<CalendarSettings />);

      await waitFor(() => {
        expect(screen.getByText('calendar.loadError')).toBeInTheDocument();
      });
    });
  });

  describe('Connection Flow', () => {
    it('should display connect button when disconnected', async () => {
      calendarAPI.getStatus.mockResolvedValue(mockDisconnectedStatus);

      renderWithContext(<CalendarSettings />);

      await waitFor(() => {
        expect(screen.getByText('calendar.connectButton')).toBeInTheDocument();
      });
    });

    it('should initiate connection when connect button is clicked', async () => {
      calendarAPI.getStatus.mockResolvedValue(mockDisconnectedStatus);
      calendarAPI.initiateConnection.mockResolvedValue({
        data: {
          data: {
            authorizationUrl: 'https://accounts.google.com/oauth/authorize',
          },
        },
      });

      // Mock window.open
      const mockPopup = { closed: false };
      global.window.open = jest.fn(() => mockPopup);

      renderWithContext(<CalendarSettings />);

      await waitFor(() => {
        expect(screen.getByText('calendar.connectButton')).toBeInTheDocument();
      });

      const connectButton = screen.getByText('calendar.connectButton');
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(calendarAPI.initiateConnection).toHaveBeenCalledWith('GOOGLE');
        expect(global.window.open).toHaveBeenCalled();
      });
    });

    it('should handle connection error', async () => {
      calendarAPI.getStatus.mockResolvedValue(mockDisconnectedStatus);
      calendarAPI.initiateConnection.mockRejectedValue(
        new Error('Connection failed')
      );

      renderWithContext(<CalendarSettings />);

      await waitFor(() => {
        expect(screen.getByText('calendar.connectButton')).toBeInTheDocument();
      });

      const connectButton = screen.getByText('calendar.connectButton');
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText('calendar.connectError')).toBeInTheDocument();
      });
    });
  });

  describe('Disconnection Flow', () => {
    beforeEach(async () => {
      calendarAPI.getStatus.mockResolvedValue(mockConnectedStatus);
      calendarAPI.getPreferences.mockResolvedValue(mockPreferences);
      calendarAPI.getEvents.mockResolvedValue(mockEvents);
    });

    it('should display disconnect button when connected', async () => {
      renderWithContext(<CalendarSettings />);

      await waitFor(() => {
        expect(
          screen.getByText('calendar.disconnectButton')
        ).toBeInTheDocument();
      });
    });

    it('should show disconnect modal when disconnect button is clicked', async () => {
      renderWithContext(<CalendarSettings />);

      await waitFor(() => {
        expect(
          screen.getByText('calendar.disconnectButton')
        ).toBeInTheDocument();
      });

      const disconnectButton = screen.getByText('calendar.disconnectButton');
      fireEvent.click(disconnectButton);

      await waitFor(() => {
        expect(
          screen.getByText('calendar.disconnectTitle')
        ).toBeInTheDocument();
        expect(
          screen.getByText('calendar.disconnectWarning1')
        ).toBeInTheDocument();
      });
    });

    it('should close disconnect modal when cancel is clicked', async () => {
      renderWithContext(<CalendarSettings />);

      await waitFor(() => {
        expect(
          screen.getByText('calendar.disconnectButton')
        ).toBeInTheDocument();
      });

      const disconnectButton = screen.getByText('calendar.disconnectButton');
      fireEvent.click(disconnectButton);

      await waitFor(() => {
        expect(
          screen.getByText('calendar.disconnectTitle')
        ).toBeInTheDocument();
      });

      const cancelButton = screen.getByText('common.cancel');
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(
          screen.queryByText('calendar.disconnectTitle')
        ).not.toBeInTheDocument();
      });
    });

    it('should disconnect calendar when confirmed', async () => {
      calendarAPI.disconnect.mockResolvedValue({
        data: { success: true },
      });
      calendarAPI.getStatus.mockResolvedValueOnce(mockConnectedStatus);
      calendarAPI.getStatus.mockResolvedValueOnce(mockDisconnectedStatus);

      renderWithContext(<CalendarSettings />);

      await waitFor(() => {
        expect(
          screen.getByText('calendar.disconnectButton')
        ).toBeInTheDocument();
      });

      // Click disconnect
      const disconnectButton = screen.getByText('calendar.disconnectButton');
      fireEvent.click(disconnectButton);

      await waitFor(() => {
        expect(
          screen.getByText('calendar.disconnectTitle')
        ).toBeInTheDocument();
      });

      // Confirm disconnect - find the second disconnect button (in modal)
      const confirmButtons = screen.getAllByText('calendar.disconnectButton');
      const confirmButton = confirmButtons[confirmButtons.length - 1];
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(calendarAPI.disconnect).toHaveBeenCalledWith('GOOGLE');
        expect(
          screen.getByText('calendar.disconnectSuccess')
        ).toBeInTheDocument();
      });
    });

    it('should handle disconnect error', async () => {
      calendarAPI.disconnect.mockRejectedValue(new Error('Disconnect failed'));

      renderWithContext(<CalendarSettings />);

      await waitFor(() => {
        expect(
          screen.getByText('calendar.disconnectButton')
        ).toBeInTheDocument();
      });

      const disconnectButton = screen.getByText('calendar.disconnectButton');
      fireEvent.click(disconnectButton);

      await waitFor(() => {
        expect(
          screen.getByText('calendar.disconnectTitle')
        ).toBeInTheDocument();
      });

      const confirmButtons = screen.getAllByText('calendar.disconnectButton');
      const confirmButton = confirmButtons[confirmButtons.length - 1];
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(
          screen.getByText('calendar.disconnectError')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Preferences Management', () => {
    beforeEach(async () => {
      calendarAPI.getStatus.mockResolvedValue(mockConnectedStatus);
      calendarAPI.getPreferences.mockResolvedValue(mockPreferences);
      calendarAPI.getEvents.mockResolvedValue(mockEvents);
    });

    it('should display preferences when connected', async () => {
      renderWithContext(<CalendarSettings />);

      await waitFor(() => {
        expect(screen.getByText('calendar.preferences')).toBeInTheDocument();
      });
    });

    it('should toggle sync enabled preference', async () => {
      renderWithContext(<CalendarSettings />);

      await waitFor(() => {
        expect(screen.getByText('calendar.syncEnabled')).toBeInTheDocument();
      });

      const checkbox = screen
        .getByText('calendar.syncEnabled')
        .closest('label')
        .querySelector('input[type="checkbox"]');

      expect(checkbox.checked).toBe(true);
      fireEvent.click(checkbox);
      expect(checkbox.checked).toBe(false);
    });

    it('should toggle auto reminders preference', async () => {
      renderWithContext(<CalendarSettings />);

      await waitFor(() => {
        expect(
          screen.getByText('calendar.reminderPreferences')
        ).toBeInTheDocument();
      });

      // Expand reminder section
      const reminderHeader = screen.getByText('calendar.reminderPreferences');
      fireEvent.click(reminderHeader);

      await waitFor(() => {
        expect(screen.getByText('calendar.autoReminders')).toBeInTheDocument();
      });

      const checkbox = screen
        .getByText('calendar.autoReminders')
        .closest('label')
        .querySelector('input[type="checkbox"]');

      expect(checkbox.checked).toBe(true);
      fireEvent.click(checkbox);
      expect(checkbox.checked).toBe(false);
    });

    it('should update reminder time', async () => {
      renderWithContext(<CalendarSettings />);

      await waitFor(() => {
        expect(
          screen.getByText('calendar.reminderPreferences')
        ).toBeInTheDocument();
      });

      // Expand reminder section
      const reminderHeader = screen.getByText('calendar.reminderPreferences');
      fireEvent.click(reminderHeader);

      await waitFor(() => {
        expect(
          screen.getByText('calendar.reminderTimeBeforeEvent')
        ).toBeInTheDocument();
      });

      const input = screen.getByDisplayValue('60');
      fireEvent.change(input, { target: { value: '120' } });
      expect(input.value).toBe('120');
    });

    it('should update reminder type', async () => {
      renderWithContext(<CalendarSettings />);

      await waitFor(() => {
        expect(
          screen.getByText('calendar.reminderPreferences')
        ).toBeInTheDocument();
      });

      // Expand reminder section
      const reminderHeader = screen.getByText('calendar.reminderPreferences');
      fireEvent.click(reminderHeader);

      await waitFor(() => {
        expect(screen.getByText('calendar.reminderType')).toBeInTheDocument();
      });

      const select = screen.getByLabelText('calendar.reminderType');
      fireEvent.change(select, { target: { value: 'POPUP' } });
      expect(select.value).toBe('POPUP');
    });

    it('should update event color', async () => {
      renderWithContext(<CalendarSettings />);

      await waitFor(() => {
        expect(
          screen.getByText('calendar.eventPreferences')
        ).toBeInTheDocument();
      });

      // Expand event section
      const eventHeader = screen.getByText('calendar.eventPreferences');
      fireEvent.click(eventHeader);

      await waitFor(() => {
        expect(screen.getByText('calendar.eventColor')).toBeInTheDocument();
      });

      const select = screen.getByLabelText('calendar.eventColor');
      fireEvent.change(select, { target: { value: 'GREEN' } });
      expect(select.value).toBe('GREEN');
    });

    it('should update event visibility', async () => {
      renderWithContext(<CalendarSettings />);

      await waitFor(() => {
        expect(
          screen.getByText('calendar.eventPreferences')
        ).toBeInTheDocument();
      });

      // Expand event section
      const eventHeader = screen.getByText('calendar.eventPreferences');
      fireEvent.click(eventHeader);

      await waitFor(() => {
        expect(
          screen.getByText('calendar.eventVisibility')
        ).toBeInTheDocument();
      });

      const select = screen.getByLabelText('calendar.eventVisibility');
      fireEvent.change(select, { target: { value: 'PUBLIC' } });
      expect(select.value).toBe('PUBLIC');
    });

    it('should update event duration', async () => {
      renderWithContext(<CalendarSettings />);

      await waitFor(() => {
        expect(
          screen.getByText('calendar.eventPreferences')
        ).toBeInTheDocument();
      });

      // Expand event section
      const eventHeader = screen.getByText('calendar.eventPreferences');
      fireEvent.click(eventHeader);

      await waitFor(() => {
        expect(screen.getByText('calendar.eventDuration')).toBeInTheDocument();
      });

      const input = screen.getByDisplayValue('15');
      fireEvent.change(input, { target: { value: '30' } });
      expect(input.value).toBe('30');
    });

    it('should save preferences successfully', async () => {
      calendarAPI.updatePreferences.mockResolvedValue({
        data: { success: true },
      });

      renderWithContext(<CalendarSettings />);

      await waitFor(() => {
        expect(screen.getByText('calendar.saveButton')).toBeInTheDocument();
      });

      const saveButton = screen.getByText('calendar.saveButton');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(calendarAPI.updatePreferences).toHaveBeenCalled();
        expect(screen.getByText('calendar.saveSuccess')).toBeInTheDocument();
      });
    });

    it('should handle save error', async () => {
      calendarAPI.updatePreferences.mockRejectedValue(new Error('Save failed'));

      renderWithContext(<CalendarSettings />);

      await waitFor(() => {
        expect(screen.getByText('calendar.saveButton')).toBeInTheDocument();
      });

      const saveButton = screen.getByText('calendar.saveButton');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('calendar.saveError')).toBeInTheDocument();
      });
    });
  });

  describe('Manual Sync', () => {
    beforeEach(async () => {
      calendarAPI.getStatus.mockResolvedValue(mockConnectedStatus);
      calendarAPI.getPreferences.mockResolvedValue({
        data: {
          data: { ...mockPreferences.data.data, syncEnabled: false },
        },
      });
      calendarAPI.getEvents.mockResolvedValue(mockEvents);
    });

    it('should trigger manual sync successfully', async () => {
      calendarAPI.sync.mockResolvedValue({
        data: { message: 'Sync successful' },
      });

      renderWithContext(<CalendarSettings />);

      await waitFor(() => {
        expect(screen.getByText('calendar.syncButton')).toBeInTheDocument();
      });

      const syncButton = screen.getByText('calendar.syncButton');
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(calendarAPI.sync).toHaveBeenCalled();
      });
    });

    it('should handle sync error', async () => {
      calendarAPI.sync.mockRejectedValue(new Error('Sync failed'));

      renderWithContext(<CalendarSettings />);

      await waitFor(() => {
        expect(screen.getByText('calendar.syncButton')).toBeInTheDocument();
      });

      const syncButton = screen.getByText('calendar.syncButton');
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(screen.getByText('calendar.syncError')).toBeInTheDocument();
      });
    });
  });

  describe('Connection Details Modal', () => {
    beforeEach(async () => {
      calendarAPI.getStatus.mockResolvedValue(mockConnectedStatus);
      calendarAPI.getPreferences.mockResolvedValue(mockPreferences);
      calendarAPI.getEvents.mockResolvedValue(mockEvents);
    });

    it('should open connection details modal', async () => {
      renderWithContext(<CalendarSettings />);

      await waitFor(() => {
        expect(screen.getByText('View Connection Details')).toBeInTheDocument();
      });

      const detailsButton = screen.getByText('View Connection Details');
      fireEvent.click(detailsButton);

      await waitFor(() => {
        expect(
          screen.getByText('calendar.connectionDetails.title')
        ).toBeInTheDocument();
      });
    });

    it('should display connection details', async () => {
      renderWithContext(<CalendarSettings />);

      await waitFor(() => {
        expect(screen.getByText('View Connection Details')).toBeInTheDocument();
      });

      const detailsButton = screen.getByText('View Connection Details');
      fireEvent.click(detailsButton);

      await waitFor(() => {
        expect(screen.getByText('test@gmail.com')).toBeInTheDocument();
        expect(screen.getByText('My Calendar')).toBeInTheDocument();
        expect(screen.getByText('America/New_York')).toBeInTheDocument();
      });
    });

    it('should close connection details modal', async () => {
      renderWithContext(<CalendarSettings />);

      await waitFor(() => {
        expect(screen.getByText('View Connection Details')).toBeInTheDocument();
      });

      const detailsButton = screen.getByText('View Connection Details');
      fireEvent.click(detailsButton);

      await waitFor(() => {
        expect(
          screen.getByText('calendar.connectionDetails.title')
        ).toBeInTheDocument();
      });

      const closeButton = screen.getByText('common.close');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(
          screen.queryByText('calendar.connectionDetails.title')
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Synced Events Display', () => {
    beforeEach(async () => {
      calendarAPI.getStatus.mockResolvedValue(mockConnectedStatus);
      calendarAPI.getPreferences.mockResolvedValue(mockPreferences);
      calendarAPI.getEvents.mockResolvedValue(mockEvents);
    });

    it('should display synced events', async () => {
      renderWithContext(<CalendarSettings />);

      await waitFor(() => {
        expect(
          screen.getByText('Food Pickup - Restaurant A')
        ).toBeInTheDocument();
        expect(screen.getByText('Food Pickup - Bakery B')).toBeInTheDocument();
      });
    });

    it('should display event count', async () => {
      renderWithContext(<CalendarSettings />);

      await waitFor(() => {
        expect(screen.getByText(/\(2\)/)).toBeInTheDocument();
      });
    });

    it('should handle empty events list', async () => {
      calendarAPI.getEvents.mockResolvedValue({
        data: { data: [] },
      });

      renderWithContext(<CalendarSettings />);

      await waitFor(() => {
        expect(
          screen.queryByText('calendar.syncedEvents')
        ).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error alert', async () => {
      calendarAPI.getStatus.mockRejectedValue(new Error('Failed to load data'));

      renderWithContext(<CalendarSettings />);

      await waitFor(() => {
        expect(screen.getByText('calendar.loadError')).toBeInTheDocument();
      });
    });

    it('should close error alert', async () => {
      calendarAPI.getStatus.mockRejectedValue(new Error('Failed to load data'));

      renderWithContext(<CalendarSettings />);

      await waitFor(() => {
        expect(screen.getByText('calendar.loadError')).toBeInTheDocument();
      });

      const closeButton = screen.getByText('×');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(
          screen.queryByText('calendar.loadError')
        ).not.toBeInTheDocument();
      });
    });

    it('should auto-clear success message after 3 seconds', async () => {
      const { act } = require('@testing-library/react');
      jest.useFakeTimers();

      calendarAPI.getStatus.mockResolvedValue(mockConnectedStatus);
      calendarAPI.getPreferences.mockResolvedValue(mockPreferences);
      calendarAPI.getEvents.mockResolvedValue(mockEvents);
      calendarAPI.updatePreferences.mockResolvedValue({
        data: { success: true },
      });

      renderWithContext(<CalendarSettings />);

      await waitFor(() => {
        expect(screen.getByText('calendar.saveButton')).toBeInTheDocument();
      });

      const saveButton = screen.getByText('calendar.saveButton');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('calendar.saveSuccess')).toBeInTheDocument();
      });

      // Fast forward 3 seconds
      await act(async () => {
        jest.advanceTimersByTime(3000);
      });

      await waitFor(() => {
        expect(
          screen.queryByText('calendar.saveSuccess')
        ).not.toBeInTheDocument();
      });

      jest.useRealTimers();
    });
  });

  describe('Collapsible Sections', () => {
    beforeEach(async () => {
      calendarAPI.getStatus.mockResolvedValue(mockConnectedStatus);
      calendarAPI.getPreferences.mockResolvedValue(mockPreferences);
      calendarAPI.getEvents.mockResolvedValue(mockEvents);
    });

    it('should expand reminder section when clicked', async () => {
      renderWithContext(<CalendarSettings />);

      await waitFor(() => {
        expect(
          screen.getByText('calendar.reminderPreferences')
        ).toBeInTheDocument();
      });

      const reminderHeader = screen.getByText('calendar.reminderPreferences');
      fireEvent.click(reminderHeader);

      await waitFor(() => {
        expect(screen.getByText('calendar.autoReminders')).toBeInTheDocument();
      });
    });

    it('should collapse reminder section when clicked again', async () => {
      renderWithContext(<CalendarSettings />);

      await waitFor(() => {
        expect(
          screen.getByText('calendar.reminderPreferences')
        ).toBeInTheDocument();
      });

      const reminderHeader = screen.getByText('calendar.reminderPreferences');

      // Expand
      fireEvent.click(reminderHeader);

      await waitFor(() => {
        expect(screen.getByText('calendar.autoReminders')).toBeInTheDocument();
      });

      // Collapse
      fireEvent.click(reminderHeader);

      await waitFor(() => {
        expect(
          screen.queryByText('calendar.autoReminders')
        ).not.toBeInTheDocument();
      });
    });

    it('should expand event preferences section', async () => {
      renderWithContext(<CalendarSettings />);

      await waitFor(() => {
        expect(
          screen.getByText('calendar.eventPreferences')
        ).toBeInTheDocument();
      });

      const eventHeader = screen.getByText('calendar.eventPreferences');
      fireEvent.click(eventHeader);

      await waitFor(() => {
        expect(screen.getByText('calendar.eventColor')).toBeInTheDocument();
      });
    });
  });

  describe('Provider Fallback', () => {
    it('should default to GOOGLE when provider is not set', async () => {
      const statusWithoutProvider = {
        data: {
          data: {
            isConnected: false,
          },
        },
      };

      calendarAPI.getStatus.mockResolvedValue(statusWithoutProvider);

      renderWithContext(<CalendarSettings />);

      await waitFor(() => {
        expect(screen.getByText('calendar.connectButton')).toBeInTheDocument();
      });

      const connectButton = screen.getByText('calendar.connectButton');

      calendarAPI.initiateConnection.mockResolvedValue({
        data: {
          data: {
            authorizationUrl: 'https://accounts.google.com/oauth/authorize',
          },
        },
      });

      global.window.open = jest.fn(() => ({ closed: false }));

      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(calendarAPI.initiateConnection).toHaveBeenCalledWith('GOOGLE');
      });
    });
  });
});
