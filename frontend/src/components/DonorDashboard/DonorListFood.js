import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Edit3,
  Trash2,
  AlertTriangle,
  X,
  Package,
  ChevronDown,
  Filter,
  Camera,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Upload,
  Sparkles,
  MoreHorizontal,
  MessageCircle,
  KeyRound,
  CheckCircle2,
  Star,
} from 'lucide-react';
import { useLoadScript } from '@react-google-maps/api';
import {
  surplusAPI,
  claimsAPI,
  reportAPI,
  conversationAPI,
} from '../../services/api';
import SurplusFormModal from '../DonorDashboard/SurplusFormModal';
import ConfirmPickupModal from '../DonorDashboard/ConfirmPickupModal';
import ClaimedSuccessModal from '../DonorDashboard/ClaimedSuccessModal';
import RescheduleModal from '../DonorDashboard/RescheduleModal';
import ReportUserModal from '../ReportUserModal';
import FeedbackModal from '../FeedbackModal/FeedbackModal';
import DonationTimeline from '../shared/DonationTimeline';
import {
  getDietaryTagLabel,
  getFoodTypeLabel,
  getUnitLabel,
  getTemperatureCategoryLabel,
  getTemperatureCategoryIcon,
  getPackagingTypeLabel,
  getPrimaryFoodCategory,
  foodTypeImages,
  mapLegacyCategoryToFoodType,
} from '../../constants/foodConstants';
import {
  formatPickupWindowFromParts,
  formatWallClockDate,
  formatWallClockTime,
  parseBackendUtcTimestamp,
  parseExplicitUtcTimestamp,
} from '../../utils/timezoneUtils';
import { useOnboarding } from '../../contexts/OnboardingContext';
import '../DonorDashboard/Donor_Styles/DonorListFood.css';

// Define libraries for Google Maps
const libraries = ['places'];

function statusClass(status) {
  switch (status) {
    case 'AVAILABLE':
      return 'badge badge--available';
    case 'READY_FOR_PICKUP':
      return 'badge badge--ready';
    case 'CLAIMED':
      return 'badge badge--claimed';
    case 'NOT_COMPLETED':
      return 'badge badge--not-completed';
    case 'COMPLETED':
      return 'badge badge--completed';
    case 'EXPIRED':
      return 'badge badge--expired';
    default:
      return 'badge';
  }
}

function addressLabel(full) {
  if (!full) {
    return '';
  }
  const parts = String(full)
    .split(',')
    .map(s => s.trim());
  if (parts.length <= 2) {
    return full;
  }
  return `${parts[0]}, ${parts[1]}…`;
}

function formatExpiryDate(dateString, locale, notSpecifiedLabel) {
  if (!dateString) {
    return notSpecifiedLabel;
  }
  try {
    const formatted = formatWallClockDate(
      String(dateString),
      locale || 'en-US'
    );
    return formatted || notSpecifiedLabel;
  } catch {
    return notSpecifiedLabel;
  }
}

function normalizeStatus(status) {
  if (!status) {
    return '';
  }
  return String(status).toUpperCase().replace(/\s+/g, '_');
}

function isExpired(dateString) {
  if (!dateString) {
    return false;
  }
  const [year, month, day] = dateString.split('-').map(Number);
  if (!year || !month || !day) {
    return false;
  }
  const expiryDate = new Date(year, month - 1, day);
  expiryDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return expiryDate < today;
}

// Format the pickup time range
function formatPickupTime(
  pickupDate,
  pickupFrom,
  pickupTo,
  locale,
  flexibleLabel
) {
  if (!pickupDate) {
    return flexibleLabel;
  }

  try {
    const [year, month, day] = String(pickupDate).split('-').map(Number);
    const pickupDayLabel =
      year && month && day
        ? new Date(Date.UTC(year, month - 1, day, 12, 0, 0)).toLocaleDateString(
            locale || 'en-US',
            { month: 'short', day: 'numeric', timeZone: 'UTC' }
          )
        : '';

    if (pickupFrom && pickupTo) {
      const fromLabel = formatWallClockTime(
        String(pickupFrom),
        locale || 'en-US'
      );
      const toLabel = formatWallClockTime(String(pickupTo), locale || 'en-US');
      if (!fromLabel || !toLabel) {
        return flexibleLabel;
      }
      return pickupDayLabel
        ? `${pickupDayLabel}, ${fromLabel} — ${toLabel}`
        : formatPickupWindowFromParts(
            String(pickupDate),
            String(pickupFrom),
            String(pickupTo),
            locale || 'en-US'
          ) || flexibleLabel;
    }

    return pickupDayLabel || flexibleLabel;
  } catch (error) {
    console.error('Error formatting pickup time:', error);
    return flexibleLabel;
  }
}

function parseStableSortDate(createdAt, pickupDate) {
  const created =
    parseExplicitUtcTimestamp(createdAt) || parseBackendUtcTimestamp(createdAt);
  if (created) {
    return created;
  }

  if (typeof pickupDate === 'string') {
    const [year, month, day] = pickupDate.split('-').map(Number);
    if (year && month && day) {
      return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    }
  }

  return new Date(0);
}

// Get the backend base URL (without /api suffix) for file serving
const API_URL =
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';
const BACKEND_BASE_URL = API_URL.endsWith('/api')
  ? API_URL.slice(0, -4)
  : API_URL.replace(/\/api$/, '');

/**
 * Constructs the full URL for an evidence image
 * Handles both new format (/api/files/...) and legacy format (/uploads/...)
 */
const getEvidenceImageUrl = url => {
  if (!url) {
    return null;
  }

  // If it's already a full URL, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Handle legacy URLs that start with /uploads/ (convert to /api/files/uploads/)
  if (url.startsWith('/uploads/')) {
    const filename = url.substring('/uploads/'.length);
    const fullUrl = `${BACKEND_BASE_URL}/api/files/uploads/${filename}`;
    console.log('Legacy URL converted:', { original: url, full: fullUrl });
    return fullUrl;
  }

  // Handle proper /api/files/ URLs
  if (url.startsWith('/api/files/')) {
    const fullUrl = `${BACKEND_BASE_URL}${url}`;
    console.log('Evidence URL constructed:', { original: url, full: fullUrl });
    return fullUrl;
  }

  // Fallback: assume it's a relative path and prepend backend base + /api/files
  const fullUrl = `${BACKEND_BASE_URL}/api/files${url.startsWith('/') ? '' : '/'}${url}`;
  console.log('Evidence URL fallback:', { original: url, full: fullUrl });
  return fullUrl;
};

export default function DonorListFood() {
  const { t, i18n } = useTranslation();
  const { isDonorTutorialActive, currentDonorTutorialStep } = useOnboarding();
  const locale = i18n.resolvedLanguage || i18n.language || 'en-US';
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: libraries,
  });
  const [items, setItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPickupModalOpen, setIsPickupModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [rescheduleItem, setRescheduleItem] = useState(null);
  const [editPostId, setEditPostId] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('date'); // "date" or "status"
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [openActionMenuId, setOpenActionMenuId] = useState(null);

  // Report and Feedback modal states
  const [showReportModal, setShowReportModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [reportTargetUser, setReportTargetUser] = useState(null);
  const [feedbackTargetUser, setFeedbackTargetUser] = useState(null);
  const [feedbackClaimId, setFeedbackClaimId] = useState(null);
  const [completedDonationId, setCompletedDonationId] = useState(null);
  const navigate = useNavigate();

  // Photo upload states
  const [donationPhotos, setDonationPhotos] = useState({}); // { donationId: [photo urls] }
  const [viewingPhotos, setViewingPhotos] = useState({}); // { donationId: true/false }
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState({}); // { donationId: index }
  const [uploadingPhotos, setUploadingPhotos] = useState({}); // { donationId: true/false }
  const [uploadError, setUploadError] = useState({}); // { donationId: error message }
  const [focusedDonationId, setFocusedDonationId] = useState(null);

  // Timeline states
  const [expandedTimeline, setExpandedTimeline] = useState({}); // { donationId: true/false }
  const [timelines, setTimelines] = useState({}); // { donationId: [timeline events] }
  const [loadingTimelines, setLoadingTimelines] = useState({}); // { donationId: true/false }
  const showTutorialPickupDemo =
    isDonorTutorialActive && currentDonorTutorialStep === 'pickup-progress';

  useEffect(() => {
    fetchMyPosts();
  }, []);
  const location = useLocation();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = event => {
      if (
        isSortDropdownOpen &&
        !event.target.closest('.sort-dropdown-container')
      ) {
        setIsSortDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSortDropdownOpen]);

  useEffect(() => {
    const handleClickOutside = event => {
      if (
        openActionMenuId !== null &&
        !event.target.closest('.card-actions-menu-wrap')
      ) {
        setOpenActionMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openActionMenuId]);

  const fetchMyPosts = async () => {
    try {
      setLoading(true);
      const response = await surplusAPI.getMyPosts();
      // Sort by newest first (default)
      const sortedData = sortPosts(response.data, sortBy);
      setItems(sortedData);
      setError(null);
      setLoading(false); // Show donations immediately

      // Pre-fetch timelines to load evidence photos for donations that might have them
      // This runs in the background after donations are displayed
      const donationsWithPossiblePhotos = sortedData.filter(item =>
        ['CLAIMED', 'READY_FOR_PICKUP', 'COMPLETED'].includes(item.status)
      );

      // Load evidence photos for each donation (in parallel, in background)
      Promise.all(
        donationsWithPossiblePhotos.map(item => loadEvidencePhotos(item.id))
      ).catch(err => console.error('Error loading evidence photos:', err));
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        t('donorListFood.failedToFetch');
      setError(`Error: ${errorMessage}`);
      setLoading(false);
    }
  };

  const triggerPhotoUpload = donationId => {
    if (!isDonationCompleted(donationId)) {
      setUploadError(prev => ({
        ...prev,
        [donationId]: t(
          'donorListFood.uploadAllowedOnlyCompleted',
          'Evidence photos can only be uploaded for completed donations.'
        ),
      }));
      return;
    }
    if (uploadingPhotos[donationId]) {
      return;
    }
    const input = document.getElementById(`photo-upload-input-${donationId}`);
    if (input) {
      input.click();
    }
  };

  // Load evidence photos for a donation from its timeline
  const loadEvidencePhotos = async donationId => {
    try {
      const response = await surplusAPI.getTimeline(donationId);
      const timelineData = response.data;

      // Store timeline data
      setTimelines(prev => ({
        ...prev,
        [donationId]: timelineData,
      }));

      // Extract evidence photos from timeline events (deduplicated)
      const evidencePhotos = [
        ...new Set(
          timelineData
            .filter(event => event.pickupEvidenceUrl)
            .map(event => event.pickupEvidenceUrl)
        ),
      ];

      console.log(
        `Loaded ${evidencePhotos.length} evidence photos for donation ${donationId}:`,
        evidencePhotos
      );

      if (evidencePhotos.length > 0) {
        setDonationPhotos(prev => ({
          ...prev,
          [donationId]: evidencePhotos,
        }));
        setCurrentPhotoIndex(prev => ({
          ...prev,
          [donationId]: 0,
        }));
      }
    } catch (error) {
      console.error(
        'Error loading evidence photos for donation',
        donationId,
        ':',
        error
      );
    }
  };

  const getClaimedReceiverForPost = async item => {
    try {
      setError(null);
      const { data: claims } = await claimsAPI.getClaimForSurplusPost(item.id);

      if (!claims || claims.length === 0) {
        setError(
          t('donorListFood.failedFetchRecipientEmail', { title: item.title })
        );
        return null;
      }

      const activeClaim = claims[0];
      if (!activeClaim.receiverId) {
        setError(t('donorListFood.receiverIdMissing', { title: item.title }));
        return null;
      }

      return {
        id: activeClaim.receiverId,
        email: activeClaim.receiverEmail,
      };
    } catch (err) {
      console.error('Error fetching receiver details:', err);

      if (err.response?.status === 400) {
        setError(t('donorListFood.receiverNotFoundOrInvalidEmail'));
      } else {
        setError(t('donorListFood.failedFetchReceiverDetails'));
      }

      return null;
    }
  };

  const getDonationImageUrl = imageUrl => {
    if (!imageUrl) {
      return null;
    }
    if (
      imageUrl.startsWith('http://') ||
      imageUrl.startsWith('https://') ||
      imageUrl.startsWith('data:')
    ) {
      return imageUrl;
    }
    if (imageUrl.startsWith('/api/files/')) {
      return `${BACKEND_BASE_URL}${imageUrl}`;
    }
    return `${BACKEND_BASE_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  };

  const contactReceiver = async item => {
    const receiver = await getClaimedReceiverForPost(item);
    if (!receiver) {
      return;
    }

    try {
      const response = await conversationAPI.createOrGetPostConversation(
        item.id,
        receiver.id
      );
      navigate(`/donor/messages?conversationId=${response.data.id}`);
    } catch (err) {
      console.error('Error opening donation conversation:', err);
      setError(t('donorListFood.failedOpenDonationChat'));
    }
  };

  const handleOpenFeedback = async item => {
    try {
      console.log('Opening feedback modal for item:', item);

      // Get claim details to find the receiver - returns an array
      const { data: claims } = await claimsAPI.getClaimForSurplusPost(item.id);
      console.log('Claims data:', claims);

      if (claims && claims.length > 0) {
        const claim = claims[0];
        if (claim.receiverId) {
          const targetUser = {
            id: claim.receiverId,
            email: claim.receiverEmail,
          };
          console.log('Setting feedback target user:', targetUser);
          setFeedbackTargetUser(targetUser);
          setFeedbackClaimId(claim.id);
          setShowFeedbackModal(true);
          console.log('Feedback modal state set to true');
        } else {
          console.log('No receiver ID found in claim');
          alert(t('donorListFood.unableLoadReceiverInfo'));
        }
      } else {
        console.log('No claims found for this post');
        alert(t('donorListFood.noClaimsFoundForDonation'));
      }
    } catch (error) {
      console.error('Error fetching claim details for feedback:', error);
      alert(t('donorListFood.failedOpenFeedbackModal'));
    }
  };

  // Sort posts based on creation date or status
  const sortPosts = (posts, sortOrder) => {
    if (!Array.isArray(posts)) {
      return [];
    }

    return [...posts].sort((a, b) => {
      if (sortOrder === 'date') {
        // Sort by date - newest first
        const dateA = parseStableSortDate(a.createdAt, a.pickupDate);
        const dateB = parseStableSortDate(b.createdAt, b.pickupDate);
        return dateB - dateA;
      } else if (sortOrder === 'status') {
        // Sort by status priority
        const statusOrder = {
          AVAILABLE: 1,
          CLAIMED: 2,
          READY_FOR_PICKUP: 3,
          COMPLETED: 4,
          NOT_COMPLETED: 5,
          EXPIRED: 6,
        };
        const statusA = statusOrder[a.status] || 999;
        const statusB = statusOrder[b.status] || 999;
        return statusA - statusB;
      }
      return 0;
    });
  };

  // Update sort order and re-sort items
  const handleSortChange = newSortOrder => {
    setSortBy(newSortOrder);
    setItems(prevItems => sortPosts(prevItems, newSortOrder));
    setIsSortDropdownOpen(false);
  };

  async function requestDelete(id) {
    console.log('DELETE CLICKED for ID =', id);
    const confirmDelete = window.confirm(t('donorListFood.confirmDelete'));
    if (!confirmDelete) {
      return;
    }

    try {
      await surplusAPI.deletePost(id);
      setItems(prev => prev.filter(item => item.id !== id));

      alert(t('donorListFood.postDeletedSuccess'));
    } catch (err) {
      alert(err.response?.data?.message || t('donorListFood.postDeleteFailed'));
    }
  }

  function openEdit(item) {
    setEditPostId(item.id);
    setIsEditMode(true);
    setIsModalOpen(true);
  }

  const handleModalClose = async () => {
    setIsModalOpen(false);
    setIsEditMode(false);
    setEditPostId(null);
    // Small delay to ensure backend has processed the changes
    await new Promise(resolve => setTimeout(resolve, 300));
    fetchMyPosts();
  };

  const handleOpenPickupModal = item => {
    setSelectedItem(item);
    setIsPickupModalOpen(true);
  };

  const handleClosePickupModal = () => {
    setIsPickupModalOpen(false);
    setSelectedItem(null);
  };

  const handlePickupSuccess = async confirmedDonationId => {
    const donationId = confirmedDonationId || selectedItem?.id;

    setIsSuccessModalOpen(true);
    // Refresh the posts list to show updated status.
    await fetchMyPosts();

    if (donationId != null) {
      // Invalidate cached timeline so next open fetches fresh events.
      setTimelines(prev => {
        const next = { ...prev };
        delete next[donationId];
        return next;
      });

      // If timeline is currently visible, fetch immediately so user sees COMPLETED state.
      if (expandedTimeline[donationId]) {
        await fetchTimeline(donationId);
      }
    }
  };

  const handleCloseSuccessModal = () => {
    setIsSuccessModalOpen(false);
  };

  const handleOpenRescheduleModal = item => {
    setRescheduleItem(item);
    setIsRescheduleModalOpen(true);
  };

  const handleCloseRescheduleModal = () => {
    setIsRescheduleModalOpen(false);
    setRescheduleItem(null);
  };

  const handleRescheduleSuccess = async () => {
    await fetchMyPosts();
    handleCloseRescheduleModal();
  };

  const handleOpenReport = async item => {
    try {
      const { data: claims } = await claimsAPI.getClaimForSurplusPost(item.id);

      if (claims && claims.length > 0) {
        const claim = claims[0];
        if (claim.receiverId) {
          setReportTargetUser({
            id: claim.receiverId,
            name: claim.receiverName || claim.receiverEmail,
            email: claim.receiverEmail,
          });
          setCompletedDonationId(item.id);
          setShowReportModal(true);
        } else {
          alert(t('donorListFood.unableLoadReceiverInfo'));
        }
      } else {
        alert(t('donorListFood.noClaimsFoundForDonation'));
      }
    } catch (error) {
      console.error('Error fetching claim details for report:', error);
      alert(t('donorListFood.failedOpenReportModal'));
    }
  };

  const handleReportSubmit = async reportData => {
    try {
      await reportAPI.createReport(reportData);
      alert(t('donorListFood.reportSubmittedSuccessfully'));
      setShowReportModal(false);
      setReportTargetUser(null);
      setCompletedDonationId(null);
    } catch (err) {
      console.error('Failed to submit report', err);
      alert(t('donorListFood.failedSubmitReport'));
    }
  };

  useEffect(() => {
    const targetId = location.state?.focusDonationId;
    if (!targetId || !items.length) {
      return;
    }

    const targetCard = document.getElementById(`donation-card-${targetId}`);
    if (!targetCard) {
      return;
    }

    setFocusedDonationId(Number(targetId));
    targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const clearHighlightTimer = setTimeout(() => {
      setFocusedDonationId(null);
    }, 2200);

    // Clear focus state so it does not retrigger on every rerender.
    navigate(location.pathname, { replace: true, state: {} });

    return () => clearTimeout(clearHighlightTimer);
  }, [items, location.pathname, location.state, navigate]);

  const isDonationCompleted = donationId => {
    const donation = items.find(item => String(item.id) === String(donationId));
    return normalizeStatus(donation?.status) === 'COMPLETED';
  };

  // Photo upload handlers
  const handlePhotoUpload = async (donationId, event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) {
      return;
    }

    if (!isDonationCompleted(donationId)) {
      setUploadError(prev => ({
        ...prev,
        [donationId]: t(
          'donorListFood.uploadAllowedOnlyCompleted',
          'Evidence photos can only be uploaded for completed donations.'
        ),
      }));
      return;
    }

    // Clear any previous error
    setUploadError(prev => ({ ...prev, [donationId]: null }));
    setUploadingPhotos(prev => ({ ...prev, [donationId]: true }));

    try {
      // Upload each file to the backend
      const uploadedUrls = [];
      for (const file of files) {
        // Validate file type
        if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
          throw new Error(t('donorListFood.onlyJpegPngAllowed'));
        }
        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(t('donorListFood.fileSizeMustBeLessThan5Mb'));
        }

        const response = await surplusAPI.uploadEvidence(donationId, file);
        if (response.data.success) {
          uploadedUrls.push(response.data.url);
        } else {
          throw new Error(
            response.data.message || t('donorListFood.uploadFailed')
          );
        }
      }

      // Update state with uploaded URLs
      setDonationPhotos(prev => {
        const existingPhotos = prev[donationId] || [];
        // Initialize photo index if first upload
        if (existingPhotos.length === 0) {
          setCurrentPhotoIndex(prevIndex => ({
            ...prevIndex,
            [donationId]: 0,
          }));
        }
        return {
          ...prev,
          [donationId]: [...existingPhotos, ...uploadedUrls],
        };
      });

      // Refresh timeline to show the new evidence event
      if (expandedTimeline[donationId]) {
        await fetchTimeline(donationId);
      }
    } catch (err) {
      console.error('Failed to upload photo:', err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        t('donorListFood.failedUploadPhoto');
      setUploadError(prev => ({ ...prev, [donationId]: errorMessage }));
    } finally {
      setUploadingPhotos(prev => ({ ...prev, [donationId]: false }));
    }
  };

  const toggleViewPhotos = donationId => {
    // Initialize photo index when first viewing
    setCurrentPhotoIndex(prev => {
      if (prev[donationId] === undefined) {
        return { ...prev, [donationId]: 0 };
      }
      return prev;
    });

    setViewingPhotos(prev => ({
      ...prev,
      [donationId]: !prev[donationId],
    }));
  };

  const navigatePhoto = (donationId, direction) => {
    const photos = donationPhotos[donationId] || [];
    if (photos.length === 0) {
      return;
    }

    setCurrentPhotoIndex(prev => {
      const currentIndex = prev[donationId] ?? 0;
      let newIndex;

      if (direction === 'next') {
        newIndex = (currentIndex + 1) % photos.length;
      } else {
        newIndex = currentIndex === 0 ? photos.length - 1 : currentIndex - 1;
      }

      return { ...prev, [donationId]: newIndex };
    });
  };

  // Timeline handlers
  const toggleTimeline = async donationId => {
    const isExpanding = !expandedTimeline[donationId];

    setExpandedTimeline(prev => ({
      ...prev,
      [donationId]: isExpanding,
    }));

    // Fetch timeline data if expanding and not already loaded
    if (isExpanding && !timelines[donationId]) {
      await fetchTimeline(donationId);
    }
  };

  const fetchTimeline = async donationId => {
    setLoadingTimelines(prev => ({ ...prev, [donationId]: true }));

    try {
      const response = await surplusAPI.getTimeline(donationId);
      const timelineData = response.data;

      setTimelines(prev => ({
        ...prev,
        [donationId]: timelineData,
      }));

      // Extract evidence photos from timeline events
      const evidencePhotos = timelineData
        .filter(event => event.pickupEvidenceUrl)
        .map(event => event.pickupEvidenceUrl);

      if (evidencePhotos.length > 0) {
        setDonationPhotos(prev => ({
          ...prev,
          [donationId]: evidencePhotos,
        }));
        setCurrentPhotoIndex(prev => ({
          ...prev,
          [donationId]: 0,
        }));
      }
    } catch (error) {
      console.error(
        'Error fetching timeline for donation',
        donationId,
        ':',
        error
      );
      setTimelines(prev => ({
        ...prev,
        [donationId]: [],
      }));
    } finally {
      setLoadingTimelines(prev => ({ ...prev, [donationId]: false }));
    }
  };

  if (loading && !showTutorialPickupDemo) {
    return (
      <div className="donor-list-wrapper">
        <div className="loading-state">
          <Package className="loading-icon" size={48} />
          <h3>{t('donorListFood.loading')}</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="donor-list-wrapper">
      {error && (
        <div className="error-banner">
          <AlertTriangle className="error-icon" />
          <span>{error}</span>
          <button className="error-close" onClick={() => setError(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      <header className="donor-list-header">
        <div className="header-left">
          <Filter size={20} className="filter-icon" />
          <div className="sort-dropdown-container">
            <button
              className="sort-dropdown-button"
              onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
            >
              <span className="sort-label">
                {sortBy === 'date'
                  ? t('donorListFood.sortByDate')
                  : t('donorListFood.sortByStatus')}
              </span>
              <ChevronDown
                size={18}
                className={`chevron ${isSortDropdownOpen ? 'open' : ''}`}
              />
            </button>

            {isSortDropdownOpen && (
              <div className="sort-dropdown-menu">
                <button
                  className={`sort-option ${sortBy === 'date' ? 'active' : ''}`}
                  onClick={() => handleSortChange('date')}
                >
                  {t('donorListFood.sortByDate')}
                </button>
                <button
                  className={`sort-option ${sortBy === 'status' ? 'active' : ''}`}
                  onClick={() => handleSortChange('status')}
                >
                  {t('donorListFood.sortByStatus')}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="header-actions">
          <button
            className="donor-ai-button"
            onClick={() => navigate('/donor/ai-donation')}
          >
            <Sparkles size={18} />
            {t('donorListFood.createWithAI')}
          </button>
          <button
            className="donor-add-button"
            data-tour="donor-post-donation"
            onClick={() => {
              setIsEditMode(false);
              setEditPostId(null);
              setIsModalOpen(true);
            }}
          >
            + {t('donorListFood.donateMore')}
          </button>
        </div>
        {isLoaded && (
          <SurplusFormModal
            isOpen={isModalOpen}
            onClose={handleModalClose}
            editMode={isEditMode}
            postId={editPostId}
          />
        )}
      </header>

      {items.length === 0 && !showTutorialPickupDemo ? (
        <div className="empty-state">
          <Package className="empty-state-icon" size={64} />
          <h3 className="empty-state-title">
            {t('donorListFood.emptyStateTitle')}
          </h3>
          <p className="empty-state-description">
            {t('donorListFood.emptyStateDescription')}
          </p>
        </div>
      ) : (
        <>
          <section
            className="donor-list-grid"
            aria-label={t('donation.listAriaLabel')}
          >
            {showTutorialPickupDemo && (
              <article
                className="donation-card donation-card--tutorial"
                aria-label="Tutorial pickup flow example"
                data-tour="donor-pickup-flow"
              >
                <div className="donation-header">
                  <h3 className="donation-title">Fresh Sandwich Trays</h3>
                  <span className={statusClass('READY_FOR_PICKUP')}>
                    {t('donorListFood.status.readyForPickup')}
                  </span>
                </div>

                <div className="dietary-tags-row">
                  <span className="donation-tag">Prepared Meals</span>
                  <span className="donation-tag donation-tag--dietary">
                    Vegetarian
                  </span>
                </div>

                <div className="compliance-badges">
                  <span className="compliance-badge temperature">
                    <span className="badge-icon">❄</span>
                    <span className="badge-label">Refrigerated</span>
                  </span>
                  <span className="compliance-badge packaging">
                    <Package size={14} />
                    <span className="badge-label">Sealed trays</span>
                  </span>
                </div>

                <div className="donation-quantity">12 servings</div>

                <ul
                  className="donation-meta"
                  aria-label="tutorial donation details"
                >
                  <li>
                    <Calendar size={16} className="calendar-icon" />
                    <span>{t('donorListFood.expires')}:&nbsp;Tomorrow</span>
                  </li>
                  <li>
                    <Clock size={16} className="time-icon" />
                    <div className="pickup-times-container">
                      <span className="pickup-label">
                        {t('donorListFood.pickup')}:
                      </span>
                      <span className="pickup-time-item">
                        Mar 14, 3:00 PM - 5:00 PM
                      </span>
                    </div>
                  </li>
                  <li>
                    <MapPin size={16} className="locationMap-icon" />
                    <span className="donation-address">
                      123 Community Lane, Toronto
                    </span>
                  </li>
                </ul>

                <p className="donation-notes">
                  Tutorial preview: this example card shows how a claimed
                  donation moves through pickup and completion.
                </p>

                <div className="donation-timeline-section tutorial-flow-section">
                  <div className="tutorial-flow-section__label">
                    Pickup flow
                  </div>
                  <div className="tutorial-current-status">
                    <span className="tutorial-current-status__label">
                      Current status
                    </span>
                    <span className="badge badge--ready">
                      {t('donorListFood.status.readyForPickup')}
                    </span>
                  </div>
                  <div className="tutorial-status-journey">
                    <span className="badge badge--available">
                      {t('donorListFood.status.available')}
                    </span>
                    <span className="badge badge--claimed">
                      {t('donorListFood.status.claimed')}
                    </span>
                    <span className="badge badge--ready">
                      {t('donorListFood.status.readyForPickup')}
                    </span>
                    <span className="badge badge--completed tutorial-status-journey__muted">
                      {t('donorListFood.status.completed')}
                    </span>
                  </div>
                </div>

                <div className="donation-actions">
                  <button className="donation-action-button secondary" disabled>
                    {t('donorListFood.openChat')}
                  </button>
                  <button className="donation-action-button primary" disabled>
                    {t('donorListFood.enterPickupCode')}
                  </button>
                </div>
              </article>
            )}

            {items.map(item => {
              const normalizedStatus = normalizeStatus(item.status);
              const resolvedFoodType =
                item.foodType || item.foodCategories?.[0];
              const normalizedFoodType = resolvedFoodType
                ? mapLegacyCategoryToFoodType(resolvedFoodType)
                : null;
              const dietaryTags = Array.isArray(item.dietaryTags)
                ? item.dietaryTags
                : [];
              const translatedTags = [];

              if (normalizedFoodType) {
                translatedTags.push({
                  label: t(
                    `surplusForm.foodTypeValues.${normalizedFoodType}`,
                    getFoodTypeLabel(resolvedFoodType)
                  ),
                  type: 'food',
                });
              }

              dietaryTags.forEach(tag => {
                translatedTags.push({
                  label: t(
                    `surplusForm.dietaryTagValues.${tag}`,
                    getDietaryTagLabel(tag)
                  ),
                  type: 'dietary',
                });
              });

              if (item.foodCategories && item.foodCategories.length > 0) {
                item.foodCategories.forEach(category => {
                  const categoryValue = category.name || category;
                  const mappedCategory =
                    mapLegacyCategoryToFoodType(categoryValue);
                  translatedTags.push({
                    label: t(
                      `surplusForm.foodTypeValues.${mappedCategory}`,
                      getFoodTypeLabel(categoryValue)
                    ),
                    type: 'food',
                  });
                });
              }

              const uniqueTags = translatedTags.filter(
                (tag, index, self) =>
                  index ===
                  self.findIndex(
                    candidate =>
                      candidate.label === tag.label &&
                      candidate.type === tag.type
                  )
              );

              const normalizedCategories = Array.isArray(item.foodCategories)
                ? item.foodCategories.map(category => category.name || category)
                : resolvedFoodType
                  ? [resolvedFoodType]
                  : [];
              const primaryFoodCategory =
                getPrimaryFoodCategory(normalizedCategories);
              const resolvedDonationImage = getDonationImageUrl(
                item.resolvedDonationImageUrl ||
                  item.donationImageUrl ||
                  item.imageUrl
              );
              const fallbackDonationImage =
                foodTypeImages[primaryFoodCategory] ||
                foodTypeImages['Prepared Meals'];

              const actionItems = [];
              if (item.status === 'AVAILABLE') {
                actionItems.push(
                  {
                    key: 'edit',
                    label: t('donorListFood.edit'),
                    icon: <Edit3 size={14} />,
                    onClick: () => openEdit(item),
                  },
                  {
                    key: 'delete',
                    label: t('donorListFood.delete'),
                    icon: <Trash2 size={14} />,
                    onClick: () => requestDelete(item.id),
                    danger: true,
                  }
                );
              }
              if (item.status === 'NOT_COMPLETED') {
                if (!isExpired(item.expiryDate)) {
                  actionItems.push({
                    key: 'reschedule',
                    label: t('donorListFood.reschedule'),
                    icon: <Clock size={14} />,
                    onClick: () => handleOpenRescheduleModal(item),
                  });
                }
                actionItems.push(
                  {
                    key: 'report',
                    label: t('donorListFood.reportReceiver'),
                    icon: <AlertTriangle size={14} />,
                    onClick: () => handleOpenReport(item),
                    danger: true,
                  },
                  {
                    key: 'feedback',
                    label: t('donorListFood.leaveFeedback'),
                    icon: <Star size={14} />,
                    onClick: () => handleOpenFeedback(item),
                  }
                );
              }
              if (item.status === 'READY_FOR_PICKUP') {
                actionItems.push({
                  key: 'pickupCode',
                  label: t('donorListFood.enterPickupCode'),
                  icon: <KeyRound size={14} />,
                  onClick: () => handleOpenPickupModal(item),
                });
              }

              if (item.status === 'COMPLETED') {
                actionItems.push({
                  key: 'uploadPhoto',
                  label: t('donorListFood.uploadDonationPhoto'),
                  icon: <Upload size={14} />,
                  onClick: () => triggerPhotoUpload(item.id),
                });
              }

              if (item.status === 'COMPLETED') {
                actionItems.push(
                  {
                    key: 'thankYou',
                    label: t('donorListFood.thankYou'),
                    icon: <CheckCircle2 size={14} />,
                    disabled: true,
                  },
                  {
                    key: 'report',
                    label: t('donorListFood.reportReceiver'),
                    icon: <AlertTriangle size={14} />,
                    onClick: () => handleOpenReport(item),
                    danger: true,
                  },
                  {
                    key: 'feedback',
                    label: t('donorListFood.leaveFeedback'),
                    icon: <Star size={14} />,
                    onClick: () => handleOpenFeedback(item),
                  }
                );
              }
              if (item.status === 'CLAIMED') {
                actionItems.push({
                  key: 'chat',
                  label: t('donorListFood.openChat'),
                  icon: <MessageCircle size={14} />,
                  onClick: () => contactReceiver(item),
                });
              }

              return (
                <article
                  key={item.id}
                  id={`donation-card-${item.id}`}
                  className={`donation-card ${
                    focusedDonationId === item.id
                      ? 'donation-card--focused'
                      : ''
                  }`}
                  aria-label={item.title}
                >
                  <div className="donation-card-image-wrap">
                    <img
                      src={resolvedDonationImage || fallbackDonationImage}
                      alt={primaryFoodCategory || item.title}
                      className="donation-card-image"
                      onError={e => {
                        e.currentTarget.src = fallbackDonationImage;
                      }}
                    />

                    <span
                      className={`${statusClass(item.status)} donation-status-on-image`}
                    >
                      {normalizedStatus === 'AVAILABLE'
                        ? t('donorListFood.status.available')
                        : normalizedStatus === 'READY_FOR_PICKUP'
                          ? t('donorListFood.status.readyForPickup')
                          : normalizedStatus === 'CLAIMED'
                            ? t('donorListFood.status.claimed')
                            : normalizedStatus === 'NOT_COMPLETED'
                              ? t('donorListFood.status.notCompleted')
                              : normalizedStatus === 'COMPLETED'
                                ? t('donorListFood.status.completed')
                                : normalizedStatus === 'EXPIRED'
                                  ? t('donorListFood.status.expired')
                                  : item.status}
                    </span>

                    {actionItems.length > 0 && (
                      <div className="card-actions-menu-wrap">
                        <button
                          type="button"
                          className="card-actions-menu-trigger"
                          onClick={() =>
                            setOpenActionMenuId(prev =>
                              prev === item.id ? null : item.id
                            )
                          }
                          aria-label="More actions"
                        >
                          <MoreHorizontal size={18} />
                        </button>

                        {openActionMenuId === item.id && (
                          <div className="card-actions-menu" role="menu">
                            {actionItems.map(action => (
                              <button
                                key={`${item.id}-${action.key}`}
                                type="button"
                                role="menuitem"
                                disabled={action.disabled}
                                className={`card-actions-menu-item ${action.danger ? 'danger' : ''}`}
                                onClick={() => {
                                  if (action.disabled || !action.onClick) {
                                    return;
                                  }
                                  setOpenActionMenuId(null);
                                  action.onClick();
                                }}
                              >
                                <span className="card-actions-menu-item-icon">
                                  {action.icon}
                                </span>
                                <span className="card-actions-menu-item-label">
                                  {action.label}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="donation-header">
                    <h3 className="donation-title">{item.title}</h3>
                  </div>

                  {uniqueTags.length > 0 && (
                    <div className="dietary-tags-row">
                      {uniqueTags.map((tag, index) => (
                        <span
                          key={`${item.id}-tag-${index}`}
                          className={`donation-tag ${
                            tag.type === 'dietary'
                              ? 'donation-tag--dietary'
                              : ''
                          }`}
                        >
                          {tag.label}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Food Safety Compliance Info */}
                  {(item.temperatureCategory || item.packagingType) && (
                    <div className="compliance-badges">
                      {item.temperatureCategory && (
                        <span className="compliance-badge temperature">
                          <span className="badge-icon">
                            {getTemperatureCategoryIcon(
                              item.temperatureCategory
                            )}
                          </span>
                          <span className="badge-label">
                            {t(
                              `surplusForm.temperatureCategoryValues.${item.temperatureCategory}`,
                              getTemperatureCategoryLabel(
                                item.temperatureCategory
                              )
                            )}
                          </span>
                        </span>
                      )}
                      {item.packagingType && (
                        <span className="compliance-badge packaging">
                          <Package size={14} />
                          <span className="badge-label">
                            {t(
                              `surplusForm.packagingTypeValues.${item.packagingType}`,
                              getPackagingTypeLabel(item.packagingType)
                            )}
                          </span>
                        </span>
                      )}
                    </div>
                  )}

                  <div className="donation-quantity">
                    {item.quantity.value} {getUnitLabel(item.quantity.unit)}
                  </div>

                  <ul className="donation-meta" aria-label="details">
                    <li>
                      <Calendar size={16} className="calendar-icon" />
                      <span>
                        {t('donorListFood.expires')}:&nbsp;
                        {formatExpiryDate(
                          item.expiryDate,
                          locale,
                          t('donorListFood.notSpecified')
                        )}
                      </span>
                    </li>
                    <li>
                      <Clock size={16} className="time-icon" />
                      <div className="pickup-times-container">
                        <span className="pickup-label">
                          {t('donorListFood.pickup')}:
                        </span>
                        {/* Show only confirmed pickup slot if it exists, otherwise show all slots */}
                        {item.confirmedPickupSlot ? (
                          <span className="pickup-time-item">
                            {formatPickupTime(
                              item.confirmedPickupSlot.pickupDate,
                              item.confirmedPickupSlot.startTime,
                              item.confirmedPickupSlot.endTime,
                              locale,
                              t('donorListFood.flexible')
                            )}
                          </span>
                        ) : item.pickupSlots && item.pickupSlots.length > 0 ? (
                          <>
                            {item.pickupSlots.map((slot, idx) => (
                              <React.Fragment key={idx}>
                                <span className="pickup-time-item">
                                  {formatPickupTime(
                                    slot.pickupDate || slot.date,
                                    slot.startTime || slot.pickupFrom,
                                    slot.endTime || slot.pickupTo,
                                    locale,
                                    t('donorListFood.flexible')
                                  )}
                                </span>
                                {idx < item.pickupSlots.length - 1 && (
                                  <span className="pickup-time-divider">|</span>
                                )}
                              </React.Fragment>
                            ))}
                          </>
                        ) : (
                          <span className="pickup-time-item">
                            {formatPickupTime(
                              item.pickupDate,
                              item.pickupFrom,
                              item.pickupTo,
                              locale,
                              t('donorListFood.flexible')
                            )}
                          </span>
                        )}
                      </div>
                    </li>
                    <li>
                      <MapPin size={16} className="locationMap-icon" />
                      {item.pickupLocation.address ? (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            item.pickupLocation.address
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="donation-address"
                          title={item.pickupLocation.address}
                        >
                          {addressLabel(item.pickupLocation.address)}
                        </a>
                      ) : (
                        <span className="donation-address">
                          {t('donorListFood.addressNotSpecified')}
                        </span>
                      )}
                    </li>
                  </ul>

                  {item.description && (
                    <p className="donation-notes">{item.description}</p>
                  )}

                  {/* Photo Upload/View Section - Upload enabled only when donation is completed */}
                  {(normalizedStatus === 'COMPLETED' ||
                    donationPhotos[item.id]?.length > 0) && (
                    <div className="donation-photos-section">
                      {normalizedStatus === 'COMPLETED' && (
                        <input
                          id={`photo-upload-input-${item.id}`}
                          type="file"
                          multiple
                          accept="image/jpeg,image/png"
                          onChange={e => handlePhotoUpload(item.id, e)}
                          style={{ display: 'none' }}
                          disabled={uploadingPhotos[item.id]}
                        />
                      )}

                      {/* Upload error message */}
                      {uploadError[item.id] && (
                        <div className="photo-upload-error">
                          <AlertTriangle size={14} />
                          <span>{uploadError[item.id]}</span>
                          <button
                            className="dismiss-error"
                            onClick={() =>
                              setUploadError(prev => ({
                                ...prev,
                                [item.id]: null,
                              }))
                            }
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )}

                      {normalizedStatus === 'COMPLETED' &&
                      !viewingPhotos[item.id] ? (
                        // Upload mode
                        <label
                          htmlFor={`photo-upload-input-${item.id}`}
                          className={`photo-upload-button ${uploadingPhotos[item.id] ? 'uploading' : ''}`}
                        >
                          {uploadingPhotos[item.id] ? (
                            <>
                              <span className="upload-spinner"></span>
                              <span>{t('donorListFood.uploading')}</span>
                            </>
                          ) : (
                            <>
                              <Camera size={14} />
                              <span>
                                {donationPhotos[item.id]?.length > 0
                                  ? donationPhotos[item.id].length > 1
                                    ? t('donorListFood.photosUploadedPlural', {
                                        count: donationPhotos[item.id].length,
                                      })
                                    : t(
                                        'donorListFood.photosUploadedSingular',
                                        {
                                          count: donationPhotos[item.id].length,
                                        }
                                      )
                                  : t('donorListFood.uploadDonationPhoto')}
                              </span>
                            </>
                          )}
                        </label>
                      ) : null}

                      {donationPhotos[item.id]?.length > 0 && (
                        <button
                          className="view-photos-button"
                          onClick={() => toggleViewPhotos(item.id)}
                        >
                          <ImageIcon size={14} />
                          {donationPhotos[item.id].length > 1
                            ? t('donorListFood.viewPhotosPlural', {
                                count: donationPhotos[item.id].length,
                              })
                            : t('donorListFood.viewPhotosSingular', {
                                count: donationPhotos[item.id].length,
                              })}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Timeline Section - Show for CLAIMED, READY_FOR_PICKUP, COMPLETED, NOT_COMPLETED */}
                  {(item.status === 'CLAIMED' ||
                    item.status === 'READY_FOR_PICKUP' ||
                    item.status === 'COMPLETED' ||
                    item.status === 'NOT_COMPLETED') && (
                    <div className="donation-timeline-section">
                      <button
                        className="timeline-toggle-button"
                        onClick={() => toggleTimeline(item.id)}
                      >
                        <Clock size={16} />
                        <span>
                          {expandedTimeline[item.id]
                            ? t('donorListFood.hideDonationTimeline')
                            : t('donorListFood.viewDonationTimeline')}
                        </span>
                        <ChevronDown
                          size={16}
                          className={`chevron ${expandedTimeline[item.id] ? 'open' : ''}`}
                        />
                      </button>

                      {expandedTimeline[item.id] && (
                        <div className="timeline-content-wrapper">
                          <DonationTimeline
                            timeline={timelines[item.id] || []}
                            loading={loadingTimelines[item.id]}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        </>
      )}

      <ConfirmPickupModal
        isOpen={isPickupModalOpen}
        onClose={handleClosePickupModal}
        donationItem={selectedItem}
        onSuccess={handlePickupSuccess}
      />

      <ClaimedSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={handleCloseSuccessModal}
      />

      <RescheduleModal
        isOpen={isRescheduleModalOpen}
        onClose={handleCloseRescheduleModal}
        donationItem={rescheduleItem}
        onSuccess={handleRescheduleSuccess}
      />

      {/* Photo Viewer Modal - Outside of cards */}
      {Object.keys(viewingPhotos).map(
        donationId =>
          viewingPhotos[donationId] &&
          donationPhotos[donationId]?.length > 0 && (
            <div
              key={donationId}
              className="photo-modal-overlay"
              onClick={() => toggleViewPhotos(donationId)}
            >
              <div
                className="photo-modal-container"
                onClick={e => e.stopPropagation()}
              >
                <button
                  className="photo-modal-close"
                  onClick={() => toggleViewPhotos(donationId)}
                >
                  <X size={20} />
                </button>

                <div className="photo-modal-main">
                  <button
                    className="photo-nav-btn photo-nav-prev"
                    onClick={e => {
                      e.stopPropagation();
                      navigatePhoto(donationId, 'prev');
                    }}
                    disabled={donationPhotos[donationId].length <= 1}
                  >
                    <ChevronLeft size={24} />
                  </button>

                  <div className="photo-display-wrapper">
                    <img
                      src={getEvidenceImageUrl(
                        donationPhotos[donationId][
                          currentPhotoIndex[donationId] ?? 0
                        ]
                      )}
                      alt={`Photo ${(currentPhotoIndex[donationId] ?? 0) + 1}`}
                      className="photo-display-image"
                      draggable={false}
                      onError={e => {
                        console.error('Image load error. URL:', e.target.src);
                        console.error(
                          'Original URL:',
                          donationPhotos[donationId][
                            currentPhotoIndex[donationId] ?? 0
                          ]
                        );
                      }}
                    />
                  </div>

                  <button
                    className="photo-nav-btn photo-nav-next"
                    onClick={e => {
                      e.stopPropagation();
                      navigatePhoto(donationId, 'next');
                    }}
                    disabled={donationPhotos[donationId].length <= 1}
                  >
                    <ChevronRight size={24} />
                  </button>
                </div>

                <div className="photo-modal-footer">
                  <div className="photo-count">
                    {(currentPhotoIndex[donationId] ?? 0) + 1} /{' '}
                    {donationPhotos[donationId].length}
                  </div>
                  {isDonationCompleted(donationId) && (
                    <label className="photo-add-btn">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={e => handlePhotoUpload(donationId, e)}
                        style={{ display: 'none' }}
                      />
                      <Upload size={16} />
                      Add More
                    </label>
                  )}
                </div>
              </div>
            </div>
          )
      )}

      <FeedbackModal
        claimId={feedbackClaimId}
        targetUser={feedbackTargetUser}
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
      />

      <ReportUserModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        reportedUser={reportTargetUser}
        donationId={completedDonationId}
        onSubmit={handleReportSubmit}
      />
    </div>
  );
}
