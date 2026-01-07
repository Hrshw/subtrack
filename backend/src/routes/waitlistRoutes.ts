import express from 'express';
import { Waitlist } from '../models/Waitlist';
import { EmailService } from '../services/EmailService';

const router = express.Router();

// Join waitlist
router.post('/join', async (req, res) => {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const { email, expectedSavings, userId } = req.body;

        // Check if already on waitlist
        const existing = await Waitlist.findOne({ userId: clerkId });
        if (existing) {
            return res.status(400).json({
                message: 'Already on waitlist',
                position: existing.position
            });
        }

        // Get current count to determine position
        const count = await Waitlist.countDocuments();
        const position = count + 1;

        // Create waitlist entry
        await Waitlist.create({
            userId: clerkId,
            email,
            expectedSavings: expectedSavings || 0,
            position
        });

        console.log(`✅ User ${clerkId} joined waitlist at position #${position}`);

        // Send confirmation email
        if (email) {
            await EmailService.sendWaitlistEmail(email, position);
        }

        res.json({
            message: 'Successfully joined waitlist',
            position
        });
    } catch (error) {
        console.error('Waitlist join error:', error);
        res.status(500).json({ message: 'Failed to join waitlist', error });
    }
});

// Get waitlist stats (admin)
router.get('/stats', async (req, res) => {
    try {
        const total = await Waitlist.countDocuments();
        const avgSavings = await Waitlist.aggregate([
            {
                $group: {
                    _id: null,
                    average: { $avg: '$expectedSavings' },
                    total: { $sum: '$expectedSavings' }
                }
            }
        ]);

        res.json({
            totalUsers: total,
            averageSavings: avgSavings[0]?.average || 0,
            totalExpectedSavings: avgSavings[0]?.total || 0
        });
    } catch (error) {
        console.error('Waitlist stats error:', error);
        res.status(500).json({ message: 'Failed to fetch stats', error });
    }
});

// Get user's position
router.get('/position', async (req, res) => {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;

        const entry = await Waitlist.findOne({ userId: clerkId });
        if (!entry) {
            return res.status(404).json({ message: 'Not on waitlist' });
        }

        res.json({
            position: entry.position,
            email: entry.email,
            createdAt: entry.createdAt
        });
    } catch (error) {
        console.error('Position fetch error:', error);
        res.status(500).json({ message: 'Failed to fetch position', error });
    }
});

export default router;
