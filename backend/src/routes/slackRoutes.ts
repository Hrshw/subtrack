import express from 'express';
import { requireAuth } from '../middleware/auth';
import { SlackIntegration } from '../models/SlackIntegration';
import { User } from '../models/User';

const router = express.Router();

const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID || '';
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET || '';
const SLACK_REDIRECT_URI = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/slack/callback`;

/**
 * Initiate Slack OAuth
 */
router.get('/install', requireAuth, async (req, res) => {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;

        if (!SLACK_CLIENT_ID) {
            return res.status(400).json({ message: 'Slack integration not configured' });
        }

        // Store user ID in state for callback
        const state = Buffer.from(clerkId as string).toString('base64');

        const scopes = [
            'incoming-webhook',
            'chat:write',
            'channels:read'
        ].join(',');

        const authUrl = `https://slack.com/oauth/v2/authorize?client_id=${SLACK_CLIENT_ID}&scope=${scopes}&redirect_uri=${encodeURIComponent(SLACK_REDIRECT_URI)}&state=${state}`;

        res.json({ authUrl });
    } catch (error) {
        console.error('Slack install error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});

/**
 * Slack OAuth callback
 */
router.get('/callback', async (req, res) => {
    try {
        const { code, state, error } = req.query;

        if (error) {
            console.error('Slack OAuth error:', error);
            return res.redirect(`${process.env.CLIENT_URL}/settings?slack=error&reason=${error}`);
        }

        if (!code || !state) {
            return res.redirect(`${process.env.CLIENT_URL}/settings?slack=error&reason=missing_params`);
        }

        // Decode state to get clerkId
        const clerkId = Buffer.from(state as string, 'base64').toString('utf8');
        const user = await User.findOne({ clerkId });

        if (!user) {
            return res.redirect(`${process.env.CLIENT_URL}/settings?slack=error&reason=user_not_found`);
        }

        // Exchange code for access token
        const tokenResponse = await fetch('https://slack.com/api/oauth.v2.access', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: SLACK_CLIENT_ID,
                client_secret: SLACK_CLIENT_SECRET,
                code: code as string,
                redirect_uri: SLACK_REDIRECT_URI
            })
        });

        const tokenData = await tokenResponse.json();

        if (!tokenData.ok) {
            console.error('Slack token exchange failed:', tokenData.error);
            return res.redirect(`${process.env.CLIENT_URL}/settings?slack=error&reason=${tokenData.error}`);
        }

        // Save integration
        await SlackIntegration.findOneAndUpdate(
            { userId: user._id },
            {
                userId: user._id,
                teamId: tokenData.team?.id,
                teamName: tokenData.team?.name,
                accessToken: tokenData.access_token,
                channelId: tokenData.incoming_webhook?.channel_id,
                channelName: tokenData.incoming_webhook?.channel,
                webhookUrl: tokenData.incoming_webhook?.url,
                notificationsEnabled: true,
                weeklyPulseEnabled: true
            },
            { upsert: true, new: true }
        );

        console.log(`✅ Slack connected for user ${user.email} to #${tokenData.incoming_webhook?.channel}`);

        res.redirect(`${process.env.CLIENT_URL}/settings?slack=success`);
    } catch (error) {
        console.error('Slack callback error:', error);
        res.redirect(`${process.env.CLIENT_URL}/settings?slack=error&reason=server_error`);
    }
});

/**
 * Get Slack integration status
 */
router.get('/status', requireAuth, async (req, res) => {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const user = await User.findOne({ clerkId });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const integration = await SlackIntegration.findOne({ userId: user._id });

        if (!integration) {
            return res.json({ connected: false });
        }

        res.json({
            connected: true,
            teamName: integration.teamName,
            channelName: integration.channelName,
            notificationsEnabled: integration.notificationsEnabled,
            weeklyPulseEnabled: integration.weeklyPulseEnabled
        });
    } catch (error) {
        console.error('Slack status error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});

/**
 * Update Slack settings
 */
router.patch('/settings', requireAuth, async (req, res) => {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const user = await User.findOne({ clerkId });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const { notificationsEnabled, weeklyPulseEnabled } = req.body;

        const integration = await SlackIntegration.findOneAndUpdate(
            { userId: user._id },
            {
                ...(notificationsEnabled !== undefined && { notificationsEnabled }),
                ...(weeklyPulseEnabled !== undefined && { weeklyPulseEnabled })
            },
            { new: true }
        );

        if (!integration) {
            return res.status(404).json({ message: 'Slack not connected' });
        }

        res.json({
            message: 'Settings updated',
            notificationsEnabled: integration.notificationsEnabled,
            weeklyPulseEnabled: integration.weeklyPulseEnabled
        });
    } catch (error) {
        console.error('Slack settings error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});

/**
 * Disconnect Slack
 */
router.delete('/disconnect', requireAuth, async (req, res) => {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const user = await User.findOne({ clerkId });
        if (!user) return res.status(404).json({ message: 'User not found' });

        await SlackIntegration.findOneAndDelete({ userId: user._id });

        console.log(`🔌 Slack disconnected for user ${user.email}`);
        res.json({ message: 'Slack disconnected successfully' });
    } catch (error) {
        console.error('Slack disconnect error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});

/**
 * Send test message
 */
router.post('/test', requireAuth, async (req, res) => {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const user = await User.findOne({ clerkId });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const integration = await SlackIntegration.findOne({ userId: user._id });
        if (!integration?.webhookUrl) {
            return res.status(404).json({ message: 'Slack not connected' });
        }

        await fetch(integration.webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: "🎉 SubTrack is connected! You'll receive weekly savings reports here.",
                blocks: [
                    {
                        type: "section",
                        text: {
                            type: "mrkdwn",
                            text: "🎉 *SubTrack Connected!*\n\nYou'll receive weekly savings reports here. Stay tuned for your first 🟢 *Weekly Pulse*!"
                        }
                    }
                ]
            })
        });

        res.json({ message: 'Test message sent!' });
    } catch (error) {
        console.error('Slack test error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});

export default router;
