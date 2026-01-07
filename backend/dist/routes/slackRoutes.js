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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const SlackIntegration_1 = require("../models/SlackIntegration");
const User_1 = require("../models/User");
const router = express_1.default.Router();
const SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID || '';
const SLACK_CLIENT_SECRET = process.env.SLACK_CLIENT_SECRET || '';
const SLACK_REDIRECT_URI = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/slack/callback`;
/**
 * Initiate Slack OAuth
 */
router.get('/install', auth_1.requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        if (!SLACK_CLIENT_ID) {
            return res.status(400).json({ message: 'Slack integration not configured' });
        }
        // Store user ID in state for callback
        const state = Buffer.from(clerkId).toString('base64');
        const scopes = [
            'incoming-webhook',
            'chat:write',
            'channels:read'
        ].join(',');
        const authUrl = `https://slack.com/oauth/v2/authorize?client_id=${SLACK_CLIENT_ID}&scope=${scopes}&redirect_uri=${encodeURIComponent(SLACK_REDIRECT_URI)}&state=${state}`;
        res.json({ authUrl });
    }
    catch (error) {
        console.error('Slack install error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
}));
/**
 * Slack OAuth callback
 */
router.get('/callback', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
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
        const clerkId = Buffer.from(state, 'base64').toString('utf8');
        const user = yield User_1.User.findOne({ clerkId });
        if (!user) {
            return res.redirect(`${process.env.CLIENT_URL}/settings?slack=error&reason=user_not_found`);
        }
        // Exchange code for access token
        const tokenResponse = yield fetch('https://slack.com/api/oauth.v2.access', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: SLACK_CLIENT_ID,
                client_secret: SLACK_CLIENT_SECRET,
                code: code,
                redirect_uri: SLACK_REDIRECT_URI
            })
        });
        const tokenData = yield tokenResponse.json();
        if (!tokenData.ok) {
            console.error('Slack token exchange failed:', tokenData.error);
            return res.redirect(`${process.env.CLIENT_URL}/settings?slack=error&reason=${tokenData.error}`);
        }
        // Save integration
        yield SlackIntegration_1.SlackIntegration.findOneAndUpdate({ userId: user._id }, {
            userId: user._id,
            teamId: (_a = tokenData.team) === null || _a === void 0 ? void 0 : _a.id,
            teamName: (_b = tokenData.team) === null || _b === void 0 ? void 0 : _b.name,
            accessToken: tokenData.access_token,
            channelId: (_c = tokenData.incoming_webhook) === null || _c === void 0 ? void 0 : _c.channel_id,
            channelName: (_d = tokenData.incoming_webhook) === null || _d === void 0 ? void 0 : _d.channel,
            webhookUrl: (_e = tokenData.incoming_webhook) === null || _e === void 0 ? void 0 : _e.url,
            notificationsEnabled: true,
            weeklyPulseEnabled: true
        }, { upsert: true, new: true });
        console.log(`✅ Slack connected for user ${user.email} to #${(_f = tokenData.incoming_webhook) === null || _f === void 0 ? void 0 : _f.channel}`);
        res.redirect(`${process.env.CLIENT_URL}/settings?slack=success`);
    }
    catch (error) {
        console.error('Slack callback error:', error);
        res.redirect(`${process.env.CLIENT_URL}/settings?slack=error&reason=server_error`);
    }
}));
/**
 * Get Slack integration status
 */
router.get('/status', auth_1.requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const user = yield User_1.User.findOne({ clerkId });
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        const integration = yield SlackIntegration_1.SlackIntegration.findOne({ userId: user._id });
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
    }
    catch (error) {
        console.error('Slack status error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
}));
/**
 * Update Slack settings
 */
router.patch('/settings', auth_1.requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const user = yield User_1.User.findOne({ clerkId });
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        const { notificationsEnabled, weeklyPulseEnabled } = req.body;
        const integration = yield SlackIntegration_1.SlackIntegration.findOneAndUpdate({ userId: user._id }, Object.assign(Object.assign({}, (notificationsEnabled !== undefined && { notificationsEnabled })), (weeklyPulseEnabled !== undefined && { weeklyPulseEnabled })), { new: true });
        if (!integration) {
            return res.status(404).json({ message: 'Slack not connected' });
        }
        res.json({
            message: 'Settings updated',
            notificationsEnabled: integration.notificationsEnabled,
            weeklyPulseEnabled: integration.weeklyPulseEnabled
        });
    }
    catch (error) {
        console.error('Slack settings error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
}));
/**
 * Disconnect Slack
 */
router.delete('/disconnect', auth_1.requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const user = yield User_1.User.findOne({ clerkId });
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        yield SlackIntegration_1.SlackIntegration.findOneAndDelete({ userId: user._id });
        console.log(`🔌 Slack disconnected for user ${user.email}`);
        res.json({ message: 'Slack disconnected successfully' });
    }
    catch (error) {
        console.error('Slack disconnect error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
}));
/**
 * Send test message
 */
router.post('/test', auth_1.requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const user = yield User_1.User.findOne({ clerkId });
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        const integration = yield SlackIntegration_1.SlackIntegration.findOne({ userId: user._id });
        if (!(integration === null || integration === void 0 ? void 0 : integration.webhookUrl)) {
            return res.status(404).json({ message: 'Slack not connected' });
        }
        yield fetch(integration.webhookUrl, {
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
    }
    catch (error) {
        console.error('Slack test error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
}));
exports.default = router;
