/**
 * Get the API base URL
 * In production on Vercel, uses relative URLs (/api) for zero CORS
 * In development or if VITE_API_URL is set, uses that URL
 */
export const getApiUrl = (): string => {
    // In production on Vercel, use relative URLs (same domain = zero CORS)
    if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
        return '/api';
    }
    
    // If VITE_API_URL is explicitly set, use it (for custom backends)
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL.replace(/\/$/, '');
    }
    
    // Development fallback
    return import.meta.env.DEV ? 'http://localhost:5000/api' : '/api';
};

