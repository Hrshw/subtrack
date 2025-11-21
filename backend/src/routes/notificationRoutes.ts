import express from 'express';
import { NotificationSettings } from '../models/NotificationSettings';
import { EmailService } from '../services/EmailService';
import { User } from '../models/User';

const router = express.Router();

// Get settings
router.get('/settings', async (req, res) => {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;

        let settings = await NotificationSettings.findOne({ userId: clerkId });

        if (!settings) {
            settings = await NotificationSettings.create({
                userId: clerkId,
                monthlyDigest: true,
                leakAlerts: false,
                emailPreference: 'instant'
            });
        }

        res.json(settings);
    } catch (error) {
        console.error('Error fetching notification settings:', error);
        res.status(500).json({ message: 'Failed to fetch settings' });
    }
});

// Update settings
router.put('/settings', async (req, res) => {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const { monthlyDigest, leakAlerts, emailPreference } = req.body;

        const settings = await NotificationSettings.findOneAndUpdate(
            { userId: clerkId },
            {
                monthlyDigest,
                leakAlerts,
                emailPreference
            },
            { new: true, upsert: true }
        );

        res.json(settings);
    } catch (error) {
        console.error('Error updating notification settings:', error);
        res.status(500).json({ message: 'Failed to update settings' });
    }
});

// Send test email
router.post('/test-email', async (req, res) => {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const { type } = req.body; // 'digest' or 'alert'

        const user = await User.findOne({ clerkId });
        if (!user || !user.email) {
            return res.status(404).json({ message: 'User email not found' });
        }

        if (type === 'digest') {
            await EmailService.sendMonthlyDigest(
                user.email,
                12500,
                [
                    { resourceName: 'GitHub Copilot', reason: 'Inactive for 45 days', potentialSavings: 800 },
                    { resourceName: 'Vercel Pro', reason: 'Underutilized limits', potentialSavings: 1600 }
                ]
            );
        } else {
            await EmailService.sendLeakAlert(
                user.email,
                'AWS RDS Instance',
                4500,
                'Idle DB instance detected'
            );
        }

        res.json({ message: 'Test email sent' });
    } catch (error) {
        console.error('Error sending test email:', error);
        res.status(500).json({ message: 'Failed to send test email' });
    }
});

export default router;
