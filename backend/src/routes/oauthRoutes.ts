import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import * as oauthController from '../controllers/oauthController';

const router = Router();

// Get OAuth authorization URL for a provider
router.get('/authorize-url', requireAuth, oauthController.getAuthorizeUrl);

// Get provider auth type (api_key or oauth)
router.get('/auth-type', requireAuth, oauthController.getProviderAuthType);

// Save API key connection (for Resend, Clerk, etc.)
router.post('/api-key', requireAuth, oauthController.saveApiKeyConnection);

// OAuth callback handler
router.get('/callback/:provider', oauthController.handleCallback);

export default router;
