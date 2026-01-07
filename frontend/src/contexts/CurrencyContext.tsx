import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
export type { CurrencyCode };
import {
    CurrencyCode,
    convertFromINR,
    formatCurrency,
    getCurrencySymbol,
    detectUserCurrency
} from '../lib/currency';

interface CurrencyContextType {
    currency: CurrencyCode;
    setCurrency: (currency: CurrencyCode) => Promise<void>;
    formatAmount: (amountINR: number) => string;
    getSymbol: () => string;
    loading: boolean;
    convertAmount: (amountINR: number) => number;
    updateFromProfile: (profile: { currency?: CurrencyCode } | null) => void;
}

const CURRENCY_STORAGE_KEY = 'subtrack_currency';

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
    const { getToken, isSignedIn } = useAuth();

    // Initialize from localStorage or detect
    const getInitialCurrency = (): CurrencyCode => {
        try {
            const stored = localStorage.getItem(CURRENCY_STORAGE_KEY);
            if (stored && ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'AED'].includes(stored)) {
                return stored as CurrencyCode;
            }
        } catch { }
        return detectUserCurrency();
    };

    const [currency, setCurrencyState] = useState<CurrencyCode>(getInitialCurrency);
    const [loading, setLoading] = useState(false);

    // Update from profile data (called by components that already fetch user data)
    const updateFromProfile = useCallback((profile: { currency?: CurrencyCode } | null) => {
        if (profile?.currency) {
            setCurrencyState(profile.currency);
            try {
                localStorage.setItem(CURRENCY_STORAGE_KEY, profile.currency);
            } catch { }
        }
    }, []);

    // Only fetch if not cached and signed in
    useEffect(() => {
        const loadCurrency = async () => {
            // Check if we have a cached value
            const cached = localStorage.getItem(CURRENCY_STORAGE_KEY);
            if (cached) {
                setLoading(false);
                return; // Use cached value
            }

            // For logged-out users, just detect
            if (!isSignedIn) {
                const detected = detectUserCurrency();
                setCurrencyState(detected);
                setLoading(false);
                return;
            }

            // Fetch from server only if no cache
            try {
                setLoading(true);
                const token = await getToken();
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/users/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const userCurrency = res.data?.currency || detectUserCurrency();
                setCurrencyState(userCurrency);
                localStorage.setItem(CURRENCY_STORAGE_KEY, userCurrency);
            } catch (error) {
                console.warn('Failed to load currency preference, using detected');
                const detected = detectUserCurrency();
                setCurrencyState(detected);
            } finally {
                setLoading(false);
            }
        };

        loadCurrency();
    }, [isSignedIn, getToken]);

    // Update currency on server and locally
    const setCurrency = async (newCurrency: CurrencyCode) => {
        const oldCurrency = currency;
        setCurrencyState(newCurrency); // Optimistic update
        localStorage.setItem(CURRENCY_STORAGE_KEY, newCurrency);

        try {
            if (isSignedIn) {
                const token = await getToken();
                await axios.patch(
                    `${import.meta.env.VITE_API_URL}/users/me`,
                    { currency: newCurrency },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            }
        } catch (error) {
            console.error('Failed to save currency preference:', error);
            setCurrencyState(oldCurrency); // Rollback on error
            localStorage.setItem(CURRENCY_STORAGE_KEY, oldCurrency);
            throw error;
        }
    };

    // Format amount from INR (database currency) to user's preferred currency
    const formatAmount = useCallback((amountINR: number): string => {
        const converted = convertFromINR(amountINR, currency);
        return formatCurrency(converted, currency);
    }, [currency]);

    const convertAmount = useCallback((amountINR: number) => {
        return convertFromINR(amountINR, currency);
    }, [currency]);

    const getSymbol = useCallback(() => getCurrencySymbol(currency), [currency]);

    return (
        <CurrencyContext.Provider value={{
            currency,
            setCurrency,
            formatAmount,
            getSymbol,
            loading,
            convertAmount,
            updateFromProfile
        }}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    const context = useContext(CurrencyContext);
    if (context === undefined) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
}
