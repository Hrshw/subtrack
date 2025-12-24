"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProviderAuthType = exports.saveApiKeyConnection = exports.handleCallback = exports.getAuthorizeUrl = void 0;
const Connection_1 = require("../models/Connection");
const User_1 = require("../models/User");
const encryption_1 = require("../utils/encryption");
// Helper function to safely get and trim environment variables
const getEnvVar = (key, defaultValue = '') => {
    const value = process.env[key] || defaultValue;
    // Trim whitespace and newlines that might be accidentally included
    return value.trim().replace(/\r\n/g, '').replace(/\n/g, '').replace(/\r/g, '');
};
// OAuth configuration for different providers
const OAUTH_CONFIGS = {
    github: {
        clientId: getEnvVar('GITHUB_CLIENT_ID'),
        clientSecret: getEnvVar('GITHUB_CLIENT_SECRET'),
        authUrl: 'https://github.com/login/oauth/authorize',
        tokenUrl: 'https://github.com/login/oauth/access_token',
        scopes: ['read:user', 'repo', 'read:org'],
        redirectUri: getEnvVar('GITHUB_REDIRECT_URI', 'http://localhost:5000/api/oauth/callback/github')
    },
    vercel: {
        clientId: getEnvVar('VERCEL_CLIENT_ID'),
        clientSecret: getEnvVar('VERCEL_CLIENT_SECRET'),
        // Marketplace integrations use a different URL format
        authUrl: 'https://vercel.com/integrations/subtrack/new',
        tokenUrl: 'https://api.vercel.com/v2/oauth/access_token',
        scopes: [],
        redirectUri: getEnvVar('VERCEL_REDIRECT_URI', 'http://localhost:5000/api/oauth/callback/vercel'),
        isMarketplace: true, // Flag to indicate marketplace integration
        useFormUrlEncoded: true
    },
    linear: {
        clientId: getEnvVar('LINEAR_CLIENT_ID'),
        clientSecret: getEnvVar('LINEAR_CLIENT_SECRET'),
        authUrl: 'https://linear.app/oauth/authorize',
        tokenUrl: 'https://api.linear.app/oauth/token',
        scopes: ['read'],
        redirectUri: getEnvVar('LINEAR_REDIRECT_URI', 'http://localhost:5000/api/oauth/callback/linear'),
        useFormUrlEncoded: true // Linear also requires form-urlencoded
    },
    sentry: {
        clientId: getEnvVar('SENTRY_CLIENT_ID'),
        clientSecret: getEnvVar('SENTRY_CLIENT_SECRET'),
        authUrl: 'https://sentry.io/oauth/authorize/',
        tokenUrl: 'https://sentry.io/oauth/token/',
        scopes: ['project:read', 'org:read', 'member:read', 'event:read'],
        redirectUri: getEnvVar('SENTRY_REDIRECT_URI', 'http://localhost:5000/api/oauth/callback/sentry'),
        useFormUrlEncoded: true
    },
    stripe: {
        clientId: getEnvVar('STRIPE_CLIENT_ID'),
        clientSecret: getEnvVar('STRIPE_SECRET_KEY'), // Stripe uses secret key as client secret
        authUrl: 'https://connect.stripe.com/oauth/authorize',
        tokenUrl: 'https://connect.stripe.com/oauth/token',
        scopes: ['read_write'],
        redirectUri: getEnvVar('STRIPE_REDIRECT_URI', 'http://localhost:5000/api/oauth/callback/stripe'),
        useFormUrlEncoded: true
    },
    // API Key based providers (no OAuth flow, just store the key)
    resend: {
        isApiKey: true, // Flag to indicate API key auth, not OAuth
        apiKeyPrefix: 're_' // Resend API keys start with re_
    },
    clerk: {
        isApiKey: true, // Flag to indicate API key auth, not OAuth
        apiKeyPrefix: 'sk_' // Clerk secret keys start with sk_
    }
};
/**
 * Get OAuth authorization URL for a provider
 */
const getAuthorizeUrl = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        console.log('🔐 OAuth authorize URL request received');
        const { provider } = req.query;
        if (!provider || typeof provider !== 'string') {
            return res.status(400).json({ error: 'Provider is required' });
        }
        const providerLower = provider.toLowerCase();
        const config = OAUTH_CONFIGS[providerLower];
        if (!config) {
            return res.status(400).json({ error: `Unsupported provider: ${provider}` });
        }
        if (!config.clientId) {
            console.warn(`⚠️ OAuth not configured for ${provider} - missing CLIENT_ID in env`);
            return res.status(500).json({
                error: `OAuth not configured for ${provider}`,
                hint: `Add ${provider.toUpperCase()}_CLIENT_ID to your .env file`
            });
        }
        // Get userId from Clerk auth
        // @ts-ignore - Clerk middleware adds auth to request
        const userId = (_a = req.auth) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            console.error('❌ No userId found in req.auth - authentication failed');
            return res.status(401).json({ error: 'Authentication required' });
        }
        console.log('✅ User ID from auth:', userId);
        // Generate state parameter for CSRF protection
        const state = Buffer.from(JSON.stringify({
            userId,
            provider: providerLower,
            timestamp: Date.now()
        })).toString('base64');
        let authUrl;
        // Check if this is a Vercel marketplace integration
        if (config.isMarketplace) {
            // Marketplace integrations use a simpler URL with state in query params
            authUrl = `${config.authUrl}?state=${encodeURIComponent(state)}`;
            console.log('✅ Using Vercel Marketplace integration flow');
        }
        else {
            // Standard OAuth flow
            const params = new URLSearchParams({
                client_id: config.clientId,
                redirect_uri: config.redirectUri,
                scope: config.scopes.join(' '),
                state,
                response_type: 'code'
            });
            authUrl = `${config.authUrl}?${params.toString()}`;
        }
        // Debug logging
        console.log('✅ OAuth URL generated for', provider);
        console.log('📋 OAuth Config:', {
            clientId: config.clientId,
            redirectUri: config.redirectUri,
            authUrl: config.authUrl
        });
        console.log('🔗 Full Auth URL:', authUrl);
        res.json({ authUrl });
    }
    catch (error) {
        console.error('❌ OAuth authorize URL error:', error);
        res.status(500).json({
            error: 'Failed to generate authorization URL',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.getAuthorizeUrl = getAuthorizeUrl;
/**
 * Handle OAuth callback and exchange code for token
 */
const handleCallback = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { provider } = req.params;
        const { code, state } = req.query;
        const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        if (!code || !state) {
            return res.redirect(`${frontendUrl}/dashboard?error=oauth_failed`);
        }
        const providerLower = provider.toLowerCase();
        const config = OAUTH_CONFIGS[providerLower];
        if (!config) {
            return res.redirect(`${frontendUrl}/dashboard?error=unsupported_provider`);
        }
        // Verify state parameter
        const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
        const { userId, provider: stateProvider, timestamp } = stateData;
        // Check if state is expired (10 minutes)
        if (Date.now() - timestamp > 10 * 60 * 1000) {
            return res.redirect(`${frontendUrl}/dashboard?error=state_expired`);
        }
        if (stateProvider !== providerLower) {
            return res.redirect(`${frontendUrl}/dashboard?error=state_mismatch`);
        }
        // Exchange code for access token
        // Some providers require form-urlencoded (Vercel, Linear, Sentry, Stripe)
        let tokenResponse;
        if (config.useFormUrlEncoded) {
            // Use form-urlencoded for providers that require it
            const formData = new URLSearchParams({
                client_id: config.clientId,
                client_secret: config.clientSecret,
                code: code,
                redirect_uri: config.redirectUri,
                grant_type: 'authorization_code'
            });
            tokenResponse = yield fetch(config.tokenUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                },
                body: formData.toString()
            });
        }
        else {
            // Use JSON for other providers (GitHub, Linear, etc.)
            tokenResponse = yield fetch(config.tokenUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    client_id: config.clientId,
                    client_secret: config.clientSecret,
                    code,
                    redirect_uri: config.redirectUri,
                    grant_type: 'authorization_code'
                })
            });
        }
        if (!tokenResponse.ok) {
            console.error(`OAuth token exchange failed for ${provider}:`, yield tokenResponse.text());
            return res.redirect(`${frontendUrl}/dashboard?error=token_exchange_failed`);
        }
        const tokenData = yield tokenResponse.json();
        const accessToken = tokenData.access_token;
        if (!accessToken) {
            return res.redirect(`${frontendUrl}/dashboard?error=no_access_token`);
        }
        // Find user
        const user = yield User_1.User.findOne({ clerkId: userId });
        if (!user) {
            return res.redirect(`${frontendUrl}/dashboard?error=user_not_found`);
        }
        // Check connection limit for free users
        if (user.subscriptionStatus !== 'pro') {
            const count = yield Connection_1.Connection.countDocuments({ userId: user._id });
            if (count >= 5) {
                return res.redirect(`${frontendUrl}/dashboard?error=limit_reached`);
            }
        }
        // Encrypt and save token
        const encryptedToken = (0, encryption_1.encryptToken)(accessToken);
        // Check if connection already exists
        const existingConnection = yield Connection_1.Connection.findOne({
            userId: user._id,
            provider: providerLower
        });
        if (existingConnection) {
            // Update existing connection
            existingConnection.encryptedToken = encryptedToken;
            existingConnection.status = 'active';
            existingConnection.metadata = { type: 'oauth', connectedAt: new Date() };
            yield existingConnection.save();
        }
        else {
            // Create new connection
            yield Connection_1.Connection.create({
                userId: user._id,
                provider: providerLower,
                encryptedToken,
                status: 'active',
                metadata: { type: 'oauth', connectedAt: new Date() }
            });
        }
        // Redirect to frontend dashboard with success
        res.redirect(`${frontendUrl}/dashboard?connected=${providerLower}`);
    }
    catch (error) {
        const frontendUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        console.error('OAuth callback error:', error);
        res.redirect(`${frontendUrl}/dashboard?error=oauth_callback_failed`);
    }
});
exports.handleCallback = handleCallback;
/**
 * Save API key connection (for providers like Resend, Clerk that use API keys)
 */
const saveApiKeyConnection = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { provider, apiKey } = req.body;
        // @ts-ignore - Clerk middleware adds auth to request
        const userId = (_a = req.auth) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        if (!provider || !apiKey) {
            return res.status(400).json({ error: 'Provider and API key are required' });
        }
        const providerLower = provider.toLowerCase();
        const config = OAUTH_CONFIGS[providerLower];
        if (!config || !config.isApiKey) {
            return res.status(400).json({ error: `Provider ${provider} does not support API key authentication` });
        }
        // Find user
        const user = yield User_1.User.findOne({ clerkId: userId });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Check connection limit for free users
        if (user.subscriptionStatus !== 'pro') {
            const count = yield Connection_1.Connection.countDocuments({ userId: user._id });
            if (count >= 5) {
                return res.status(403).json({ error: 'Free plan limit reached (5 connections). Upgrade to Pro.' });
            }
        }
        // Encrypt and save the API key
        const encryptedToken = (0, encryption_1.encryptToken)(apiKey);
        // Check if connection already exists
        const existingConnection = yield Connection_1.Connection.findOne({
            userId: user._id,
            provider: providerLower
        });
        if (existingConnection) {
            // Update existing connection
            existingConnection.encryptedToken = encryptedToken;
            existingConnection.status = 'active';
            existingConnection.metadata = { type: 'api_key', connectedAt: new Date() };
            yield existingConnection.save();
        }
        else {
            // Create new connection
            yield Connection_1.Connection.create({
                userId: user._id,
                provider: providerLower,
                encryptedToken,
                status: 'active',
                metadata: { type: 'api_key', connectedAt: new Date() }
            });
        }
        console.log(`✅ API key connection saved for ${provider}`);
        res.json({ success: true, message: `${provider} connected successfully` });
    }
    catch (error) {
        console.error('API key connection error:', error);
        res.status(500).json({ error: 'Failed to save API key connection' });
    }
});
exports.saveApiKeyConnection = saveApiKeyConnection;
/**
 * Check if provider uses API key or OAuth
 */
const getProviderAuthType = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { provider } = req.query;
        if (!provider || typeof provider !== 'string') {
            return res.status(400).json({ error: 'Provider is required' });
        }
        const providerLower = provider.toLowerCase();
        const config = OAUTH_CONFIGS[providerLower];
        if (!config) {
            return res.status(400).json({ error: `Unknown provider: ${provider}` });
        }
        res.json({
            provider: providerLower,
            authType: config.isApiKey ? 'api_key' : 'oauth',
            isConfigured: config.isApiKey ? true : !!config.clientId
        });
    }
    catch (error) {
        console.error('Provider auth type error:', error);
        res.status(500).json({ error: 'Failed to get provider auth type' });
    }
});
exports.getProviderAuthType = getProviderAuthType;
