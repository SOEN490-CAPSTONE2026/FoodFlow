import React, { useState, useRef } from 'react';
import { User, Globe, Bell, Camera, Lock } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import RegionSelector from './RegionSelector';
import '../style/Settings.css';

/**
 * Reusable Settings page component for all dashboards (Donor, Receiver, Admin)
 */
const Settings = () => {
  const [notifications, setNotifications] = useState({
    newDonations: true,
    pickupReminders: true,
    messagesFromDonors: true,
    weeklyImpactReport: false,
    emailDigest: true,
    smsAlerts: false,
  });

  const [profileImage, setProfileImage] = useState(null);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [regionSettings, setRegionSettings] = useState(null);
  const fileInputRef = useRef(null);

  const handleToggle = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleRegionChange = (regionData) => {
    setRegionSettings(regionData);
    console.log('Region settings updated:', regionData);
    // You can add API call here to save to backend
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="settings-container">
      <div className="settings-content">
        
        {/* Account Section */}
        <div className="settings-section">
          <div className="section-header-with-icon">
            <div className="icon-circle">
              <User size={24} />
            </div>
            <div className="section-title-group">
              <h2>Account</h2>
              <p className="section-description">Manage your profile and account details</p>
            </div>
          </div>
          <div className="section-content">
            {/* Profile Image Upload */}
            <div className="profile-image-section">
              <div className="profile-image-container">
                <div className="profile-image-wrapper">
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="profile-image" />
                  ) : (
                    <div className="profile-image-placeholder">
                      <User size={48} />
                    </div>
                  )}
                  <button 
                    className="profile-image-upload-btn" 
                    onClick={triggerFileInput}
                    type="button"
                  >
                    <Camera size={18} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                </div>
                <div className="profile-image-info">
                  <h3>Profile Photo</h3>
                  <p>Upload a photo to personalize your account</p>
                </div>
              </div>
            </div>

            <div className="account-form-grid">
              <div className="form-field">
                <label className="field-label">Full Name</label>
                <input 
                  type="text" 
                  className="field-input" 
                  placeholder="Enter your full name"
                />
              </div>
              <div className="form-field">
                <label className="field-label">Email Address</label>
                <input 
                  type="email" 
                  className="field-input" 
                  placeholder="Enter your email"
                />
              </div>
              <div className="form-field">
                <label className="field-label">Organization</label>
                <input 
                  type="text" 
                  className="field-input" 
                  placeholder="Enter your organization"
                />
              </div>
              <div className="form-field">
                <label className="field-label">Phone Number</label>
                <input 
                  type="tel" 
                  className="field-input" 
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            {/* Password Section */}
            <div className="password-section">
              <button 
                className="password-toggle-btn"
                onClick={() => setShowPasswordFields(!showPasswordFields)}
                type="button"
              >
                <Lock size={18} />
                <span>Change Password</span>
              </button>
              
              {showPasswordFields && (
                <div className="password-fields">
                  <div className="form-field">
                    <label className="field-label">Current Password</label>
                    <input 
                      type="password" 
                      className="field-input" 
                      placeholder="Enter current password"
                    />
                  </div>
                  <div className="form-field">
                    <label className="field-label">New Password</label>
                    <input 
                      type="password" 
                      className="field-input" 
                      placeholder="Enter new password"
                    />
                  </div>
                  <div className="form-field">
                    <label className="field-label">Confirm New Password</label>
                    <input 
                      type="password" 
                      className="field-input" 
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
              )}
            </div>

            <button className="save-changes-btn">Save Changes</button>
          </div>
        </div>

        {/* Language & Region Section */}
        <div className="settings-section">
          <div className="section-header-with-icon">
            <div className="icon-circle">
              <Globe size={24} />
            </div>
            <div className="section-title-group">
              <h2>Language & Region</h2>
              <p className="section-description">Set your language, location, and timezone preferences</p>
            </div>
          </div>
          <div className="section-content">
            <div className="language-region-container">
              <div className="subsection-header">
                <h3 className="subsection-title">Language Preference</h3>
                <p className="subsection-description">Choose your preferred language for the interface</p>
              </div>
              <LanguageSwitcher />
            </div>
            
            <div className="region-settings-divider"></div>
            
            <div className="language-region-container">
              <div className="subsection-header">
                <h3 className="subsection-title">Location & Timezone</h3>
                <p className="subsection-description">Set your location to ensure accurate date and time information</p>
              </div>
              <RegionSelector value={regionSettings} onChange={handleRegionChange} />
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="settings-section">
          <div className="section-header-with-icon">
            <div className="icon-circle">
              <Bell size={24} />
            </div>
            <div className="section-title-group">
              <h2>Notifications</h2>
              <p className="section-description">Customize how you receive updates</p>
            </div>
          </div>
          <div className="section-content">
            <div className="notification-list">
              <div className="notification-item">
                <div className="notification-info">
                  <h3 className="notification-title">New Donations Available</h3>
                  <p className="notification-desc">Get notified when new food donations are posted in your area</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={notifications.newDonations}
                    onChange={() => handleToggle('newDonations')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="notification-item">
                <div className="notification-info">
                  <h3 className="notification-title">Pickup Reminders</h3>
                  <p className="notification-desc">Receive reminders before scheduled pickup times</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={notifications.pickupReminders}
                    onChange={() => handleToggle('pickupReminders')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="notification-item">
                <div className="notification-info">
                  <h3 className="notification-title">Messages</h3>
                  <p className="notification-desc">Notifications when a user send you messages</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={notifications.messagesFromDonors}
                    onChange={() => handleToggle('messagesFromDonors')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="notification-item">
                <div className="notification-info">
                  <h3 className="notification-title">Weekly Impact Report</h3>
                  <p className="notification-desc">Summary of meals saved and impact created</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={notifications.weeklyImpactReport}
                    onChange={() => handleToggle('weeklyImpactReport')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="notification-item">
                <div className="notification-info">
                  <h3 className="notification-title">Email Digest</h3>
                  <p className="notification-desc">Daily summary of activity via email</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={notifications.emailDigest}
                    onChange={() => handleToggle('emailDigest')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="notification-item">
                <div className="notification-info">
                  <h3 className="notification-title">SMS Alerts</h3>
                  <p className="notification-desc">Urgent notifications via text message</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={notifications.smsAlerts}
                    onChange={() => handleToggle('smsAlerts')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;
