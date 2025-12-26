import express from 'express';
import { EmailService } from '../services/EmailService';

const router = express.Router();

// Public route to submit support ticket
router.post('/submit', async (req, res) => {
    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Send email to support team
        await EmailService.sendSupportTicket(name, email, message);

        res.status(200).json({ success: true, message: 'Support message received' });
    } catch (error) {
        console.error('Support route error:', error);
        res.status(500).json({ message: 'Failed to send support message' });
    }
});

export default router;
