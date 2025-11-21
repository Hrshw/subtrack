import { Request, Response } from 'express';
import { StripeService } from '../services/StripeService';
import { User } from '../models/User';

export const createCheckoutSession = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const user = await User.findOne({ clerkId });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const session = await StripeService.createCheckoutSession(user._id.toString(), user.email);
        res.json({ url: session.url });
    } catch (error) {
        console.error('Stripe error:', error);
        res.status(500).json({ message: 'Error creating checkout session' });
    }
};

export const handleWebhook = async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'];

    try {
        if (!sig) throw new Error('No signature');
        // Use raw body for webhook verification - Express needs to be configured for this
        await StripeService.handleWebhook(sig as string, req.body);
        res.json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(400).send(`Webhook Error: ${error}`);
    }
};
