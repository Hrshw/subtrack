import express from 'express';
import { Feedback } from '../models/Feedback';
import { Waitlist } from '../models/Waitlist';
import { User } from '../models/User';

const router = express.Router();

// Get all feedback and waitlist entries (Admin only - typically you'd add middleware here)
// For now, we'll keep it open or assume the frontend handles basic role checking
router.get('/stats', async (req, res) => {
    try {
        const [feedbacks, waitlist, users] = await Promise.all([
            Feedback.find().sort({ createdAt: -1 }),
            Waitlist.find().sort({ createdAt: -1 }),
            User.countDocuments()
        ]);

        res.status(200).json({
            feedbacks,
            waitlist,
            userCount: users
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ message: 'Failed to fetch admin stats' });
    }
});

// Update feedback status
router.patch('/feedback/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const feedback = await Feedback.findByIdAndUpdate(req.params.id, { status }, { new: true });
        res.status(200).json(feedback);
    } catch (error) {
        res.status(500).json({ message: 'Failed to update feedback' });
    }
});

export default router;
