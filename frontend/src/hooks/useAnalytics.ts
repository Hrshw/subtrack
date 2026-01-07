export const useAnalytics = () => {
    const trackEvent = (eventName: string, params?: object) => {
        if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', eventName, params);
            console.log(`[Analytics] Tracked event: ${eventName}`, params);
        }
    };

    return { trackEvent };
};
