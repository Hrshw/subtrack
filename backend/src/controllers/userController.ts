import { Request, Response } from 'express';
import { User } from '../models/User';

// Webhook to sync Clerk users to our DB
// NOTE: In production, you should verify the Clerk webhook signature
export const syncUser = async (req: Request, res: Response) => {
    try {
        const { type, data } = req.body;

        if (type === 'user.created' || type === 'user.updated') {
            const { id, email_addresses, first_name, last_name } = data;
            const email = email_addresses[0]?.email_address;
            const name = [first_name, last_name].filter(Boolean).join(' ');

            await User.findOneAndUpdate(
                { clerkId: id },
                { clerkId: id, email, name },
                { upsert: true, new: true }
            );
            console.log(`User synced: ${email} (${name || 'No Name'})`);
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ message: 'Webhook error' });
    }
};

// Get current user profile
export const getProfile = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const user = await User.findOne({ clerkId });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
