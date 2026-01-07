// Currency configuration and utilities

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AUD' | 'CAD' | 'SGD' | 'AED';

export interface CurrencyConfig {
    code: CurrencyCode;
    symbol: string;
    name: string;
    locale: string;
    rate: number; // Exchange rate relative to USD
}

// Exchange rates relative to USD (approximate, update periodically)
export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
    USD: { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US', rate: 1 },
    INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN', rate: 85 },
    EUR: { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE', rate: 0.92 },
    GBP: { code: 'GBP', symbol: '£', name: 'British Pound', locale: 'en-GB', rate: 0.79 },
    AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU', rate: 1.55 },
    CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA', rate: 1.36 },
    SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', locale: 'en-SG', rate: 1.34 },
    AED: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', locale: 'ar-AE', rate: 3.67 },
};

// Country to currency mapping
export const COUNTRY_CURRENCY_MAP: Record<string, CurrencyCode> = {
    'IN': 'INR',
    'US': 'USD',
    'GB': 'GBP',
    'DE': 'EUR',
    'FR': 'EUR',
    'IT': 'EUR',
    'ES': 'EUR',
    'NL': 'EUR',
    'BE': 'EUR',
    'AT': 'EUR',
    'AU': 'AUD',
    'CA': 'CAD',
    'SG': 'SGD',
    'AE': 'AED',
    'PK': 'USD', // Default to USD for unsupported
    'BD': 'USD',
};

/**
 * Convert amount from INR (database storage) to target currency
 * Note: All savings in DB are stored in INR
 */
export function convertFromINR(amountINR: number, targetCurrency: CurrencyCode): number {
    const inrRate = CURRENCIES.INR.rate;
    const targetRate = CURRENCIES[targetCurrency].rate;

    // Convert INR to USD first, then to target
    const amountUSD = amountINR / inrRate;
    const converted = amountUSD * targetRate;

    return Math.round(converted * 100) / 100;
}

/**
 * Format amount with currency symbol and locale formatting
 */
export function formatCurrency(amount: number, currency: CurrencyCode): string {
    const config = CURRENCIES[currency];

    try {
        return new Intl.NumberFormat(config.locale, {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: (amount % 1 !== 0) ? 2 : 0,
            maximumFractionDigits: 2,
        }).format(amount);
    } catch {
        // Fallback for older browsers
        return `${config.symbol}${amount.toLocaleString()}`;
    }
}

/**
 * Get currency symbol only
 */
export function getCurrencySymbol(currency: CurrencyCode): string {
    return CURRENCIES[currency]?.symbol || '$';
}

/**
 * Detect user's likely currency from browser settings
 */
export function detectUserCurrency(): CurrencyCode {
    try {
        // 1. Try timezone detection first as it's the most accurate for actual location
        const tzCountry = detectCountryFromTimezone();
        if (tzCountry && tzCountry !== 'US' && COUNTRY_CURRENCY_MAP[tzCountry]) {
            return COUNTRY_CURRENCY_MAP[tzCountry];
        }

        // 2. Try all preferred browser languages (navigator.languages)
        // Often 'en-IN' is in the list even if 'en-US' is primary
        const languages = navigator.languages || [navigator.language || 'en-US'];
        for (const lang of languages) {
            if (lang.includes('-')) {
                const parts = lang.split('-');
                const countryCode = parts[parts.length - 1].toUpperCase();
                if (COUNTRY_CURRENCY_MAP[countryCode]) {
                    return COUNTRY_CURRENCY_MAP[countryCode];
                }
            }
        }

        // 3. Fallback to direct timezone string checks for India
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (tz === 'Asia/Kolkata' || tz === 'Asia/Calcutta') {
            return 'INR';
        }

        // 4. Final last fallback to timezone (even if it's US)
        if (tzCountry && COUNTRY_CURRENCY_MAP[tzCountry]) {
            return COUNTRY_CURRENCY_MAP[tzCountry];
        }

        return 'USD';
    } catch {
        return 'USD';
    }
}

/**
 * Detect user's country from timezone
 */
export function detectCountryFromTimezone(): string {
    try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const offset = new Date().getTimezoneOffset();

        // India detection (Kolkata/Calcutta or +5:30 offset)
        if (tz.includes('Kolkata') || tz.includes('Calcutta') || tz.includes('India') || offset === -330) return 'IN';

        if (tz.includes('London') || offset === 0 || offset === -60) return 'GB';
        if (tz.includes('Berlin') || tz.includes('Paris') || tz.includes('Rome') || offset === -60 || offset === -120) return 'DE'; // Simplified EU fallback
        if (tz.includes('Sydney') || tz.includes('Melbourne') || offset === -600 || offset === -660) return 'AU';
        if (tz.includes('Singapore') || offset === -480) return 'SG';
        if (tz.includes('Dubai') || offset === -240) return 'AE';
        if (tz.includes('Toronto') || tz.includes('Vancouver') || offset === 240 || offset === 300 || offset === 480) return 'CA';
        if (tz.includes('America') || (offset >= 240 && offset <= 480)) return 'US';

        return 'US';
    } catch {
        return 'US';
    }
}
