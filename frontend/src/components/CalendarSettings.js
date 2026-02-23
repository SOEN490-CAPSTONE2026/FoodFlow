import React, { useState, useEffect, useContext } from 'react';
import {
  Calendar,
  Link as LinkIcon,
  Unlink as UnlinkIcon,
  CheckCircle,
  AlertCircle,
  Loader,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../contexts/AuthContext';
import { calendarAPI } from '../services/api';
import '../style/CalendarSettings.css';

const CalendarSettings = () => {
  const { t } = useTranslation();
  const { userId } = useContext(AuthContext);

  // State management
  const [connectionStatus, setConnectionStatus] = useState({
    isConnected: false,
    provider: null,
  });
  const [preferences, setPreferences] = useState({
    syncEnabled: true,
    syncPickupEvents: true,
    syncDeliveryEvents: true,
    syncClaimEvents: true,
    autoCreateReminders: true,
    reminderMinutesBefore: 30,
  });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [testing, setTesting] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadCalendarData();
  }, []);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load connection status
      const statusRes = await calendarAPI.getStatus();
      setConnectionStatus(statusRes.data.data);

      // Load preferences if connected
      if (statusRes.data.data.isConnected) {
        const prefRes = await calendarAPI.getPreferences();
        setPreferences(prefRes.data.data);

        // Load synced events
        const eventsRes = await calendarAPI.getEvents();
        setEvents(eventsRes.data.data || []);
      }
    } catch (err) {
      setError(t('calendar.loadError') || 'Failed to load calendar data');
      console.error('Calendar data load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get OAuth URL
      const response = await calendarAPI.initiateConnection('GOOGLE');
      const authorizationUrl = response.data.data.authorizationUrl;

      // Redirect to Google OAuth
      // In a real app, you'd use a popup window to handle the callback
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        authorizationUrl,
        'CalendarAuth',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Check for popup close and reload data
      const checkPopup = setInterval(() => {
        if (popup && popup.closed) {
          clearInterval(checkPopup);
          // Reload status after a short delay to allow backend to process
          setTimeout(() => loadCalendarData(), 1000);
        }
      }, 1000);
    } catch (err) {
      setError(
        t('calendar.connectError') || 'Failed to initiate calendar connection'
      );
      console.error('Connection error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (
      !window.confirm(
        t('calendar.confirmDisconnect') ||
          'Are you sure you want to disconnect your calendar?'
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // Default to GOOGLE if provider is not set
      const provider = connectionStatus.provider || 'GOOGLE';
      await calendarAPI.disconnect(provider);
      setSuccess(
        t('calendar.disconnectSuccess') || 'Calendar disconnected successfully'
      );
      loadCalendarData();
    } catch (err) {
      setError(
        t('calendar.disconnectError') || 'Failed to disconnect calendar'
      );
      console.error('Disconnect error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesChange = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSavePreferences = async () => {
    try {
      setSaving(true);
      setError(null);
      await calendarAPI.updatePreferences(preferences);
      setSuccess(t('calendar.saveSuccess') || 'Preferences saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(t('calendar.saveError') || 'Failed to save preferences');
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setError(null);
      const response = await calendarAPI.testConnection('GOOGLE');
      setSuccess(response.data.message || 'Connection test successful');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Connection test failed');
    } finally {
      setTesting(false);
    }
  };

  const handleManualSync = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await calendarAPI.sync();
      setSuccess(response.data.message || 'Sync triggered successfully');
      setTimeout(() => loadCalendarData(), 1000);
    } catch (err) {
      setError(t('calendar.syncError') || 'Failed to sync calendar');
      console.error('Sync error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !connectionStatus.isConnected) {
    return (
      <div className="calendar-settings-container">
        <div className="loading-spinner">
          <Loader className="spinner-icon" />
          <p>{t('common.loading') || 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="calendar-settings-container">
      {/* Error Alert */}
      {error && (
        <div className="alert alert-error">
          <AlertCircle className="alert-icon" />
          <p>{error}</p>
          <button onClick={() => setError(null)} className="alert-close">
            &times;
          </button>
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div className="alert alert-success">
          <CheckCircle className="alert-icon" />
          <p>{success}</p>
        </div>
      )}

      {/* Connection Section */}
      <div className="settings-panel">
        <div className="section-header-with-icon">
          <div className="icon-circle">
            <Calendar size={24} />
          </div>
          <div className="section-title-group">
            <h2>{t('calendar.title') || 'Calendar Integration'}</h2>
            <p className="section-description">
              {t('calendar.description') ||
                'Connect your Google Calendar to automatically sync donation appointments and pickups'}
            </p>
          </div>
        </div>

        <div className="section-content">
          {/* Connection Status */}
          <div className="connection-card">
            <div className="status-indicator">
              {connectionStatus.isConnected ? (
                <>
                  <CheckCircle className="status-icon success" />
                  <div>
                    <p className="status-title">
                      {t('calendar.connected') || 'Connected'}
                    </p>
                    <p className="status-subtext">
                      {t('calendar.provider') || 'Provider'}:{' '}
                      {connectionStatus.provider}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="status-icon warning" />
                  <div>
                    <p className="status-title">
                      {t('calendar.notConnected') || 'Not Connected'}
                    </p>
                    <p className="status-subtext">
                      {t('calendar.connectPrompt') ||
                        'Connect your calendar to get started'}
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="connection-actions">
              {!connectionStatus.isConnected ? (
                <button
                  onClick={handleConnect}
                  disabled={loading}
                  className="btn btn-primary"
                >
                  <LinkIcon size={18} />
                  {loading
                    ? t('common.loading')
                    : t('calendar.connectButton') || 'Connect Google Calendar'}
                </button>
              ) : (
                <>
                  <button
                    onClick={handleTestConnection}
                    disabled={testing}
                    className="btn btn-secondary"
                  >
                    {testing
                      ? t('common.testing')
                      : t('calendar.testButton') || 'Test Connection'}
                  </button>
                  <button
                    onClick={handleDisconnect}
                    disabled={loading}
                    className="btn btn-danger"
                  >
                    <UnlinkIcon size={18} />
                    {t('calendar.disconnectButton') || 'Disconnect'}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Preferences Section */}
          {connectionStatus.isConnected && (
            <div className="preferences-section">
              <h3>{t('calendar.preferences') || 'Sync Preferences'}</h3>

              <div className="preference-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={preferences.syncEnabled}
                    onChange={e =>
                      handlePreferencesChange('syncEnabled', e.target.checked)
                    }
                  />
                  <span>
                    {t('calendar.syncEnabled') || 'Enable calendar sync'}
                  </span>
                </label>
              </div>

              <div className="preference-group">
                <label className="preference-title">
                  {t('calendar.eventTypes') || 'Event Types to Sync'}
                </label>
                <div className="event-type-checkboxes">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={preferences.syncPickupEvents}
                      onChange={e =>
                        handlePreferencesChange(
                          'syncPickupEvents',
                          e.target.checked
                        )
                      }
                      disabled={!preferences.syncEnabled}
                    />
                    <span>{t('calendar.pickupEvents') || 'Pickup Events'}</span>
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={preferences.syncDeliveryEvents}
                      onChange={e =>
                        handlePreferencesChange(
                          'syncDeliveryEvents',
                          e.target.checked
                        )
                      }
                      disabled={!preferences.syncEnabled}
                    />
                    <span>
                      {t('calendar.deliveryEvents') || 'Delivery Events'}
                    </span>
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={preferences.syncClaimEvents}
                      onChange={e =>
                        handlePreferencesChange(
                          'syncClaimEvents',
                          e.target.checked
                        )
                      }
                      disabled={!preferences.syncEnabled}
                    />
                    <span>{t('calendar.claimEvents') || 'Claim Events'}</span>
                  </label>
                </div>
              </div>

              <div className="preference-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={preferences.autoCreateReminders}
                    onChange={e =>
                      handlePreferencesChange(
                        'autoCreateReminders',
                        e.target.checked
                      )
                    }
                    disabled={!preferences.syncEnabled}
                  />
                  <span>
                    {t('calendar.autoReminders') ||
                      'Automatically create reminders'}
                  </span>
                </label>
              </div>

              <div className="preference-group">
                <label htmlFor="reminder-minutes" className="preference-label">
                  {t('calendar.reminderTime') ||
                    'Reminder time before event (minutes)'}
                </label>
                <input
                  id="reminder-minutes"
                  type="number"
                  min="0"
                  max="1440"
                  value={preferences.reminderMinutesBefore}
                  onChange={e =>
                    handlePreferencesChange(
                      'reminderMinutesBefore',
                      parseInt(e.target.value)
                    )
                  }
                  disabled={
                    !preferences.syncEnabled || !preferences.autoCreateReminders
                  }
                  className="input-field"
                />
              </div>

              <div className="preferences-actions">
                <button
                  onClick={handleSavePreferences}
                  disabled={saving}
                  className="btn btn-primary"
                >
                  {saving
                    ? t('common.saving')
                    : t('calendar.saveButton') || 'Save Preferences'}
                </button>
                <button
                  onClick={handleManualSync}
                  disabled={loading}
                  className="btn btn-secondary"
                >
                  {loading
                    ? t('common.syncing')
                    : t('calendar.syncButton') || 'Sync Now'}
                </button>
              </div>
            </div>
          )}

          {/* Synced Events Section */}
          {connectionStatus.isConnected && events.length > 0 && (
            <div className="events-section">
              <h3>
                {t('calendar.syncedEvents') || 'Synced Events'} ({events.length}
                )
              </h3>
              <div className="events-list">
                {events.map(event => (
                  <div key={event.id} className="event-item">
                    <div className="event-time">
                      {new Date(event.startTime).toLocaleDateString()}{' '}
                      {new Date(event.startTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    <div className="event-details">
                      <p className="event-title">{event.eventTitle}</p>
                      <p className="event-status">
                        {event.syncStatus === 'SYNCED' && (
                          <CheckCircle
                            size={14}
                            className="status-icon success"
                          />
                        )}
                        {event.syncStatus}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarSettings;
