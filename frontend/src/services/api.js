import axios from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8080/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("jwtToken") || sessionStorage.getItem("jwtToken");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("jwtToken");
      sessionStorage.removeItem("jwtToken");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (data) => {
    const response = await api.post("/auth/login", data);
    if (response.data.token) {
      localStorage.setItem("jwtToken", response.data.token);
    }
    return response;
  },
  registerDonor: (data) => api.post("/auth/register/donor", data),
  registerReceiver: (data) => api.post("/auth/register/receiver", data),
  logout: () => {
    localStorage.removeItem("jwtToken");
    return api.post("/auth/logout");
  },
};

export const surplusAPI = {
  list: () => api.get("/surplus"), // Just /surplus, not /api/surplus
  myPosts: () => api.get("/surplus/my-posts"),
  getMyPosts: () => api.get("/surplus/my-posts"),
  create: (data) => api.post("/surplus", data),
  // claim now accepts an optional `slot` parameter. If `slot` has an `id` we send `pickupSlotId`,
  // otherwise we include the slot object as `pickupSlot` so the backend can interpret it.
  deletePost: (id) => api.delete(`/surplus/${id}/delete`),
  claim: (postId, slot) => {
    const payload = { surplusPostId: postId };
    if (slot) {
      if (slot.id) payload.pickupSlotId = slot.id;
      else payload.pickupSlot = slot;
    }
    return api.post("/claims", payload);
  },
  completeSurplusPost: (id, otpCode) =>
    api.patch(`/surplus/${id}/complete`, { otpCode }),

  confirmPickup: (postId, otpCode) =>
    api.post("/surplus/pickup/confirm", { postId, otpCode }),

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
  search: (filters) => {
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
    filterRequest.status = "AVAILABLE";

    return api.post("/surplus/search", filterRequest);
  },

  /**
   * Simple search using query parameters (alternative endpoint).
   * Useful for basic filtering without location.
   */
  searchBasic: (filters) => {
    const params = new URLSearchParams();

    if (filters.foodType && filters.foodType.length > 0) {
      filters.foodType.forEach((category) => {
        params.append("foodCategories", mapFrontendCategoryToBackend(category));
      });
    }

    if (filters.expiryBefore) {
      params.append("expiryBefore", filters.expiryBefore);
    }

    params.append("status", "AVAILABLE");

    return api.get(`/surplus/search?${params.toString()}`);
  },
};

export const claimsAPI = {
  myClaims: () => api.get("/claims/my-claims"), // ✅ No /api prefix
  claim: (postId) => api.post("/claims", { surplusPostId: postId }),
  cancel: (claimId) => api.delete(`/claims/${claimId}`),
};

/**
 * Maps frontend food categories to backend enum values.
 * @param {string} frontendCategory - Frontend category name
 * @returns {string} Backend enum value
 */
function mapFrontendCategoryToBackend(frontendCategory) {
  const categoryMap = {
    "Fruits & Vegetables": "FRUITS_VEGETABLES",
    "Bakery & Pastry": "BAKERY_PASTRY",
    "Packaged / Pantry Items": "PACKAGED_PANTRY",
    "Dairy & Cold Items": "DAIRY_COLD",
    "Frozen Food": "FROZEN",
    "Prepared Meals": "PREPARED_MEALS",
  };

  return categoryMap[frontendCategory] || frontendCategory;
}

export default api;
