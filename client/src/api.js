import axios from 'axios';

// API base URL (with /api)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

// Server base URL (without /api) for serving static files like images
export const SERVER_BASE_URL = API_BASE_URL.replace(/\/api$/, '');

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Helper function to get the full image URL
// Handles local uploads (/uploads/...) and external URLs (http://...)
export const getImageUrl = (imagePath, fallback = "https://images.unsplash.com/photo-1530267981375-f0de93cdf538?auto=format&fit=crop&q=80&w=1000") => {
    if (!imagePath || imagePath === 'no-photo.jpg') {
        return fallback;
    }
    // If it's already an absolute URL, return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }
    // For local uploads, prepend server base URL
    return `${SERVER_BASE_URL}${imagePath}`;
};

export const registerUser = async (formData) => {
    try {
        const response = await api.post("/auth/register", formData);
        return response.data;   // ← IMPORTANT
    } catch (error) {
        console.error("API REGISTER ERROR:", error);

        // Return clean error object for frontend
        return {
            success: false,
            message:
                error.response?.data?.message || "Registration failed. Try again.",
        };
    }
};

export const loginUser = async (formData) => {
    try {
        const response = await api.post("/auth/login", formData);
        return response.data; // Must return data
    } catch (error) {
        console.error("API LOGIN ERROR:", error);
        return {
            success: false,
            message: error.response?.data?.message || "Login failed"
        };
    }
};

// Google OAuth Login
export const googleLogin = async (credential) => {
    try {
        const response = await api.post("/auth/google", { credential });
        return response.data;
    } catch (error) {
        console.error("API GOOGLE LOGIN ERROR:", error);
        return {
            success: false,
            message: error.response?.data?.message || "Google login failed"
        };
    }
};

// Complete Google Profile with Role Selection
export const completeGoogleProfile = async (role) => {
    try {
        const response = await api.post("/auth/google/complete-profile", { role });
        return response.data;
    } catch (error) {
        console.error("API COMPLETE GOOGLE PROFILE ERROR:", error);
        return {
            success: false,
            message: error.response?.data?.message || "Failed to complete profile"
        };
    }
};


// Get all equipment
export const getEquipment = () => api.get("/equipment");

// Get equipment by ID
export const getEquipmentById = (id) => api.get(`/equipment/${id}`);

// Create new equipment (Private)
export const createEquipment = (data) => api.post("/equipment", data, {
    headers: {
        'Content-Type': 'multipart/form-data',
    },
});

// Update equipment (Private)
export const updateEquipment = (id, data) => api.put(`/equipment/${id}`, data);

// Delete equipment (Private)
export const deleteEquipment = (id) => api.delete(`/equipment/${id}`);

// Get dashboard stats (Private)
export const getDashboardStats = () => api.get("/dashboard/stats");

// Bookings
export const getBookings = () => api.get('/bookings');
// Fetch bookings with query params (start, end, equipmentId)
export const getBookingsWithQuery = (params) => api.get('/bookings', { params });
export const getBookingById = (id) => api.get(`/bookings/${id}`);
export const createBooking = (data) => api.post('/bookings', data);
export const updateBooking = (id, data) => api.put(`/bookings/${id}`, data);
export const deleteBooking = (id) => api.delete(`/bookings/${id}`);
export const assignDriverToBooking = (id) => api.put(`/bookings/${id}/driver`);

// User profile
export const updateProfile = (data) => api.put('/auth/me', data);

// Payments
export const createPaymentIntent = (bookingId, amount) =>
    api.post('/payments/create-payment-intent', { bookingId, amount });

export const confirmPayment = (bookingId, paymentIntentId) =>
    api.post('/payments/confirm-payment', { bookingId, paymentIntentId });

// Work requests / workers
export const createWorkRequest = (data) => api.post('/work-requests', data);
export const getWorkRequestsForWorker = () => api.get('/work-requests/worker');
export const getWorkRequestsByOwner = () => api.get('/work-requests/owner');
export const respondToWorkRequest = (id, action) => api.put(`/work-requests/${id}/respond`, { action });
export const searchWorkers = (q, role = 'worker') => api.get(`/work-requests/search?q=${encodeURIComponent(q || '')}&role=${role}`);
export const getAssignedWorkForWorker = () => api.get('/work-requests/my');

// Weather API
export const getWeatherForecast = (location) => api.get(`/weather/forecast/${encodeURIComponent(location)}`);
export const getCurrentWeather = (location) => api.get(`/weather/current/${encodeURIComponent(location)}`);
export const getBookingRecommendation = (data) => api.post('/weather/recommend', data);

// Reviews API
export const createReview = (data) => api.post('/reviews', data);
export const getEquipmentReviews = (equipmentId, page = 1) => api.get(`/reviews/equipment/${equipmentId}?page=${page}`);
export const getUserReviews = (userId, type) => api.get(`/reviews/user/${userId}${type ? `?type=${type}` : ''}`);
export const updateReview = (id, data) => api.put(`/reviews/${id}`, data);
export const deleteReview = (id) => api.delete(`/reviews/${id}`);

// Wishlist API
export const addToWishlist = (equipmentId) => api.post('/wishlist', { equipmentId });
export const removeFromWishlist = (equipmentId) => api.delete(`/wishlist/${equipmentId}`);
export const getWishlist = () => api.get('/wishlist');
export const checkWishlist = (equipmentId) => api.get(`/wishlist/check/${equipmentId}`);
export const getWishlistCount = () => api.get('/wishlist/count');

// Notifications API
export const getNotifications = (page = 1, unreadOnly = false) =>
    api.get(`/notifications?page=${page}&unread=${unreadOnly}`);
export const markNotificationRead = (id) => api.put(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => api.put('/notifications/read-all');
export const deleteNotification = (id) => api.delete(`/notifications/${id}`);
export const getUnreadNotificationCount = () => api.get('/notifications/unread-count');

// AI Chat API
export const sendChatMessage = (message, sessionId, context) =>
    api.post('/chat', { message, sessionId, context });
export const getChatHistory = () => api.get('/chat/history');
export const getChatSession = (id) => api.get(`/chat/session/${id}`);
export const deleteChatSession = (id) => api.delete(`/chat/session/${id}`);
export const getChatSuggestions = () => api.get('/chat/suggestions');
export const analyzeCropImage = (base64Image, mimeType, message) =>
    api.post('/chat/analyze-image', { base64Image, mimeType, message });

// Admin API
export const getAdminAnalytics = () => api.get('/admin/analytics');
export const getAdminActivities = (limit = 20) => api.get(`/admin/activities?limit=${limit}`);
export const getAdminUsers = (page = 1, limit = 10, role = '', search = '') =>
    api.get(`/admin/users?page=${page}&limit=${limit}${role ? `&role=${role}` : ''}${search ? `&search=${search}` : ''}`);
export const updateAdminUser = (id, data) => api.put(`/admin/users/${id}`, data);
export const deleteAdminUser = (id) => api.delete(`/admin/users/${id}`);
export const getAdminEquipment = (page = 1, limit = 10, type = '', search = '') =>
    api.get(`/admin/equipment?page=${page}&limit=${limit}${type ? `&type=${type}` : ''}${search ? `&search=${search}` : ''}`);
export const updateAdminEquipment = (id, data) => api.put(`/admin/equipment/${id}`, data);
export const deleteAdminEquipment = (id) => api.delete(`/admin/equipment/${id}`);
export const getAdminBookings = (page = 1, limit = 10, status = '', paymentStatus = '') =>
    api.get(`/admin/bookings?page=${page}&limit=${limit}${status ? `&status=${status}` : ''}${paymentStatus ? `&paymentStatus=${paymentStatus}` : ''}`);
export const updateAdminBooking = (id, data) => api.put(`/admin/bookings/${id}`, data);

export default api;

