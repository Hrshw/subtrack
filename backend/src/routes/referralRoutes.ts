import express from 'express';
import { requireAuth } from '../middleware/auth';
import { ReferralService } from '../services/ReferralService';
import { User } from '../models/User';

const router = express.Router();

/**
 * Get or create referral code
 */
router.get('/code', requireAuth, async (req, res) => {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const user = await User.findOne({ clerkId });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const code = await ReferralService.getOrCreateReferralCode((user._id as any).toString());
        res.json({ code });
    } catch (error) {
        console.error('Get referral code error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});

/**
 * Get referral stats
 */
router.get('/stats', requireAuth, async (req, res) => {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const user = await User.findOne({ clerkId });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const stats = await ReferralService.getReferralStats((user._id as any).toString());
        res.json(stats);
    } catch (error) {
        console.error('Get referral stats error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});

/**
 * Apply referral code (during signup)
 */
router.post('/apply', requireAuth, async (req, res) => {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ message: 'Referral code is required' });
        }

        const user = await User.findOne({ clerkId });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const result = await ReferralService.applyReferralCode(
            (user._id as any).toString(),
            user.email,
            code
        );

        res.json(result);
    } catch (error) {
        console.error('Apply referral code error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});

/**
 * Validate referral code (public - for showing on signup page)
 */
router.get('/validate/:code', async (req, res) => {
    try {
        const { code } = req.params;
        const { Referral } = await import('../models/Referral');

        const referral = await Referral.findOne({ referralCode: code.toUpperCase() });

        if (!referral) {
            return res.json({ valid: false, message: 'Invalid referral code' });
        }

        const user = await User.findById(referral.userId);
        const referrerName = user?.email?.split('@')[0] || 'A friend';

        res.json({
            valid: true,
            message: `Referred by ${referrerName}! Connect 3 services to unlock rewards.`
        });
    } catch (error) {
        console.error('Validate referral code error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});

export default router;
