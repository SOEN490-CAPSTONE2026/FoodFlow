import axios from 'axios';
import { getFoodTypeValue } from '../constants/foodConstants';
import { emitUnauthorized } from './authEvents';
import { getNavigationLocation, navigateTo } from './navigation';

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  config => {
    const token =
      localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

api.interceptors.response.use(
  response => {
    // Add rate limit info to response if available
    if (response.headers['x-ratelimit-limit']) {
      response.data.rateLimitInfo = {
        limit: parseInt(response.headers['x-ratelimit-limit']),
        remaining: parseInt(response.headers['x-ratelimit-remaining']),
        retryAfter: response.headers['retry-after']
          ? parseInt(response.headers['retry-after'])
          : null,
      };
    }
    return response;
  },
  error => {
    // Handle rate limiting errors
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'] || 60;
      error.rateLimited = true;
      error.retryAfter = retryAfter;
    }

    if (error.response && error.response.status === 401) {
      const authKeys = [
        'jwtToken',
        'userRole',
        'userId',
        'organizationName',
        'organizationVerificationStatus',
        'accountStatus',
      ];
      authKeys.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });

      emitUnauthorized();

      const location = getNavigationLocation();
      const currentPath = location?.pathname || window.location.pathname;
      if (currentPath !== '/login') {
        navigateTo('/login', {
          replace: true,
          state: {
            from: location || {
              pathname: currentPath,
              search: window.location.search,
              hash: window.location.hash,
            },
          },
        });
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async data => {
    const response = await api.post('/auth/login', data);
    if (response.data.token) {
      localStorage.setItem('jwtToken', response.data.token);
    }
    return response;
  },
  registerDonor: data => {
    // If data is FormData, set appropriate headers
    const config =
      data instanceof FormData
        ? {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        : {};
    return api.post('/auth/register/donor', data, config);
  },
  registerReceiver: data => {
    // If data is FormData, set appropriate headers
    const config =
      data instanceof FormData
        ? {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        : {};
    return api.post('/auth/register/receiver', data, config);
  },
  logout: () => {
    localStorage.removeItem('jwtToken');
    return api.post('/auth/logout');
  },
  forgotPassword: data => api.post('/auth/forgot-password', data),
  verifyResetCode: data => api.post('/auth/verify-reset-code', data),
  resetPassword: data => api.post('/auth/reset-password', data),
  checkEmailExists: email =>
    api.get('/auth/check-email', { params: { email } }),
  checkPhoneExists: phone =>
    api.get('/auth/check-phone', { params: { phone } }),
  changePassword: data => api.post('/auth/change-password', data),
  verifyEmail: token =>
    api.post('/auth/verify-email', null, { params: { token } }),
  resendVerificationEmail: () => api.post('/auth/resend-verification-email'),
};

export const surplusAPI = {
  list: () => api.get('/surplus'), // Just /surplus, not /api/surplus
  getMyPosts: () => api.get('/surplus/my-posts'),
  getPost: id => api.get(`/surplus/${id}`),
  create: data => api.post('/surplus', data),
  update: (id, data) => api.put(`/surplus/${id}`, data),
  // claim now accepts an optional `slot` parameter. If `slot` has an `id` we send `pickupSlotId`,
  // otherwise we include the slot object as `pickupSlot` so the backend can interpret it.
  deletePost: id => api.delete(`/surplus/${id}/delete`),
  claim: (postId, slot) => {
    const payload = { surplusPostId: postId };
    if (slot) {
      if (slot.id) {
        payload.pickupSlotId = slot.id;
      } else {
        payload.pickupSlot = slot;
      }
    }
    return api.post('/claims', payload);
  },
  completeSurplusPost: (id, otpCode) =>
    api.patch(`/surplus/${id}/complete`, { otpCode }),

  confirmPickup: (postId, otpCode) =>
    api.post('/surplus/pickup/confirm', { postId, otpCode }),

  /**
   * Search surplus posts with filters.
   * @param {Object} filters - Filter criteria
   * @param {string[]} filters.foodCategories - Array of food category enums (e.g., ['FRUITS_VEGETABLES', 'DAIRY_COLD'])
   * @param {string} filters.expiryBefore - ISO date string (YYYY-MM-DD)
   * @param {Object} filters.userLocation - User's location for distance filtering
   * @param {number} filters.userLocation.latitude - Latitude
   * @param {number} filters.userLocation.longitude - Longitude
   * @param {string} filters.userLocation.address - Address (optional)
   * @param {number} filters.maxDistanceKm - Maximum distance in kilometers
   * @param {string} filters.status - Post status (default: 'AVAILABLE')
   * @returns {Promise} API response with filtered surplus posts
   */
  search: filters => {
    const filterRequest = {};

    // Only add fields if they have actual values
    if (filters.foodType && filters.foodType.length > 0) {
      filterRequest.foodCategories = filters.foodType.map(
        mapFrontendCategoryToBackend
      );
    }

    if (filters.expiryBefore) {
      filterRequest.expiryBefore = filters.expiryBefore;
    }

    if (filters.locationCoords && filters.distance) {
      filterRequest.userLocation = {
        latitude: parseFloat(filters.locationCoords.lat),
        longitude: parseFloat(filters.locationCoords.lng),
        address: filters.locationCoords.address || filters.location,
      };
      filterRequest.maxDistanceKm = parseFloat(filters.distance);
    }

    // Always include status
    filterRequest.status = 'AVAILABLE';

    return api.post('/surplus/search', filterRequest);
  },

  /**
   * Simple search using query parameters (alternative endpoint).
   * Useful for basic filtering without location.
   */
  searchBasic: filters => {
    const params = new URLSearchParams();

    if (filters.foodType && filters.foodType.length > 0) {
      filters.foodType.forEach(category => {
        params.append('foodCategories', mapFrontendCategoryToBackend(category));
      });
    }

    if (filters.expiryBefore) {
      params.append('expiryBefore', filters.expiryBefore);
    }

    params.append('status', 'AVAILABLE');

    return api.get(`/surplus/search?${params.toString()}`);
  },

  /**
   * Get timeline events for a donation post
   * @param {number} postId - Surplus post ID
   * @returns {Promise} API response with timeline events
   */
  getTimeline: postId => api.get(`/surplus/${postId}/timeline`),

  /**
   * Upload pickup evidence photo for a donation
   * @param {number} postId - Surplus post ID
   * @param {File} file - The image file to upload
   * @returns {Promise} API response with uploaded file URL
   */
  uploadEvidence: (postId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/surplus/${postId}/evidence`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export const claimsAPI = {
  myClaims: () => api.get('/claims/my-claims'),
  claim: postId => api.post('/claims', { surplusPostId: postId }),
  cancel: claimId => api.delete(`/claims/${claimId}`),
  getClaimForSurplusPost: postId => api.get(`/claims/post/${postId}`),
};

export const conversationAPI = {
  expressInterest: postId => api.post(`/conversations/interested/${postId}`),
  getConversations: () => api.get('/conversations'),
  getConversation: convId => api.get(`/conversations/${convId}`),
  getMessages: convId => api.get(`/conversations/${convId}/messages`),
  markAsRead: convId => api.put(`/conversations/${convId}/read`),
};

/**
 * Recommendation API functions
 */
export const recommendationAPI = {
  /**
   * Get recommendation data for multiple posts (for browse page)
   * @param {Array<number>} postIds - Array of post IDs to get recommendations for
   * @returns {Promise<Object>} - Object mapping post IDs to recommendation data
   */
  getBrowseRecommendations: async postIds => {
    try {
      if (!postIds || postIds.length === 0) {
        return {};
      }

      const response = await api.get('/recommendations/browse', {
        params: {
          postIds: postIds.join(','),
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching browse recommendations:', error);
      return {};
    }
  },

  /**
   * Get recommendation for a single post
   * @param {number} postId - Post ID
   * @returns {Promise<Object>} - Recommendation data
   */
  getRecommendationForPost: async postId => {
    try {
      const response = await api.get(`/recommendations/post/${postId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching post recommendation:', error);
      return null;
    }
  },

  /**
   * Get top recommended posts above threshold
   * @param {number} minScore - Minimum recommendation score (default: 50)
   * @returns {Promise<Array>} - Array of highly recommended posts
   */
  getTopRecommendations: async (postIds, minScore = 50) => {
    try {
      if (!postIds || postIds.length === 0) {
        return {};
      }

      const response = await api.get('/recommendations/top', {
        params: { postIds: postIds.join(','), minScore },
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching top recommendations:', error);
      return [];
    }
  },
};

export const userAPI = {
  /**
   * Get user profile by ID
   * @param {string} userId - User ID
   * @returns {Promise} User data
   */
  getProfile: userId => api.get(`/users/${userId}`),

  /**
   * Update user profile
   * @param {FormData} userData - User data including optional profile image
   * @returns {Promise} Updated user data
   */
  updateProfile: userData =>
    api.put('/users/update', userData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  /**
   * Update user password
   * @param {Object} passwordData - Current and new password
   * @returns {Promise} Response
   */
  updatePassword: passwordData =>
    api.put('/users/update-password', passwordData),
};

/**
 * Current authenticated user's profile endpoints
 */
export const profileAPI = {
  get: () => api.get('/profile'),
  update: data => api.put('/profile', data),
};

/**
 * Report/Dispute API functions
 */
export const reportAPI = {
  /**
   * Create a new report/dispute
   * @param {Object} reportData - Report data
   * @param {number} reportData.reportedUserId - User ID being reported
   * @param {number} reportData.donationId - Optional donation ID
   * @param {string} reportData.description - Report description
   * @param {string} reportData.photoEvidenceUrl - Optional evidence image URL
   * @returns {Promise} Created report data
   */
  createReport: reportData => {
    // Transform frontend field names to backend field names
    const backendRequest = {
      reportedId: reportData.reportedUserId,
      donationId: reportData.donationId,
      description: reportData.description,
      imageUrl: reportData.photoEvidenceUrl,
    };
    return api.post('/reports', backendRequest);
  },
};

/**
 * Feedback API functions
 */
export const feedbackAPI = {
  submitFeedback: payload => api.post('/feedback', payload),
  getFeedbackForClaim: claimId => api.get(`/feedback/claim/${claimId}`),
  getMyRating: () => api.get('/feedback/my-rating'),
  getUserRating: userId => api.get(`/feedback/rating/${userId}`),
  canProvideFeedback: claimId => api.get(`/feedback/can-review/${claimId}`),
  getPendingFeedback: () => api.get('/feedback/pending'),
  getMyReviews: () => api.get('/feedback/my-reviews'),
};

/**
 * Admin API functions for dispute management
 */
export const adminDisputeAPI = {
  /**
   * Get all disputes with filtering and pagination
   * @param {Object} filters - Filter criteria
   * @param {string} filters.status - Filter by dispute status (OPEN, UNDER_REVIEW, RESOLVED, CLOSED)
   * @param {number} filters.page - Page number (default: 0)
   * @param {number} filters.size - Page size (default: 20)
   * @returns {Promise} Paginated dispute list
   */
  getAllDisputes: (filters = {}) => {
    const params = new URLSearchParams();

    if (filters.status) {
      params.append('status', filters.status);
    }
    params.append('page', filters.page || 0);
    params.append('size', filters.size || 20);

    return api.get(`/admin/disputes?${params.toString()}`);
  },

  /**
   * Get detailed information about a specific dispute
   * @param {number} disputeId - Dispute ID
   * @returns {Promise} Dispute details with admin notes
   */
  getDisputeById: disputeId => api.get(`/admin/disputes/${disputeId}`),

  /**
   * Update dispute status
   * @param {number} disputeId - Dispute ID
   * @param {string} status - New status (OPEN, UNDER_REVIEW, RESOLVED, CLOSED)
   * @param {string} adminNotes - Optional admin notes
   * @returns {Promise} Updated dispute data
   */
  updateDisputeStatus: (disputeId, status, adminNotes) =>
    api.put(`/admin/disputes/${disputeId}/status`, {
      status,
      adminNotes,
    }),
};

/**
 * Admin API functions for donation management
 */
export const adminDonationAPI = {
  /**
   * Get all donations with filtering and pagination
   * @param {Object} filters - Filter criteria
   * @param {string} filters.status - Filter by donation status
   * @param {number} filters.donorId - Filter by donor user ID
   * @param {number} filters.receiverId - Filter by receiver user ID
   * @param {boolean} filters.flagged - Filter by flagged status
   * @param {string} filters.fromDate - Filter by creation date from (YYYY-MM-DD)
   * @param {string} filters.toDate - Filter by creation date to (YYYY-MM-DD)
   * @param {string} filters.search - Search term
   * @param {number} filters.page - Page number (default: 0)
   * @param {number} filters.size - Page size (default: 20)
   * @returns {Promise} Paginated donation list
   */
  getAllDonations: (filters = {}) => {
    const params = new URLSearchParams();

    if (filters.status) {
      params.append('status', filters.status);
    }
    if (filters.donorId) {
      params.append('donorId', filters.donorId);
    }
    if (filters.receiverId) {
      params.append('receiverId', filters.receiverId);
    }
    if (filters.flagged !== undefined) {
      params.append('flagged', filters.flagged);
    }
    if (filters.fromDate) {
      params.append('fromDate', filters.fromDate);
    }
    if (filters.toDate) {
      params.append('toDate', filters.toDate);
    }
    if (filters.search) {
      params.append('search', filters.search);
    }

    params.append('page', filters.page || 0);
    params.append('size', filters.size || 20);

    return api.get(`/admin/donations?${params.toString()}`);
  },

  /**
   * Get detailed information about a specific donation
   * @param {number} donationId - Donation ID
   * @returns {Promise} Donation details with full timeline
   */
  getDonationById: donationId => api.get(`/admin/donations/${donationId}`),

  /**
   * Override donation status manually
   * @param {number} donationId - Donation ID
   * @param {string} newStatus - New status value
   * @param {string} reason - Reason for override
   * @returns {Promise} Updated donation data
   */
  overrideStatus: (donationId, newStatus, reason) =>
    api.post(`/admin/donations/${donationId}/override-status`, {
      newStatus,
      reason,
    }),
};

/**
 * Admin API functions for user verification queue management
 */
export const adminVerificationAPI = {
  /**
   * Get all pending users awaiting admin approval
   * @param {Object} filters - Filter criteria
   * @param {string} filters.userType - Filter by user type (DONOR, RECEIVER)
   * @param {string} filters.search - Search by organization name or email
   * @param {string} filters.sortBy - Sort field (date, userType, waitingTime)
   * @param {string} filters.sortOrder - Sort order (asc, desc)
   * @param {number} filters.page - Page number (default: 0)
   * @param {number} filters.size - Page size (default: 20)
   * @returns {Promise} Paginated pending users list
   */
  getPendingUsers: (filters = {}) => {
    const params = new URLSearchParams();

    if (filters.userType) {
      params.append('userType', filters.userType);
    }
    if (filters.search) {
      params.append('search', filters.search);
    }
    if (filters.sortBy) {
      params.append('sortBy', filters.sortBy);
    }
    if (filters.sortOrder) {
      params.append('sortOrder', filters.sortOrder);
    }

    params.append('page', filters.page || 0);
    params.append('size', filters.size || 20);

    return api.get(`/admin/pending-users?${params.toString()}`);
  },

  /**
   * Approve a pending user registration
   * @param {number} userId - User ID to approve
   * @returns {Promise} Updated user data
   */
  approveUser: userId => api.post(`/admin/approve/${userId}`),

  /**
   * Manually verify a user's email
   * @param {number} userId - User ID to mark email verified
   * @returns {Promise} Response data
   */
  verifyEmail: userId => api.post(`/admin/verify-email/${userId}`),

  /**
   * Reject a pending user registration
   * @param {number} userId - User ID to reject
   * @param {string} reason - Rejection reason
   * @param {string} message - Optional custom message
   * @returns {Promise} Response data
   */
  rejectUser: (userId, reason, message) =>
    api.post(`/admin/reject/${userId}`, {
      reason,
      message,
    }),
};

/**
 * Maps frontend food categories to backend enum values.
 * @param {string} frontendCategory - Frontend category name
 * @returns {string} Backend enum value
 */
function mapFrontendCategoryToBackend(frontendCategory) {
  return getFoodTypeValue(frontendCategory);
}

// Notification Preferences API
export const notificationPreferencesAPI = {
  getPreferences: () => api.get('/user/notifications/preferences'),
  updatePreferences: data => api.put('/user/notifications/preferences', data),
};

// Gamification API
export const gamificationAPI = {
  /**
   * Get gamification stats for a user (points, achievements, progress)
   * @param {number} userId - User ID
   * @returns {Promise} Gamification stats including points and achievements
   */
  getUserStats: userId => api.get(`/gamification/users/${userId}/stats`),

  /**
   * Get all available achievements
   * @returns {Promise} List of all achievements
   */
  getAllAchievements: () => api.get('/gamification/achievements'),

  /**
   * Get leaderboard for a specific role
   * @param {string} role - User role (DONOR or RECEIVER)
   * @returns {Promise} Leaderboard with top 10 users and current user's position
   */
  getLeaderboard: role => api.get(`/gamification/leaderboard/${role}`),
};

// Support chat API for rate limiting integration
export const supportChatAPI = {
  sendMessage: (message, pageContext) => {
    return api.post('/support/chat', {
      message,
      pageContext,
    });
  },
};

// Rate limit monitoring API
export const rateLimitAPI = {
  getStats: () => {
    return api.get('/admin/rate-limit-stats');
  },

  getUserStatus: () => {
    return api.get('/admin/my-rate-limit');
  },
};

// Impact Dashboard API
export const impactDashboardAPI = {
  /**
   * Get impact metrics for current user based on their role
   * @param {string} dateRange - Date range filter: 'WEEKLY', 'MONTHLY', 'ALL_TIME'
   * @returns {Promise} Impact metrics including food weight, meals, CO2, water saved
   */
  getMetrics: (dateRange = 'ALL_TIME') =>
    api.get('/impact-dashboard/metrics', {
      params: { dateRange },
    }),

  /**
   * Export impact metrics as CSV
   * @param {string} dateRange - Date range filter: 'WEEKLY', 'MONTHLY', 'ALL_TIME'
   * @returns {Promise} CSV file download
   */
  exportMetrics: (dateRange = 'ALL_TIME') =>
    api.get('/impact-dashboard/export', {
      params: { dateRange },
      responseType: 'blob',
    }),
};
// Export the core axios instance for backward compatibility
// Safely bind methods with fallbacks for testing
export const post =
  api && typeof api.post === 'function'
    ? api.post.bind(api)
    : () => Promise.resolve();
export const get =
  api && typeof api.get === 'function'
    ? api.get.bind(api)
    : () => Promise.resolve();
export const put =
  api && typeof api.put === 'function'
    ? api.put.bind(api)
    : () => Promise.resolve();
export const del =
  api && typeof api.delete === 'function'
    ? api.delete.bind(api)
    : () => Promise.resolve();
export const patch =
  api && typeof api.patch === 'function'
    ? api.patch.bind(api)
    : () => Promise.resolve();

export default api;
