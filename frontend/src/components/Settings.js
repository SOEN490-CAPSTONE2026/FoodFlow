import React, { useState, useRef, useEffect, useContext } from 'react';
import { Autocomplete, useLoadScript } from '@react-google-maps/api';
import {
  User,
  Globe,
  Bell,
  Camera,
  Lock,
  Calendar,
  Wallet,
  Clock,
  Plus,
  Trash2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import RegionSelector from './RegionSelector';
import ChangePasswordModal from './ChangePasswordModal';
import CalendarSettings from './CalendarSettings';
import DonorPhotoPreferencesSection from './DonorDashboard/DonorPhotoPreferencesSection';
import { AuthContext } from '../contexts/AuthContext';
import {
  notificationPreferencesAPI,
  profileAPI,
  pickupPreferencesAPI,
} from '../services/api';
import api from '../services/api';
import { inferRegionFromAddress } from '../services/timezoneService';
import '../style/Settings.css';

/**
 * Reusable Settings page component for all dashboards (Donor, Receiver, Admin)
 */
const Settings = () => {
  const { userId, organizationName, role } = useContext(AuthContext);
  const { t } = useTranslation();

  // Role-based notification categories - using translation function
  const getNotificationCategories = () => ({
    DONOR: {
      [t('settings.notificationTypes.donor.claimPickup')]: [
        {
          key: 'donationClaimed',
          label: t('settings.notificationTypes.donor.donationClaimed'),
          desc: t('settings.notificationTypes.donor.donationClaimedDesc'),
        },
        {
          key: 'claimCanceled',
          label: t('settings.notificationTypes.donor.claimCanceled'),
          desc: t('settings.notificationTypes.donor.claimCanceledDesc'),
        },
        {
          key: 'pickupReminder',
          label: t('settings.notificationTypes.donor.pickupReminder'),
          desc: t('settings.notificationTypes.donor.pickupReminderDesc'),
        },
        {
          key: 'donationPickedUp',
          label: t('settings.notificationTypes.donor.donationPickedUp'),
          desc: t('settings.notificationTypes.donor.donationPickedUpDesc'),
        },
        {
          key: 'donationExpired',
          label: t('settings.notificationTypes.donor.donationExpired'),
          desc: t('settings.notificationTypes.donor.donationExpiredDesc'),
        },
      ],
      [t('settings.notificationTypes.donor.messaging')]: [
        {
          key: 'newMessageFromReceiver',
          label: t('settings.notificationTypes.donor.newMessageFromReceiver'),
          desc: t(
            'settings.notificationTypes.donor.newMessageFromReceiverDesc'
          ),
        },
      ],
      [t('settings.notificationTypes.donor.feedback')]: [
        {
          key: 'receiverReview',
          label: t('settings.notificationTypes.donor.receiverReview'),
          desc: t('settings.notificationTypes.donor.receiverReviewDesc'),
        },
      ],
      [t('settings.notificationTypes.donor.adminSystem')]: [
        {
          key: 'donationFlagged',
          label: t('settings.notificationTypes.donor.donationFlagged'),
          desc: t('settings.notificationTypes.donor.donationFlaggedDesc'),
        },
        {
          key: 'donationStatusUpdated',
          label: t('settings.notificationTypes.donor.donationStatusUpdated'),
          desc: t('settings.notificationTypes.donor.donationStatusUpdatedDesc'),
        },
        {
          key: 'complianceWarning',
          label: t('settings.notificationTypes.donor.complianceWarning'),
          desc: t('settings.notificationTypes.donor.complianceWarningDesc'),
        },
        {
          key: 'issueResolved',
          label: t('settings.notificationTypes.donor.issueResolved'),
          desc: t('settings.notificationTypes.donor.issueResolvedDesc'),
        },
        {
          key: 'verificationStatusChanged',
          label: t(
            'settings.notificationTypes.donor.verificationStatusChanged'
          ),
          desc: t(
            'settings.notificationTypes.donor.verificationStatusChangedDesc'
          ),
        },
      ],
    },
    RECEIVER: {
      [t('settings.notificationTypes.receiver.matchingClaim')]: [
        {
          key: 'newDonationAvailable',
          label: t('settings.notificationTypes.receiver.newDonationAvailable'),
          desc: t(
            'settings.notificationTypes.receiver.newDonationAvailableDesc'
          ),
        },
        {
          key: 'donationReadyForPickup',
          label: t(
            'settings.notificationTypes.receiver.donationReadyForPickup'
          ),
          desc: t(
            'settings.notificationTypes.receiver.donationReadyForPickupDesc'
          ),
        },
        {
          key: 'pickupReminder',
          label: t('settings.notificationTypes.receiver.pickupReminder'),
          desc: t('settings.notificationTypes.receiver.pickupReminderDesc'),
        },
        {
          key: 'donationCompleted',
          label: t('settings.notificationTypes.receiver.donationCompleted'),
          desc: t('settings.notificationTypes.receiver.donationCompletedDesc'),
        },
      ],
      [t('settings.notificationTypes.receiver.messaging')]: [
        {
          key: 'newMessageFromDonor',
          label: t('settings.notificationTypes.receiver.newMessageFromDonor'),
          desc: t(
            'settings.notificationTypes.receiver.newMessageFromDonorDesc'
          ),
        },
      ],
      [t('settings.notificationTypes.receiver.feedback')]: [
        {
          key: 'donorReview',
          label: t('settings.notificationTypes.receiver.donorReview'),
          desc: t('settings.notificationTypes.receiver.donorReviewDesc'),
        },
      ],
      [t('settings.notificationTypes.receiver.adminSystem')]: [
        {
          key: 'claimFlagged',
          label: t('settings.notificationTypes.receiver.claimFlagged'),
          desc: t('settings.notificationTypes.receiver.claimFlaggedDesc'),
        },
        {
          key: 'donationStatusChanged',
          label: t('settings.notificationTypes.receiver.donationStatusChanged'),
          desc: t(
            'settings.notificationTypes.receiver.donationStatusChangedDesc'
          ),
        },
        {
          key: 'disputeResolved',
          label: t('settings.notificationTypes.receiver.disputeResolved'),
          desc: t('settings.notificationTypes.receiver.disputeResolvedDesc'),
        },
        {
          key: 'verificationStatusChanged',
          label: t(
            'settings.notificationTypes.receiver.verificationStatusChanged'
          ),
          desc: t(
            'settings.notificationTypes.receiver.verificationStatusChangedDesc'
          ),
        },
      ],
    },
    ADMIN: {
      [t('settings.notificationTypes.admin.systemOversight')]: [
        {
          key: 'donationFlagged',
          label: t('settings.notificationTypes.admin.donationFlagged'),
          desc: t('settings.notificationTypes.admin.donationFlaggedDesc'),
        },
        {
          key: 'suspiciousActivity',
          label: t('settings.notificationTypes.admin.suspiciousActivity'),
          desc: t('settings.notificationTypes.admin.suspiciousActivityDesc'),
        },
        {
          key: 'verificationRequest',
          label: t('settings.notificationTypes.admin.verificationRequest'),
          desc: t('settings.notificationTypes.admin.verificationRequestDesc'),
        },
      ],
      [t('settings.notificationTypes.admin.disputeCompliance')]: [
        {
          key: 'newDispute',
          label: t('settings.notificationTypes.admin.newDispute'),
          desc: t('settings.notificationTypes.admin.newDisputeDesc'),
        },
        {
          key: 'escalatedIssue',
          label: t('settings.notificationTypes.admin.escalatedIssue'),
          desc: t('settings.notificationTypes.admin.escalatedIssueDesc'),
        },
        {
          key: 'safetyAlert',
          label: t('settings.notificationTypes.admin.safetyAlert'),
          desc: t('settings.notificationTypes.admin.safetyAlertDesc'),
        },
      ],
      [t('settings.notificationTypes.admin.operational')]: [
        {
          key: 'systemError',
          label: t('settings.notificationTypes.admin.systemError'),
          desc: t('settings.notificationTypes.admin.systemErrorDesc'),
        },
        {
          key: 'highVolumeDonation',
          label: t('settings.notificationTypes.admin.highVolumeDonation'),
          desc: t('settings.notificationTypes.admin.highVolumeDonationDesc'),
        },
      ],
    },
  });

  // Initialize notifications based on role with all enabled by default
  const [notifications, setNotifications] = useState({});

  // Load notifications when role is available
  useEffect(() => {
    if (role && Object.keys(notifications).length === 0) {
      const initialNotifications = {};
      const notificationCats = getNotificationCategories();
      const categories = notificationCats[role] || notificationCats.RECEIVER;

      Object.values(categories)
        .flat()
        .forEach(notification => {
          initialNotifications[notification.key] = true;
        });

      setNotifications(initialNotifications);
    }
  }, [role]);

  // Profile form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    organization: organizationName || '',
    address: '',
  });

  const [profileImage, setProfileImage] = useState(null);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] =
    useState(false);
  const [regionSettings, setRegionSettings] = useState(null);
  const [lastResolvedAddress, setLastResolvedAddress] = useState('');
  const [addressSelectionMeta, setAddressSelectionMeta] = useState({
    city: '',
    country: '',
  });

  // Notification preferences state
  const [notificationPreferences, setNotificationPreferences] = useState({
    emailAlerts: false,
    smsAlerts: false,
    smsPhoneNumber: '',
  });
  const [preferencesMessage, setPreferencesMessage] = useState('');
  const [preferencesError, setPreferencesError] = useState('');

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Pickup preferences state (donor only)
  const [pickupPrefs, setPickupPrefs] = useState({
    availabilityWindowStart: '',
    availabilityWindowEnd: '',
    slots: [],
  });
  const [pickupPrefsMessage, setPickupPrefsMessage] = useState('');
  const [pickupPrefsError, setPickupPrefsError] = useState('');
  const [isPickupPrefsExpanded, setIsPickupPrefsExpanded] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isLanguageRegionExpanded, setIsLanguageRegionExpanded] =
    useState(false);
  const [isNotificationTypesExpanded, setIsNotificationTypesExpanded] =
    useState(false);
  const [isPaymentHistoryExpanded, setIsPaymentHistoryExpanded] =
    useState(false);
  const [isAddressSelected, setIsAddressSelected] = useState(true);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [paymentHistoryLoading, setPaymentHistoryLoading] = useState(false);
  const [paymentHistoryError, setPaymentHistoryError] = useState('');
  const [paymentHistoryLoaded, setPaymentHistoryLoaded] = useState(false);

  const fileInputRef = useRef(null);
  const addressAutocompleteRef = useRef(null);
  const { isLoaded: isMapsLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'],
  });

  useEffect(() => {
    document.body.classList.add('settings-address-open');
    return () => {
      document.body.classList.remove('settings-address-open');
    };
  }, []);

  // Load user profile on component mount
  useEffect(() => {
    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  // Load notification preferences on component mount
  useEffect(() => {
    const fetchNotificationPreferences = async () => {
      try {
        const response = await notificationPreferencesAPI.getPreferences();
        setNotificationPreferences({
          emailAlerts: response.data.emailNotificationsEnabled || false,
          smsAlerts: response.data.smsNotificationsEnabled || false,
          smsPhoneNumber: formData.phoneNumber || '',
        });

        // Load notification types
        if (response.data.notificationTypes) {
          setNotifications(response.data.notificationTypes);
        }
      } catch (error) {
        console.error('Error fetching notification preferences:', error);
      }
    };

    if (userId) {
      fetchNotificationPreferences();
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

  // Auto-clear preferences messages after 3 seconds
  useEffect(() => {
    if (preferencesMessage || preferencesError) {
      const timer = setTimeout(() => {
        setPreferencesMessage('');
        setPreferencesError('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [preferencesMessage, preferencesError]);

  // Load pickup preferences for donors
  useEffect(() => {
    if (userId && role === 'DONOR') {
      pickupPreferencesAPI
        .get()
        .then(res => {
          const data = res.data;
          setPickupPrefs({
            availabilityWindowStart: data.availabilityWindowStart || '',
            availabilityWindowEnd: data.availabilityWindowEnd || '',
            slots:
              data.slots && data.slots.length > 0
                ? data.slots.map(s => ({
                    startTime: s.startTime || '',
                    endTime: s.endTime || '',
                    notes: s.notes || '',
                  }))
                : [],
          });
        })
        .catch(() => {});
    }
  }, [userId, role]);

  // Auto-clear pickup prefs messages after 3 seconds
  useEffect(() => {
    if (pickupPrefsMessage || pickupPrefsError) {
      const timer = setTimeout(() => {
        setPickupPrefsMessage('');
        setPickupPrefsError('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [pickupPrefsMessage, pickupPrefsError]);

  const handlePickupSlotChange = (index, field, value) => {
    setPickupPrefs(prev => {
      const slots = [...prev.slots];
      slots[index] = { ...slots[index], [field]: value };
      return { ...prev, slots };
    });
  };

  const addPickupPrefSlot = () => {
    setPickupPrefs(prev => ({
      ...prev,
      slots: [...prev.slots, { startTime: '', endTime: '', notes: '' }],
    }));
  };

  const removePickupPrefSlot = index => {
    setPickupPrefs(prev => ({
      ...prev,
      slots: prev.slots.filter((_, i) => i !== index),
    }));
  };

  const handleSavePickupPreferences = async () => {
    try {
      const payload = {
        availabilityWindowStart: pickupPrefs.availabilityWindowStart || null,
        availabilityWindowEnd: pickupPrefs.availabilityWindowEnd || null,
        slots: pickupPrefs.slots
          .filter(s => s.startTime && s.endTime)
          .map(s => ({
            startTime: s.startTime,
            endTime: s.endTime,
            notes: s.notes || null,
          })),
      };
      await pickupPreferencesAPI.save(payload);
      setPickupPrefsMessage('Pickup preferences saved successfully.');
    } catch {
      setPickupPrefsError('Failed to save pickup preferences.');
    }
  };

  const fetchUserProfile = async () => {
    try {
      // Fetch user profile data
      const profileResp = await profileAPI.get();
      if (profileResp.data) {
        const p = profileResp.data;
        const profileAddress = p.organizationAddress || p.address || '';
        setFormData(prev => ({
          ...prev,
          fullName: p.fullName || prev.fullName || '',
          email: p.email || prev.email || '',
          phoneNumber: p.phone || p.phoneNumber || prev.phoneNumber || '',
          organization: p.organizationName || prev.organization || '',
          address: profileAddress || prev.address || '',
        }));
        setIsAddressSelected(Boolean(profileAddress));
        setLastResolvedAddress(profileAddress || '');

        if (p.profilePhoto) {
          setProfileImage(p.profilePhoto);
        }

        // Update notification phone if missing
        setNotificationPreferences(prev => ({
          ...prev,
          smsPhoneNumber: p.phone || p.phoneNumber || prev.smsPhoneNumber,
        }));
      }

      // Fetch region settings
      const regionResp = await api.get('/profile/region');
      if (regionResp.data) {
        setRegionSettings({
          country: regionResp.data.country,
          city: regionResp.data.city,
          timezone: regionResp.data.timezone,
        });
      }
    } catch (error) {
      console.error('Error fetching profile from backend:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  // Validation functions
  const validateEmail = email => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhoneNumber = phone => {
    // Accepts various formats: (123) 456-7890, 123-456-7890, 1234567890, +1234567890
    const phoneRegex =
      /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
    return phoneRegex.test(phone);
  };

  const formatPhoneNumber = phone => {
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

    if (formData.address && formData.address.trim() && !isAddressSelected) {
      newErrors.address =
        'Please select a full street address from Google suggestions (with street number).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'address') {
      setIsAddressSelected(false);
    }
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const getAddressComponent = (components = [], type) =>
    components.find(component => component.types?.includes(type));

  const onLoadAddressAutocomplete = autocomplete => {
    addressAutocompleteRef.current = autocomplete;
    autocomplete.setFields([
      'address_components',
      'formatted_address',
      'geometry',
    ]);
    autocomplete.setOptions({ types: ['address'] });
  };

  const handleAddressPlaceChanged = () => {
    try {
      const place = addressAutocompleteRef.current?.getPlace();
      if (!place?.address_components) {
        return;
      }

      const components = place.address_components;
      const streetNumber = getAddressComponent(components, 'street_number');
      const route = getAddressComponent(components, 'route');
      const cityComponent =
        getAddressComponent(components, 'locality') ||
        getAddressComponent(components, 'postal_town') ||
        getAddressComponent(components, 'administrative_area_level_2');
      const countryComponent = getAddressComponent(components, 'country');

      if (!streetNumber || !route) {
        setIsAddressSelected(false);
        setErrors(prev => ({
          ...prev,
          address:
            'Please select a full street address from suggestions (with street number).',
        }));
        return;
      }

      const formattedAddress = place.formatted_address || place.name || '';
      setFormData(prev => ({
        ...prev,
        address: formattedAddress || prev.address,
      }));
      setAddressSelectionMeta({
        city: cityComponent?.long_name || '',
        country: countryComponent?.long_name || '',
      });
      setIsAddressSelected(true);
      setErrors(prev => ({ ...prev, address: '' }));
    } catch (error) {
      console.error('Address autocomplete error:', error);
      setIsAddressSelected(false);
    }
  };

  const handlePasswordChange = e => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleToggle = async key => {
    const newValue = !notifications[key];

    // Update state immediately for responsiveness
    setNotifications(prev => ({ ...prev, [key]: newValue }));

    // Update backend
    try {
      await notificationPreferencesAPI.updatePreferences({
        emailNotificationsEnabled: notificationPreferences.emailAlerts,
        smsNotificationsEnabled: notificationPreferences.smsAlerts,
        notificationTypes: { ...notifications, [key]: newValue },
      });
    } catch (error) {
      console.error('Error updating notification type:', error);
      // Revert on error
      setNotifications(prev => ({ ...prev, [key]: !newValue }));
    }
  };

  const handleRegionChange = async regionData => {
    // Only update if the data has actually changed
    if (JSON.stringify(regionData) !== JSON.stringify(regionSettings)) {
      setRegionSettings(regionData);
      console.log('Region settings updated:', regionData);

      // Save to backend using api service
      try {
        await api.put('/profile/region', {
          country: regionData.countryName || regionData.country,
          city: regionData.city,
          timezone: regionData.timezone, // Send the selected timezone
        });

        console.log('Region saved to backend successfully');
        // Refresh timezone context
        if (window.location.pathname.includes('/messages')) {
          window.location.reload(); // Reload to pick up new timezone
        }
      } catch (error) {
        console.error('Error saving region:', error);
      }
    }
  };

  const handleImageUpload = e => {
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
      // Prepare payload
      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phoneNumber
          ? formatPhoneNumber(formData.phoneNumber)
          : '',
        profilePhoto: profileImage || null,
        organizationName: formData.organization || null,
        organizationAddress: formData.address || null,
      };

      const resp = await profileAPI.update(payload);

      // Update local state with returned data
      if (resp.data) {
        setFormData(prev => ({
          ...prev,
          fullName: resp.data.fullName || prev.fullName,
          email: resp.data.email || prev.email,
          phoneNumber: resp.data.phone || prev.phoneNumber,
          organization: resp.data.organizationName || prev.organization,
          address: resp.data.organizationAddress || prev.address,
        }));

        if (resp.data.profilePhoto) {
          setProfileImage(resp.data.profilePhoto);
        }

        try {
          localStorage.setItem(
            'organizationName',
            resp.data.organizationName || ''
          );
        } catch (e) {
          /* ignore storage errors */
        }

        // Update notification phone for SMS toggles
        setNotificationPreferences(prev => ({
          ...prev,
          smsPhoneNumber: resp.data.phone || prev.smsPhoneNumber,
        }));

        const currentAddress = (formData.address || '').trim();
        const previousAddress = (lastResolvedAddress || '').trim();
        const shouldResolveRegion =
          currentAddress.length > 0 &&
          currentAddress !== previousAddress &&
          isAddressSelected;

        if (shouldResolveRegion) {
          try {
            const inferredRegion = await inferRegionFromAddress(currentAddress);
            const resolvedCity =
              inferredRegion?.city || addressSelectionMeta.city || '';
            const resolvedCountry =
              inferredRegion?.country || addressSelectionMeta.country || '';

            if (resolvedCity && resolvedCountry) {
              const regionPayload = {
                country: resolvedCountry,
                city: resolvedCity,
              };

              // If timezone came from precise address lookup, pass it.
              // Otherwise let backend resolve from city/country defaults.
              if (
                inferredRegion?.source === 'google' &&
                inferredRegion?.timezone
              ) {
                regionPayload.timezone = inferredRegion.timezone;
              }

              const regionResp = await api.put(
                '/profile/region',
                regionPayload
              );
              setRegionSettings({
                country: regionResp?.data?.country || resolvedCountry,
                city: regionResp?.data?.city || resolvedCity,
                timezone:
                  regionResp?.data?.timezone ||
                  inferredRegion?.timezone ||
                  regionSettings?.timezone ||
                  'UTC',
              });
            }
          } catch (regionError) {
            console.error(
              'Error inferring region/timezone from address:',
              regionError
            );
          }
        }

        setLastResolvedAddress(currentAddress);

        setSuccessMessage(t('settings.account.profileUpdated'));
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        setErrors({ submit: error.response.data.message });
      } else {
        setErrors({ submit: t('settings.account.updateFailed') });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAlertsToggle = async () => {
    const newValue = !notificationPreferences.emailAlerts;
    setNotificationPreferences(prev => ({
      ...prev,
      emailAlerts: newValue,
    }));

    // Show toast notification like language switcher
    const toast = document.createElement('div');
    toast.className = 'language-toast';
    toast.textContent = t(
      newValue
        ? 'settings.notificationPreferences.emailEnabled'
        : 'settings.notificationPreferences.emailDisabled'
    );
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);

    // Update backend
    try {
      await notificationPreferencesAPI.updatePreferences({
        emailNotificationsEnabled: newValue,
        smsNotificationsEnabled: notificationPreferences.smsAlerts,
      });
    } catch (error) {
      console.error('Error updating email alerts:', error);
      // Revert on error
      setNotificationPreferences(prev => ({
        ...prev,
        emailAlerts: !newValue,
      }));
      setPreferencesError(t('settings.notificationPreferences.updateFailed'));
    }
  };

  const handleSmsAlertsToggle = async () => {
    const newValue = !notificationPreferences.smsAlerts;
    setNotificationPreferences(prev => ({
      ...prev,
      smsAlerts: newValue,
    }));

    // Show toast notification like language switcher
    const toast = document.createElement('div');
    toast.className = 'language-toast';
    toast.textContent = t(
      newValue
        ? 'settings.notificationPreferences.smsEnabled'
        : 'settings.notificationPreferences.smsDisabled'
    );
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);

    // Update backend
    try {
      await notificationPreferencesAPI.updatePreferences({
        emailNotificationsEnabled: notificationPreferences.emailAlerts,
        smsNotificationsEnabled: newValue,
      });
    } catch (error) {
      console.error('Error updating SMS alerts:', error);
      // Revert on error
      setNotificationPreferences(prev => ({
        ...prev,
        smsAlerts: !newValue,
      }));
      setPreferencesError(t('settings.notificationPreferences.updateFailed'));
    }
  };

  const formatPaymentAmount = payment => {
    const amount = Number(payment?.amount || 0);
    const currency = String(payment?.currency || 'USD').toUpperCase();

    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency,
      }).format(amount);
    } catch (error) {
      return `${currency} ${amount.toFixed(2)}`;
    }
  };

  const formatPaymentDate = value => {
    if (!value) {
      return t('settings.paymentHistory.notAvailable');
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return t('settings.paymentHistory.notAvailable');
    }

    return date.toLocaleString();
  };

  const formatPaymentStatus = status => {
    if (!status) {
      return t('settings.paymentHistory.unknownStatus');
    }

    return status
      .toString()
      .toLowerCase()
      .split('_')
      .map(token => token.charAt(0).toUpperCase() + token.slice(1))
      .join(' ');
  };

  const fetchPaymentHistory = async () => {
    setPaymentHistoryLoading(true);
    setPaymentHistoryError('');

    try {
      const response = await api.get('/payments/history', {
        params: {
          page: 0,
          size: 10,
        },
      });
      setPaymentHistory(response.data?.content || []);
      setPaymentHistoryLoaded(true);
    } catch (error) {
      console.error('Error fetching payment history:', error);
      setPaymentHistoryError(t('settings.paymentHistory.loadError'));
    } finally {
      setPaymentHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (
      isPaymentHistoryExpanded &&
      role !== 'ADMIN' &&
      userId &&
      !paymentHistoryLoaded
    ) {
      fetchPaymentHistory();
    }
  }, [isPaymentHistoryExpanded, role, userId, paymentHistoryLoaded]);

  return (
    <div className="settings-container">
      <div className="settings-content">
        {/* Success Message */}
        {successMessage && (
          <div className="success-message">{successMessage}</div>
        )}

        {/* Error Message */}
        {errors.submit && <div className="error-message">{errors.submit}</div>}

        {/* Account Section */}
        <div className="settings-section">
          <div className="section-header-with-icon">
            <div className="icon-circle">
              <User size={24} />
            </div>
            <div className="section-title-group">
              <h2>{t('settings.account.title')}</h2>
              <p className="section-description">
                {t('settings.account.description')}
              </p>
            </div>
          </div>
          <div className="section-content">
            {loadingProfile ? (
              <div className="loading-spinner">
                {t('settings.account.loadingProfile')}
              </div>
            ) : (
              <>
                {/* Profile Image Upload */}
                <div className="profile-image-section">
                  <div className="profile-image-container">
                    <div className="profile-image-wrapper">
                      {profileImage ? (
                        <img
                          src={profileImage}
                          alt="Profile"
                          className="profile-image"
                        />
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
                      <h3>{t('settings.account.profilePhoto')}</h3>
                      <p>{t('settings.account.profilePhotoDesc')}</p>
                      {errors.profileImage && (
                        <span className="field-error">
                          {errors.profileImage}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="account-form-grid">
                  <div className="form-field">
                    <label className="field-label">
                      {t('settings.account.fullName')} *
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      className={`field-input ${errors.fullName ? 'error' : ''}`}
                      placeholder={t('settings.account.fullNamePlaceholder')}
                      value={formData.fullName}
                      onChange={handleInputChange}
                    />
                    {errors.fullName && (
                      <span className="field-error">{errors.fullName}</span>
                    )}
                  </div>
                  <div className="form-field">
                    <label className="field-label">
                      {t('settings.account.emailAddress')} *
                    </label>
                    <input
                      type="email"
                      name="email"
                      className={`field-input ${errors.email ? 'error' : ''}`}
                      placeholder={t('settings.account.emailPlaceholder')}
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                    {errors.email && (
                      <span className="field-error">{errors.email}</span>
                    )}
                  </div>
                  <div className="form-field">
                    <label className="field-label">
                      {t('settings.account.organization')}
                    </label>
                    <input
                      type="text"
                      name="organization"
                      className="field-input"
                      placeholder={t(
                        'settings.account.organizationPlaceholder'
                      )}
                      value={formData.organization}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-field">
                    <label className="field-label">
                      {t('settings.account.phoneNumber')}
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      className={`field-input ${errors.phoneNumber ? 'error' : ''}`}
                      placeholder={t('settings.account.phonePlaceholder')}
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                    />
                    {errors.phoneNumber && (
                      <span className="field-error">{errors.phoneNumber}</span>
                    )}
                  </div>
                  <div className="form-field form-field-full">
                    <label className="field-label">
                      {t('settings.account.address')}
                    </label>
                    {isMapsLoaded ? (
                      <div className="settings-address-autocomplete-wrap">
                        <Autocomplete
                          onLoad={onLoadAddressAutocomplete}
                          onPlaceChanged={handleAddressPlaceChanged}
                          options={{ types: ['address'] }}
                        >
                          <input
                            type="text"
                            name="address"
                            className={`field-input ${errors.address ? 'error' : ''}`}
                            placeholder={t(
                              'settings.account.addressPlaceholder'
                            )}
                            value={formData.address}
                            onChange={handleInputChange}
                            autoComplete="off"
                          />
                        </Autocomplete>
                      </div>
                    ) : (
                      <input
                        type="text"
                        name="address"
                        className={`field-input ${errors.address ? 'error' : ''}`}
                        placeholder={t('settings.account.addressPlaceholder')}
                        value={formData.address}
                        onChange={handleInputChange}
                      />
                    )}
                    {!errors.address &&
                      formData.address?.trim() &&
                      !isAddressSelected && (
                        <span className="field-hint">
                          Select the full address from Google suggestions.
                        </span>
                      )}
                    {errors.address && (
                      <span className="field-error">{errors.address}</span>
                    )}
                  </div>
                </div>

                {/* Password Section */}
                <div className="password-section">
                  <button
                    className="password-toggle-btn"
                    onClick={() => setIsChangePasswordModalOpen(true)}
                    type="button"
                  >
                    <Lock size={18} />
                    <span>{t('settings.account.changePassword')}</span>
                  </button>
                </div>

                <button
                  className="save-changes-btn"
                  onClick={handleSaveChanges}
                  disabled={loading}
                >
                  {loading
                    ? t('settings.account.saving')
                    : t('settings.account.saveChanges')}
                </button>
              </>
            )}
          </div>
        </div>

        <div className={role === 'DONOR' ? 'settings-donor-setup' : undefined}>
          {role === 'DONOR' && (
            <div
              className="settings-section donor-setup-overview"
              data-tour="donor-settings-setup"
            >
              <div className="donor-setup-overview__eyebrow">Donor setup</div>
              <h2 className="donor-setup-overview__title">
                Finish setting up your account
              </h2>
              <p className="donor-setup-overview__text">
                Review Language &amp; Region, Calendar Integration, and Display
                Preferences to personalize how FoodFlow works for you.
              </p>
            </div>
          )}

          {/* Language & Region Section */}
          <div className="settings-section language-region-section">
            <div className="section-header-with-icon">
              <div className="icon-circle">
                <Globe size={24} />
              </div>
              <div className="section-title-group">
                <h2>{t('settings.languageRegion.title')}</h2>
                <p className="section-description">
                  {t('settings.languageRegion.description')}
                </p>
                <p className="language-region-summary">
                  {(regionSettings?.city && regionSettings?.country
                    ? `${regionSettings.city}, ${regionSettings.country}`
                    : t('settings.languageRegion.locationTimezone')) || ''}
                </p>
              </div>
              <div className="settings-header-actions">
                <button
                  type="button"
                  className="settings-toggle-btn"
                  onClick={() => setIsLanguageRegionExpanded(prev => !prev)}
                  aria-expanded={isLanguageRegionExpanded}
                  aria-label="Toggle language and region settings"
                >
                  {isLanguageRegionExpanded ? 'Hide ▲' : 'Edit ▼'}
                </button>
              </div>
            </div>
            {isLanguageRegionExpanded && (
              <div className="section-content language-region-content-wrap">
                <div className="language-region-container">
                  <div className="subsection-header">
                    <h3 className="subsection-title">
                      {t('settings.languageRegion.languagePreference')}
                    </h3>
                    <p className="subsection-description">
                      {t('settings.languageRegion.languageDesc')}
                    </p>
                  </div>
                  <LanguageSwitcher />
                </div>

                <div className="region-settings-divider"></div>

                <div className="language-region-container">
                  <div className="subsection-header">
                    <h3 className="subsection-title">
                      {t('settings.languageRegion.locationTimezone')}
                    </h3>
                    <p className="subsection-description">
                      {t('settings.languageRegion.locationDesc')}
                    </p>
                  </div>
                  <RegionSelector
                    value={regionSettings}
                    onChange={handleRegionChange}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Calendar Integration Section */}
          <CalendarSettings />

          {role === 'DONOR' && <DonorPhotoPreferencesSection />}
        </div>

        {/* Notification Preferences Section */}
        <div className="settings-section">
          <div className="section-header-with-icon">
            <div className="icon-circle">
              <Bell size={24} />
            </div>
            <div className="section-title-group">
              <h2>{t('settings.notificationPreferences.title')}</h2>
              <p className="section-description">
                {t('settings.notificationPreferences.description')}
              </p>
            </div>
          </div>
          <div className="section-content">
            {preferencesMessage && (
              <div className="success-banner">{preferencesMessage}</div>
            )}
            {preferencesError && (
              <div className="error-banner">{preferencesError}</div>
            )}

            <div className="notification-preferences">
              {/* Email Alerts Toggle */}
              <div className="preference-item">
                <div className="preference-info">
                  <h4>{t('settings.notificationPreferences.emailAlerts')}</h4>
                  <p>
                    {t('settings.notificationPreferences.emailAlertsDesc')}{' '}
                    {formData.email ||
                      t('settings.notificationPreferences.emailAlertsDescAlt')}
                  </p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={notificationPreferences.emailAlerts}
                    onChange={handleEmailAlertsToggle}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              {/* SMS Alerts Toggle */}
              <div className="preference-item">
                <div className="preference-info">
                  <h4>{t('settings.notificationPreferences.smsAlerts')}</h4>
                  <p>
                    {t('settings.notificationPreferences.smsAlertsDesc')}
                    {formData.phoneNumber
                      ? ` ${t('settings.notificationPreferences.smsAlertsDescAt')} ${formData.phoneNumber}`
                      : ''}
                  </p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={notificationPreferences.smsAlerts}
                    onChange={handleSmsAlertsToggle}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Pickup Preferences Section - Donor only */}
        {role === 'DONOR' && (
          <div className="settings-section">
            <div className="section-header-with-icon">
              <div className="icon-circle">
                <Clock size={24} />
              </div>
              <div className="section-title-group">
                <h2>Pickup Preferences</h2>
                <p className="section-description">
                  Save recurring pickup time slots so they are pre-filled when
                  you create a new donation.
                </p>
              </div>
              <div className="settings-header-actions">
                <button
                  type="button"
                  className="settings-toggle-btn"
                  onClick={() => setIsPickupPrefsExpanded(prev => !prev)}
                  aria-expanded={isPickupPrefsExpanded}
                  aria-label="Toggle pickup preferences"
                >
                  {isPickupPrefsExpanded ? 'Hide ▲' : 'Edit ▼'}
                </button>
              </div>
            </div>

            {isPickupPrefsExpanded && (
              <div className="section-content">
                {/* Availability Window */}
                <div
                  className="preference-item"
                  style={{
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                  }}
                >
                  <div className="preference-info">
                    <h4>Default Availability Window</h4>
                    <p>
                      Set the broad time range during which you are generally
                      available for pickups.
                    </p>
                  </div>
                  <div
                    style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}
                  >
                    <div>
                      <label
                        className="input-label"
                        style={{ display: 'block', marginBottom: '0.25rem' }}
                      >
                        From
                      </label>
                      <input
                        type="time"
                        className="form-input"
                        value={pickupPrefs.availabilityWindowStart}
                        onChange={e =>
                          setPickupPrefs(prev => ({
                            ...prev,
                            availabilityWindowStart: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label
                        className="input-label"
                        style={{ display: 'block', marginBottom: '0.25rem' }}
                      >
                        To
                      </label>
                      <input
                        type="time"
                        className="form-input"
                        value={pickupPrefs.availabilityWindowEnd}
                        onChange={e =>
                          setPickupPrefs(prev => ({
                            ...prev,
                            availabilityWindowEnd: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Recurring Time Slots */}
                <div style={{ marginTop: '1.25rem' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <div className="preference-info">
                      <h4>Recurring Pickup Time Slots</h4>
                      <p>
                        These times will be pre-filled when you create a new
                        donation.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="btn-add-slot"
                      onClick={addPickupPrefSlot}
                    >
                      <Plus size={16} /> Add Slot
                    </button>
                  </div>

                  {pickupPrefs.slots.length === 0 && (
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>
                      No recurring slots saved yet.
                    </p>
                  )}

                  {pickupPrefs.slots.map((slot, index) => (
                    <div
                      key={index}
                      className="pickup-slot-card"
                      style={{ marginBottom: '0.75rem' }}
                    >
                      <div className="slot-header">
                        <span className="slot-number">Slot {index + 1}</span>
                        <button
                          type="button"
                          className="btn-remove-slot"
                          onClick={() => removePickupPrefSlot(index)}
                          aria-label="Remove slot"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          gap: '1rem',
                          flexWrap: 'wrap',
                          marginTop: '0.5rem',
                        }}
                      >
                        <div>
                          <label
                            className="input-label"
                            style={{
                              display: 'block',
                              marginBottom: '0.25rem',
                            }}
                          >
                            Start Time
                          </label>
                          <input
                            type="time"
                            className="form-input"
                            value={slot.startTime}
                            onChange={e =>
                              handlePickupSlotChange(
                                index,
                                'startTime',
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <div>
                          <label
                            className="input-label"
                            style={{
                              display: 'block',
                              marginBottom: '0.25rem',
                            }}
                          >
                            End Time
                          </label>
                          <input
                            type="time"
                            className="form-input"
                            value={slot.endTime}
                            onChange={e =>
                              handlePickupSlotChange(
                                index,
                                'endTime',
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: '150px' }}>
                          <label
                            className="input-label"
                            style={{
                              display: 'block',
                              marginBottom: '0.25rem',
                            }}
                          >
                            Notes (optional)
                          </label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="e.g. Weekday mornings"
                            value={slot.notes}
                            onChange={e =>
                              handlePickupSlotChange(
                                index,
                                'notes',
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {pickupPrefsMessage && (
                  <p
                    className="success-message"
                    style={{ marginTop: '0.75rem' }}
                  >
                    {pickupPrefsMessage}
                  </p>
                )}
                {pickupPrefsError && (
                  <p className="error-message" style={{ marginTop: '0.75rem' }}>
                    {pickupPrefsError}
                  </p>
                )}

                <button
                  type="button"
                  className="save-changes-btn"
                  style={{ marginTop: '1rem' }}
                  onClick={handleSavePickupPreferences}
                >
                  Save Pickup Preferences
                </button>
              </div>
            )}
          </div>
        )}

        {/* Privacy & Data Consent Section */}
        <div className="settings-section">
          <div className="section-header-with-icon">
            <div className="icon-circle">
              <User size={24} />
            </div>
            <div className="section-title-group">
              <h2>{t('settings.privacyConsent.title')}</h2>
              <p className="section-description">
                {t('settings.privacyConsent.description')}
              </p>
            </div>
          </div>
          <div className="section-content">
            <div className="privacy-consent-info">
              <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>
                {t('settings.privacyConsent.consentMessage')}
              </p>
              <p style={{ lineHeight: '1.6' }}>
                {t('settings.privacyConsent.detailsPrefix')}{' '}
                <a
                  href="/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#609B7E',
                    textDecoration: 'underline',
                    fontWeight: '500',
                  }}
                >
                  {t('settings.privacyConsent.privacyPolicyLink')}
                </a>
                {t('settings.privacyConsent.detailsSuffix')}
              </p>
            </div>
          </div>
        </div>

        {role !== 'ADMIN' && (
          <div className="settings-section">
            <div className="section-header-with-icon">
              <div className="icon-circle">
                <Wallet size={24} />
              </div>
              <div className="section-title-group">
                <h2>{t('settings.paymentHistory.title')}</h2>
                <p className="section-description">
                  {t('settings.paymentHistory.description')}
                </p>
              </div>
              <div className="settings-header-actions">
                <button
                  type="button"
                  className="settings-toggle-btn"
                  onClick={() => setIsPaymentHistoryExpanded(prev => !prev)}
                  aria-expanded={isPaymentHistoryExpanded}
                  aria-label={t('settings.paymentHistory.toggleAriaLabel')}
                >
                  {isPaymentHistoryExpanded
                    ? t('settings.paymentHistory.hideButton')
                    : t('settings.paymentHistory.viewButton')}
                </button>
              </div>
            </div>

            {isPaymentHistoryExpanded && (
              <div className="section-content language-region-content-wrap">
                {paymentHistoryLoading && (
                  <div className="loading-spinner">
                    {t('settings.paymentHistory.loading')}
                  </div>
                )}

                {!paymentHistoryLoading && paymentHistoryError && (
                  <div className="error-message payment-history-error-wrap">
                    {paymentHistoryError}
                  </div>
                )}

                {!paymentHistoryLoading && !paymentHistoryError && (
                  <>
                    {paymentHistory.length === 0 ? (
                      <p className="payment-history-empty">
                        {t('settings.paymentHistory.empty')}
                      </p>
                    ) : (
                      <div
                        className="payment-history-list"
                        aria-label={t('settings.paymentHistory.listAriaLabel')}
                      >
                        {paymentHistory.map(payment => (
                          <div
                            key={payment.id}
                            className="payment-history-item"
                          >
                            <div className="payment-history-main">
                              <div className="payment-history-amount">
                                {formatPaymentAmount(payment)}
                              </div>
                              <div className="payment-history-description">
                                {payment.description ||
                                  t(
                                    'settings.paymentHistory.defaultDescription'
                                  )}
                              </div>
                            </div>
                            <div className="payment-history-meta">
                              <span className="payment-history-status">
                                {formatPaymentStatus(payment.status)}
                              </span>
                              <span className="payment-history-type">
                                {formatPaymentStatus(payment.paymentType)}
                              </span>
                              <span className="payment-history-date">
                                {formatPaymentDate(payment.createdAt)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="payment-history-actions">
                      <button
                        type="button"
                        className="settings-toggle-btn"
                        onClick={fetchPaymentHistory}
                        disabled={paymentHistoryLoading}
                      >
                        {t('settings.paymentHistory.refreshButton')}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Notifications Section */}
        <div className="settings-section">
          <div className="section-header-with-icon">
            <div className="icon-circle">
              <Bell size={24} />
            </div>
            <div className="section-title-group">
              <h2>{t('settings.notificationTypes.title')}</h2>
              <p className="section-description">
                {t('settings.notificationTypes.description')}
              </p>
              <p className="language-region-summary">
                {Object.values(notifications || {}).filter(Boolean).length}{' '}
                active
              </p>
            </div>
            <div className="settings-header-actions">
              <button
                type="button"
                className="settings-toggle-btn"
                onClick={() => setIsNotificationTypesExpanded(prev => !prev)}
                aria-expanded={isNotificationTypesExpanded}
                aria-label="Toggle notification types"
              >
                {isNotificationTypesExpanded ? 'Hide ▲' : 'Edit ▼'}
              </button>
            </div>
          </div>
          {isNotificationTypesExpanded && (
            <div className="section-content language-region-content-wrap">
              {Object.entries(
                getNotificationCategories()[role] ||
                  getNotificationCategories().RECEIVER
              ).map(([categoryName, categoryItems]) => (
                <div key={categoryName} className="notification-category">
                  <h3 className="notification-category-title">
                    {categoryName}
                  </h3>
                  <div className="notification-list">
                    {categoryItems.map(notification => (
                      <div key={notification.key} className="notification-item">
                        <div className="notification-info">
                          <h4 className="notification-title">
                            {notification.label}
                          </h4>
                          <p className="notification-desc">
                            {notification.desc}
                          </p>
                        </div>
                        <label className="toggle-switch">
                          <input
                            type="checkbox"
                            checked={notifications[notification.key] || false}
                            onChange={() => handleToggle(notification.key)}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
      />
    </div>
  );
};

export default Settings;
