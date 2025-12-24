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
const NotificationSettings_1 = require("../models/NotificationSettings");
const EmailService_1 = require("../services/EmailService");
const User_1 = require("../models/User");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// Apply authentication middleware to all routes
router.use(auth_1.requireAuth);
// Get settings
router.get('/settings', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        let settings = yield NotificationSettings_1.NotificationSettings.findOne({ userId: clerkId });
        if (!settings) {
            settings = yield NotificationSettings_1.NotificationSettings.create({
                userId: clerkId,
                monthlyDigest: true,
                leakAlerts: false,
                emailPreference: 'instant'
            });
        }
        res.json(settings);
    }
    catch (error) {
        console.error('Error fetching notification settings:', error);
        res.status(500).json({ message: 'Failed to fetch settings' });
    }
}));
// Update settings
router.put('/settings', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const { monthlyDigest, leakAlerts, emailPreference } = req.body;
        const settings = yield NotificationSettings_1.NotificationSettings.findOneAndUpdate({ userId: clerkId }, {
            monthlyDigest,
            leakAlerts,
            emailPreference
        }, { new: true, upsert: true });
        res.json(settings);
    }
    catch (error) {
        console.error('Error updating notification settings:', error);
        res.status(500).json({ message: 'Failed to update settings' });
    }
}));
// Send test email
router.post('/test-email', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const { type } = req.body; // 'digest' or 'alert'
        const user = yield User_1.User.findOne({ clerkId });
        if (!user || !user.email) {
            return res.status(404).json({ message: 'User email not found' });
        }
        if (type === 'digest') {
            yield EmailService_1.EmailService.sendMonthlyDigest(user.email, 12500, [
                { resourceName: 'GitHub Copilot', reason: 'Inactive for 45 days', potentialSavings: 800 },
                { resourceName: 'Vercel Pro', reason: 'Underutilized limits', potentialSavings: 1600 }
            ]);
        }
        else {
            yield EmailService_1.EmailService.sendLeakAlert(user.email, 'AWS RDS Instance', 4500, 'Idle DB instance detected');
        }
        res.json({ message: 'Test email sent' });
    }
    catch (error) {
        console.error('Error sending test email:', error);
        res.status(500).json({ message: 'Failed to send test email' });
    }
}));
exports.default = router;
