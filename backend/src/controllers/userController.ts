import { Request, Response } from 'express';
import { User } from '../models/User';
import { EmailService } from '../services/EmailService';

// Webhook to sync Clerk users to our DB
// NOTE: In production, you should verify the Clerk webhook signature
export const syncUser = async (req: Request, res: Response) => {
    try {
        const { type, data } = req.body;

        if (type === 'user.created' || type === 'user.updated') {
            const { id, email_addresses, first_name, last_name } = data;
            const email = email_addresses?.[0]?.email_address || `${id}@noemail.clerk`;
            const name = [first_name, last_name].filter(Boolean).join(' ') || 'User';

            await User.findOneAndUpdate(
                { clerkId: id },
                { clerkId: id, email, name },
                { upsert: true, new: true }
            );
            console.log(`User synced: ${email} (${name || 'No Name'})`);

            // Send welcome email for new users
            if (type === 'user.created' && email && !email.includes('@temp.clerk')) {
                await EmailService.sendWelcomeEmail(email, name || 'Developer');
            }
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
        let user = await User.findOne({ clerkId });

        if (!user) {
            user = await User.create({
                clerkId,
                email: `${clerkId}@temp.clerk`, // Placeholder until webhook syncs real email
                name: 'User'
            });
            console.log(`Auto-created user profile: ${clerkId}`);
        }

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Update user profile (currency, timezone, etc.)
export const updateProfile = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const { currency, country, timezone } = req.body;

        const validCurrencies = ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'AED'];
        if (currency && !validCurrencies.includes(currency)) {
            return res.status(400).json({ message: 'Invalid currency code' });
        }

        const updateData: any = {};
        if (currency) updateData.currency = currency;
        if (country) updateData.country = country;
        if (timezone) updateData.timezone = timezone;

        const user = await User.findOneAndUpdate(
            { clerkId },
            updateData,
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
