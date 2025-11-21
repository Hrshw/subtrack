/**
 * Get the API base URL
 * Uses VITE_API_URL if set, otherwise falls back to relative URLs
 */
export const getApiUrl = (): string => {
    // If VITE_API_URL is set, use it (for both dev and production)
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL.replace(/\/$/, '');
    }
    // Fallback to relative URLs
    return '/api';
};

