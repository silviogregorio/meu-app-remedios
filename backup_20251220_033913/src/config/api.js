/**
 * API Configuration
 * Centralizes API URL configuration for all environments
 */

// Get API URL from environment variable or use default based on environment
export const API_URL = import.meta.env.VITE_API_URL ||
    (import.meta.env.MODE === 'production' ? '' : 'http://localhost:3000');

/**
 * Get the full endpoint URL
 * @param {string} path - API path (e.g., '/api/send-email')
 * @returns {string} - Full endpoint URL
 */
export const getApiEndpoint = (path) => {
    // If API_URL is empty (production), use relative path
    // Otherwise, prepend the API_URL
    return API_URL ? `${API_URL}${path}` : path;
};

export default {
    API_URL,
    getApiEndpoint
};
