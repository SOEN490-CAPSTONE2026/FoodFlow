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
  list: () => api.get("/surplus"), // ✅ Just /surplus, not /api/surplus
  myPosts: () => api.get("/surplus/my-posts"),
  getMyPosts: () => api.get("/surplus/my-posts"),
  create: (data) => api.post("/surplus", data),
  claim: (postId) => api.post("/claims", { surplusPostId: postId }),

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
    // Transform frontend filter format to backend format
    const filterRequest = {
      foodCategories:
        filters.foodType && filters.foodType.length > 0
          ? filters.foodType.map(mapFrontendCategoryToBackend)
          : null,
      expiryBefore: filters.expiryBefore ? filters.expiryBefore : null,
      userLocation:
        filters.locationCoords && filters.distance
          ? {
              latitude: parseFloat(filters.locationCoords.lat),
              longitude: parseFloat(filters.locationCoords.lng),
              address: filters.locationCoords.address || filters.location,
            }
          : null,
      maxDistanceKm:
        filters.locationCoords && filters.distance
          ? parseFloat(filters.distance)
          : null,
      status: "AVAILABLE", // Always filter for available posts
    };

    // Remove null/undefined values
    Object.keys(filterRequest).forEach((key) => {
      if (filterRequest[key] === null || filterRequest[key] === undefined) {
        delete filterRequest[key];
      }
    });

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
    "Frozen Food": "FROZEN_FOOD",
    "Prepared Meals": "PREPARED_MEALS",
  };

  return categoryMap[frontendCategory] || frontendCategory;
}

export default api;
