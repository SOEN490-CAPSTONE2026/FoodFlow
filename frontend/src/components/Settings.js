import React, { useState, useRef, useEffect, useContext } from 'react';
import { User, Globe, Bell, Camera, Lock } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';
import RegionSelector from './RegionSelector';
import { AuthContext } from '../contexts/AuthContext';
import axios from 'axios';
import '../style/Settings.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8080/api";

/**
 * Reusable Settings page component for all dashboards (Donor, Receiver, Admin)
 */
const Settings = () => {
  const { userId, organizationName } = useContext(AuthContext);
  
  const [notifications, setNotifications] = useState({
    newDonations: true,
    pickupReminders: true,
    messagesFromDonors: true,
    weeklyImpactReport: false,
    emailDigest: true,
    smsAlerts: false,
  });

  // Profile form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    organization: organizationName || '',
    address: ''
  });

  const [profileImage, setProfileImage] = useState(null);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [regionSettings, setRegionSettings] = useState(null);
  
  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);
  
  const fileInputRef = useRef(null);

  // Load user profile on component mount
  useEffect(() => {
    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  // Sync organization name from context
  useEffect(() => {
    if (organizationName && !formData.organization) {
      setFormData(prev => ({ ...prev, organization: organizationName }));
    }
  }, [organizationName]);

  // Auto-clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const fetchUserProfile = async () => {
    // Backend will implement this endpoint
    setLoadingProfile(false);
  };

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhoneNumber = (phone) => {
    // Accepts various formats: (123) 456-7890, 123-456-7890, 1234567890, +1234567890
    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
    return phoneRegex.test(phone);
  };

  const formatPhoneNumber = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    
    // Format as E.164 standard with country code (assuming North America +1)
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    } else if (cleaned.startsWith('+')) {
      return phone;
    }
    return `+${cleaned}`;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName || formData.fullName.trim().length === 0) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    if (!formData.email || formData.email.trim().length === 0) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.phoneNumber && !validatePhoneNumber(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    // Password validation (if changing password)
    if (showPasswordFields) {
      if (!passwordData.currentPassword) {
        newErrors.currentPassword = 'Current password is required';
      }
      if (!passwordData.newPassword) {
        newErrors.newPassword = 'New password is required';
      } else if (passwordData.newPassword.length < 8) {
        newErrors.newPassword = 'Password must be at least 8 characters';
      }
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleToggle = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleRegionChange = (regionData) => {
    setRegionSettings(regionData);
    console.log('Region settings updated:', regionData);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ profileImage: 'Image size must be less than 5MB' });
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors({ profileImage: 'Please upload a valid image file' });
        return;
      }

      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
      
      // Clear any previous image errors
      if (errors.profileImage) {
        setErrors(prev => ({ ...prev, profileImage: '' }));
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSaveChanges = async () => {
    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setSuccessMessage('');
    setErrors({});

    try {
      const token = localStorage.getItem("jwtToken") || sessionStorage.getItem("jwtToken");
      
      // Prepare FormData for multipart upload (if there's an image)
      const updateData = new FormData();
      updateData.append('fullName', formData.fullName);
      updateData.append('email', formData.email);
      
      // Format phone number to consistent E.164 format before sending
      if (formData.phoneNumber) {
        updateData.append('phoneNumber', formatPhoneNumber(formData.phoneNumber));
      } else {
        updateData.append('phoneNumber', '');
      }
      
      updateData.append('organization', formData.organization || '');
      updateData.append('address', formData.address || '');
      
      if (profileImageFile) {
        updateData.append('profileImage', profileImageFile);
      }

      // If password is being changed, add password fields
      if (showPasswordFields && passwordData.currentPassword) {
        updateData.append('currentPassword', passwordData.currentPassword);
        updateData.append('newPassword', passwordData.newPassword);
      }

      const response = await axios.put(
        `${API_BASE_URL}/users/update`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setSuccessMessage('Profile updated successfully!');
      
      // Reset password fields
      if (showPasswordFields) {
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setShowPasswordFields(false);
      }

      // Refresh profile data
      await fetchUserProfile();
      
    } catch (error) {
      console.error('Error updating profile:', error);
      if (error.response?.data?.message) {
        setErrors({ submit: error.response.data.message });
      } else {
        setErrors({ submit: 'Failed to update profile. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-content">
        
        {/* Success Message */}
        {successMessage && (
          <div className="success-message">
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {errors.submit && (
          <div className="error-message">
            {errors.submit}
          </div>
        )}
        
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
            {loadingProfile ? (
              <div className="loading-spinner">Loading profile...</div>
            ) : (
              <>
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
                      {errors.profileImage && <span className="field-error">{errors.profileImage}</span>}
                    </div>
                  </div>
                </div>

                <div className="account-form-grid">
                  <div className="form-field">
                    <label className="field-label">Full Name *</label>
                    <input 
                      type="text"
                      name="fullName"
                      className={`field-input ${errors.fullName ? 'error' : ''}`}
                      placeholder="Enter your full name"
                      value={formData.fullName}
                      onChange={handleInputChange}
                    />
                    {errors.fullName && <span className="field-error">{errors.fullName}</span>}
                  </div>
                  <div className="form-field">
                    <label className="field-label">Email Address *</label>
                    <input 
                      type="email"
                      name="email"
                      className={`field-input ${errors.email ? 'error' : ''}`}
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                    {errors.email && <span className="field-error">{errors.email}</span>}
                  </div>
                  <div className="form-field">
                    <label className="field-label">Organization</label>
                    <input 
                      type="text"
                      name="organization"
                      className="field-input"
                      placeholder="Enter your organization"
                      value={formData.organization}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-field">
                    <label className="field-label">Phone Number</label>
                    <input 
                      type="tel"
                      name="phoneNumber"
                      className={`field-input ${errors.phoneNumber ? 'error' : ''}`}
                      placeholder="Enter your phone number"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                    />
                    {errors.phoneNumber && <span className="field-error">{errors.phoneNumber}</span>}
                  </div>
                  <div className="form-field form-field-full">
                    <label className="field-label">Address</label>
                    <input 
                      type="text"
                      name="address"
                      className="field-input"
                      placeholder="Enter your address"
                      value={formData.address}
                      onChange={handleInputChange}
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
                        <label className="field-label">Current Password *</label>
                        <input 
                          type="password"
                          name="currentPassword"
                          className={`field-input ${errors.currentPassword ? 'error' : ''}`}
                          placeholder="Enter current password"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                        />
                        {errors.currentPassword && <span className="field-error">{errors.currentPassword}</span>}
                      </div>
                      <div className="form-field">
                        <label className="field-label">New Password *</label>
                        <input 
                          type="password"
                          name="newPassword"
                          className={`field-input ${errors.newPassword ? 'error' : ''}`}
                          placeholder="Enter new password"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                        />
                        {errors.newPassword && <span className="field-error">{errors.newPassword}</span>}
                      </div>
                      <div className="form-field">
                        <label className="field-label">Confirm New Password *</label>
                        <input 
                          type="password"
                          name="confirmPassword"
                          className={`field-input ${errors.confirmPassword ? 'error' : ''}`}
                          placeholder="Confirm new password"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                        />
                        {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
                      </div>
                    </div>
                  )}
                </div>

                <button 
                  className="save-changes-btn" 
                  onClick={handleSaveChanges}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            )}
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
