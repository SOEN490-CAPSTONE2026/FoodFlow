import React, { useState, useEffect, useContext } from 'react';
import {
  Calendar,
  Link as LinkIcon,
  Unlink as UnlinkIcon,
  CheckCircle,
  AlertCircle,
  Loader,
  ChevronDown,
  ChevronUp,
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
    provider: 'GOOGLE', // Default to GOOGLE
  });
  const [preferences, setPreferences] = useState({
    syncEnabled: true,
    autoCreateReminders: true,
    reminderSecondsBefore: 60, // in minutes
    reminderType: 'EMAIL',
    eventColor: 'BLUE',
    eventVisibility: 'PRIVATE',
    eventDuration: 15, // in minutes
  });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [testing, setTesting] = useState(false);
  const [reminderSectionExpanded, setReminderSectionExpanded] = useState(false);
  const [eventSectionExpanded, setEventSectionExpanded] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [showConnectionDetailsModal, setShowConnectionDetailsModal] =
    useState(false);

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
      const status = statusRes.data.data;
      // Default provider to GOOGLE if not set
      setConnectionStatus({
        ...status,
        provider: status.provider || 'GOOGLE',
      });

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

  const handleDisconnect = () => {
    setShowDisconnectModal(true);
  };

  const confirmDisconnect = async () => {
    setShowDisconnectModal(false);
    try {
      setLoading(true);
      setError(null);
      // Default to GOOGLE if provider is not set
      const provider = connectionStatus.provider || 'GOOGLE';
      await calendarAPI.disconnect(provider);
      setSuccess(
        t('calendar.disconnectSuccess') || 'Calendar disconnected successfully'
      );
      // Reset connection status
      setConnectionStatus({
        isConnected: false,
        provider: 'GOOGLE', // Default to GOOGLE
      });
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
      <div className="settings-section">
        <div className="loading-spinner">
          <Loader className="spinner-icon" />
          <p>{t('common.loading') || 'Loading...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-section">
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
        {connectionStatus.isConnected && (
          <button
            onClick={handleManualSync}
            disabled={loading || preferences.syncEnabled}
            className="btn btn-secondary btn-compact"
          >
            {loading
              ? t('common.syncing')
              : t('calendar.syncButton') || 'Sync Now'}
          </button>
        )}
      </div>

      <div className="section-content">
        {/* Connection Status */}
        <div className="connection-card">
          <div className="status-indicator">
            {connectionStatus.isConnected ? (
              <>
                <div className="status-content">
                  <div className="status-title-row">
                    <CheckCircle className="status-icon success" />
                    <p className="status-title">
                      {t('calendar.connected') || 'Connected'}
                    </p>
                  </div>
                  <p className="status-subtext">
                    {t('calendar.provider') || 'Provider'}:{' '}
                    {connectionStatus.provider || 'GOOGLE'}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="status-content">
                  <div className="status-title-row">
                    <AlertCircle className="status-icon warning" />
                    <p className="status-title">
                      {t('calendar.notConnected') || 'Not Connected'}
                    </p>
                  </div>
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
                  onClick={() => setShowConnectionDetailsModal(true)}
                  disabled={testing}
                  className="btn btn-secondary"
                >
                  {testing ? t('common.loading') : 'View Connection Details'}
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
              <label className="checkbox-label btn-compact">
                <input
                  type="checkbox"
                  checked={preferences.syncEnabled}
                  onChange={e =>
                    handlePreferencesChange('syncEnabled', e.target.checked)
                  }
                />
                <span>
                  {t('calendar.syncEnabled') || 'Enable automatic sync'}
                </span>
              </label>
            </div>

            {/* Reminders Section */}
            <div className="preferences-subsection">
              <h4
                className="subsection-header collapsible-header"
                onClick={() =>
                  setReminderSectionExpanded(!reminderSectionExpanded)
                }
              >
                {t('calendar.reminderPreferences') || 'Reminder Preferences'}
                {reminderSectionExpanded ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </h4>

              {reminderSectionExpanded && (
                <div>
                  <div className="preference-group">
                    <label className="checkbox-label btn-compact">
                      <input
                        type="checkbox"
                        checked={preferences.autoCreateReminders}
                        onChange={e =>
                          handlePreferencesChange(
                            'autoCreateReminders',
                            e.target.checked
                          )
                        }
                      />
                      <span>
                        {t('calendar.autoReminders') ||
                          'Enable automatic reminders'}
                      </span>
                    </label>
                  </div>

                  <div className="preference-group">
                    <label
                      htmlFor="reminder-seconds"
                      className="preference-label"
                    >
                      {t('calendar.reminderTimeBeforeEvent') ||
                        'Reminder time before event'}
                    </label>
                    <div className="input-with-unit">
                      <input
                        id="reminder-seconds"
                        type="number"
                        min="0"
                        max="1440"
                        value={preferences.reminderSecondsBefore}
                        onChange={e =>
                          handlePreferencesChange(
                            'reminderSecondsBefore',
                            parseInt(e.target.value) || 0
                          )
                        }
                        placeholder="60"
                        disabled={!preferences.autoCreateReminders}
                        className="input-field"
                      />
                      <span className="input-unit">minutes</span>
                    </div>
                  </div>

                  <div className="preference-group">
                    <label htmlFor="reminder-type" className="preference-label">
                      {t('calendar.reminderType') || 'Reminder Type'}
                    </label>
                    <select
                      id="reminder-type"
                      value={preferences.reminderType}
                      onChange={e =>
                        handlePreferencesChange('reminderType', e.target.value)
                      }
                      disabled={!preferences.autoCreateReminders}
                      className="select-field"
                    >
                      <option value="EMAIL">Email</option>
                      <option value="POPUP">Pop-up</option>
                      <option value="BOTH">Both</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Event Preferences Section */}
            <div className="preferences-subsection">
              <h4
                className="subsection-header collapsible-header"
                onClick={() => setEventSectionExpanded(!eventSectionExpanded)}
              >
                {t('calendar.eventPreferences') || 'Event Preferences'}
                {eventSectionExpanded ? (
                  <ChevronUp size={20} />
                ) : (
                  <ChevronDown size={20} />
                )}
              </h4>

              {eventSectionExpanded && (
                <div>
                  <div className="preference-group">
                    <label htmlFor="event-color" className="preference-label">
                      {t('calendar.eventColor') || 'Event Color'}
                    </label>
                    <select
                      id="event-color"
                      value={preferences.eventColor}
                      onChange={e =>
                        handlePreferencesChange('eventColor', e.target.value)
                      }
                      className="select-field"
                    >
                      <option value="BLUE">Blue</option>
                      <option value="GREEN">Green</option>
                      <option value="PURPLE">Purple</option>
                      <option value="RED">Red</option>
                      <option value="YELLOW">Yellow</option>
                      <option value="ORANGE">Orange</option>
                      <option value="GRAY">Gray</option>
                    </select>
                  </div>

                  <div className="preference-group">
                    <label
                      htmlFor="event-visibility"
                      className="preference-label"
                    >
                      {t('calendar.eventVisibility') || 'Event Visibility'}
                    </label>
                    <select
                      id="event-visibility"
                      value={preferences.eventVisibility}
                      onChange={e =>
                        handlePreferencesChange(
                          'eventVisibility',
                          e.target.value
                        )
                      }
                      className="select-field"
                    >
                      <option value="PRIVATE">Private</option>
                      <option value="PUBLIC">Public</option>
                    </select>
                  </div>

                  <div className="preference-group">
                    <label
                      htmlFor="event-duration"
                      className="preference-label"
                    >
                      {t('calendar.eventDuration') || 'Event Duration'}
                    </label>
                    <div className="input-with-unit">
                      <input
                        id="event-duration"
                        type="number"
                        min="1"
                        max="1440"
                        value={preferences.eventDuration}
                        onChange={e =>
                          handlePreferencesChange(
                            'eventDuration',
                            parseInt(e.target.value) || 1
                          )
                        }
                        placeholder="15"
                        className="input-field"
                      />
                      <span className="input-unit">minutes</span>
                    </div>
                    <small
                      style={{
                        color: '#666',
                        fontSize: '12px',
                        marginTop: '4px',
                        display: 'block',
                        textAlign: 'left',
                      }}
                    >
                      Only applied if the pickup has no end time
                    </small>
                  </div>
                </div>
              )}
            </div>

            <div className="preferences-actions">
              <button
                onClick={handleSavePreferences}
                disabled={saving}
                className="btn btn-primary btn-compact"
              >
                {saving
                  ? t('common.saving')
                  : t('calendar.saveButton') || 'Save Preferences'}
              </button>
            </div>

            {/* Privacy Policy Link */}
            <div
              className="preference-group"
              style={{
                marginTop: '1.5rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid #e0e0e0',
              }}
            >
              <p
                style={{
                  fontSize: '0.875rem',
                  color: '#666',
                  lineHeight: '1.6',
                }}
              >
                Click here for the{' '}
                <a
                  href="/privacy-policy#third-party-integrations"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#609B7E',
                    textDecoration: 'underline',
                    fontWeight: '500',
                  }}
                >
                  calendar integration policy
                </a>
                .
              </p>
            </div>
          </div>
        )}

        {/* Synced Events Section */}
        {connectionStatus.isConnected && events.length > 0 && (
          <div className="events-section">
            <h3>
              {t('calendar.syncedEvents') || 'Synced Events'} ({events.length})
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

      {/* Connection Details Modal */}
      {showConnectionDetailsModal && (
        <>
          <div
            className="modal-overlay"
            onClick={() => setShowConnectionDetailsModal(false)}
          />
          <div
            className="connection-details-modal"
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>
                {t('calendar.connectionDetails.title') || 'Connection Details'}
              </h3>
              <button
                className="modal-close"
                onClick={() => setShowConnectionDetailsModal(false)}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="connection-details-grid">
                <div className="detail-item">
                  <label className="detail-label">
                    {t('calendar.connectionDetails.connectedSince') ||
                      'Connected Since'}
                  </label>
                  <p className="detail-value">
                    {connectionStatus.connectedSince
                      ? new Date(
                          connectionStatus.connectedSince
                        ).toLocaleString()
                      : t('calendar.connectionDetails.notAvailable') ||
                        'Not available yet'}
                  </p>
                </div>

                <div className="detail-item">
                  <label className="detail-label">
                    {t('calendar.connectionDetails.googleAccountEmail') ||
                      'Google Account Email'}
                  </label>
                  <p className="detail-value">
                    {connectionStatus.googleAccountEmail ||
                      t('calendar.connectionDetails.notAvailable') ||
                      'Not available yet'}
                  </p>
                </div>

                <div className="detail-item">
                  <label className="detail-label">
                    {t('calendar.connectionDetails.primaryCalendarName') ||
                      'Primary Calendar Name'}
                  </label>
                  <p className="detail-value">
                    {connectionStatus.primaryCalendarName ||
                      t('calendar.connectionDetails.notAvailable') ||
                      'Not available yet'}
                  </p>
                </div>

                <div className="detail-item">
                  <label className="detail-label">
                    {t('calendar.connectionDetails.calendarTimeZone') ||
                      'Calendar Time Zone'}
                  </label>
                  <p className="detail-value">
                    {connectionStatus.calendarTimeZone ||
                      t('calendar.connectionDetails.notAvailable') ||
                      'Not available yet'}
                  </p>
                </div>

                <div className="detail-item">
                  <label className="detail-label">
                    {t('calendar.connectionDetails.lastSuccessfulSync') ||
                      'Last Successful Sync'}
                  </label>
                  <p className="detail-value">
                    {connectionStatus.lastSuccessfulSync
                      ? new Date(
                          connectionStatus.lastSuccessfulSync
                        ).toLocaleString()
                      : t('calendar.connectionDetails.never') || 'Never'}
                  </p>
                </div>

                <div className="detail-item">
                  <label className="detail-label">
                    {t('calendar.connectionDetails.lastFailedRefresh') ||
                      'Last Failed Refresh'}
                  </label>
                  <p className="detail-value">
                    {connectionStatus.lastFailedRefresh
                      ? new Date(
                          connectionStatus.lastFailedRefresh
                        ).toLocaleString()
                      : t('calendar.connectionDetails.never') || 'Never'}
                  </p>
                </div>

                <div className="detail-item detail-item-full">
                  <label className="detail-label">
                    {t('calendar.connectionDetails.grantedScopes') ||
                      'Granted Scopes'}
                  </label>
                  <div className="scopes-list">
                    {connectionStatus.grantedScopes ? (
                      connectionStatus.grantedScopes
                        .split(' ')
                        .map((scope, index) => (
                          <span key={index} className="scope-badge">
                            {scope}
                          </span>
                        ))
                    ) : (
                      <span className="scope-badge">
                        {t('calendar.connectionDetails.notAvailable') ||
                          'Not available yet'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-primary"
                onClick={() => setShowConnectionDetailsModal(false)}
              >
                {t('common.close') || 'Close'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Disconnect Confirmation Modal */}
      {showDisconnectModal && (
        <>
          <div
            className="modal-overlay"
            onClick={() => setShowDisconnectModal(false)}
          />
          <div className="disconnect-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('calendar.disconnectTitle') || 'Disconnect Calendar?'}</h3>
              <button
                className="modal-close"
                onClick={() => setShowDisconnectModal(false)}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-warning-icon">
                <AlertCircle size={48} />
              </div>
              <p className="modal-text">
                {t('calendar.disconnectWarning1') ||
                  'By disconnecting your calendar, FoodFlow will lose all permissions to perform operations on your Google Calendar.'}
              </p>
              <p className="modal-text">
                {t('calendar.disconnectWarning2') ||
                  'To re-enable calendar integration, you will need to go through the OAuth connection flow again.'}
              </p>
              <p className="modal-text">
                {t('calendar.disconnectWarning3') ||
                  'All events that were already created will still be present in your calendar.'}
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowDisconnectModal(false)}
              >
                {t('common.cancel') || 'Cancel'}
              </button>
              <button className="btn btn-danger" onClick={confirmDisconnect}>
                {t('calendar.disconnectButton') || 'Disconnect'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CalendarSettings;
