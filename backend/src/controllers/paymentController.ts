import { Request, Response } from 'express';
import crypto from 'crypto';
import { PolarService } from '../services/PolarService';
import { User } from '../models/User';

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const POLAR_WEBHOOK_SECRET = process.env.POLAR_WEBHOOK_SECRET || '';

export const createPaymentSession = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const { plan = 'annual' } = req.body; // 'monthly' or 'annual'

        let user = await User.findOne({ clerkId });

        if (!user) {
            user = await User.create({
                clerkId,
                email: `${clerkId}@temp.clerk`,
                name: 'User'
            });
            console.log(`Auto-created user for payment: ${clerkId}`);
        }

        const { checkoutUrl, checkoutId } = await PolarService.createCheckoutSession(
            user._id.toString(),
            user.email,
            plan
        );

        res.json({ checkoutUrl, checkoutId });
    } catch (error) {
        console.error('Payment session creation error:', error);
        res.status(500).json({ message: 'Error creating payment session' });
    }
};

// Standard Webhooks signature verification
function verifyWebhookSignature(payload: string, headers: Record<string, any>, secret: string): boolean {
    try {
        // Standard Webhooks uses these headers
        const webhookId = headers['webhook-id'];
        const webhookTimestamp = headers['webhook-timestamp'];
        const webhookSignature = headers['webhook-signature'];

        if (!webhookId || !webhookTimestamp || !webhookSignature) {
            console.log('� Webhook headers present:', Object.keys(headers).filter(h => h.toLowerCase().includes('webhook')));
            return false;
        }

        // Verify timestamp is not too old (5 minutes tolerance)
        const timestamp = parseInt(webhookTimestamp);
        const now = Math.floor(Date.now() / 1000);
        if (Math.abs(now - timestamp) > 300) {
            console.error('❌ Webhook timestamp too old');
            return false;
        }

        // Calculate expected signature
        const signedPayload = `${webhookId}.${webhookTimestamp}.${payload}`;
        const expectedSignature = crypto
            .createHmac('sha256', Buffer.from(secret.split('_').pop() || secret, 'base64'))
            .update(signedPayload)
            .digest('base64');

        // webhook-signature can contain multiple signatures (v1,signature1 v1,signature2)
        const signatures = webhookSignature.split(' ');
        for (const sig of signatures) {
            const [version, signature] = sig.split(',');
            if (version === 'v1' && signature === expectedSignature) {
                return true;
            }
        }

        return false;
    } catch (error) {
        console.error('Signature verification error:', error);
        return false;
    }
}

export const handlePolarWebhook = async (req: Request, res: Response) => {
    try {
        // Get raw body for signature verification
        const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

        // Log incoming webhook for debugging
        const webhookHeaders = Object.keys(req.headers).filter(h =>
            h.toLowerCase().includes('webhook') ||
            h.toLowerCase().includes('polar') ||
            h.toLowerCase().includes('signature')
        );
        console.log('📨 Webhook received');
        console.log('   Relevant headers:', webhookHeaders);

        // Verify webhook signature if secret is configured
        let verified = false;
        if (POLAR_WEBHOOK_SECRET) {
            verified = verifyWebhookSignature(rawBody, req.headers, POLAR_WEBHOOK_SECRET);
            if (verified) {
                console.log('✅ Webhook signature verified');
            } else {
                console.log('⚠️ Webhook signature verification failed - processing anyway for debugging');
            }
        } else {
            console.log('⚠️ No webhook secret configured');
        }

        // Parse payload
        const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const eventType = payload.type;

        console.log(`📨 Processing Polar webhook: ${eventType}`);
        console.log('   Data keys:', Object.keys(payload.data || {}));

        switch (eventType) {
            case 'checkout.created':
            case 'checkout.updated':
                console.log(`ℹ️ Checkout status: ${payload.data?.status}`);
                break;

            case 'subscription.created':
            case 'subscription.active':
                console.log('🎉 Subscription activated, upgrading user...');
                await PolarService.handleCheckoutCompleted(payload);
                break;

            case 'subscription.updated':
                console.log('🔄 Subscription updated');
                await PolarService.handleSubscriptionUpdated(payload);
                break;

            case 'subscription.canceled':
                console.log('⚠️ Subscription cancelled');
                await PolarService.handleSubscriptionCancelled(payload);
                break;

            case 'order.created':
            case 'order.paid':
                console.log('💰 Order event:', eventType);
                // Order events can also trigger upgrades
                if (payload.data?.subscription) {
                    await PolarService.handleCheckoutCompleted(payload);
                }
                break;

            default:
                console.log(`ℹ️ Unhandled webhook event: ${eventType}`);
        }

        res.status(200).json({ received: true });

    } catch (error) {
        console.error('Webhook handling error:', error);
        res.status(500).json({ message: 'Webhook processing failed' });
    }
};

export const handlePaymentSuccess = async (req: Request, res: Response) => {
    const { session_id } = req.query;
    console.log(`✅ Payment success redirect, session: ${session_id}`);
    res.redirect(`${CLIENT_URL}/payment/success?session_id=${session_id}`);
};

export const getSubscriptionStatus = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const user = await User.findOne({ clerkId });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            subscriptionStatus: user.subscriptionStatus,
            plan: user.plan,
            subscriptionEndDate: user.subscriptionEndDate,
            isActive: user.subscriptionStatus === 'pro'
        });

    } catch (error) {
        console.error('Error fetching subscription status:', error);
        res.status(500).json({ message: 'Error fetching subscription status' });
    }
};

// Manual sync endpoint for when webhooks fail
export const syncSubscription = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const user = await User.findOne({ clerkId });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.subscriptionId) {
            const subscription = await PolarService.getSubscriptionStatus(user.subscriptionId);
            if (subscription && subscription.status === 'active') {
                await User.findByIdAndUpdate(user._id, {
                    subscriptionStatus: 'pro',
                    subscriptionStartDate: new Date(subscription.current_period_start),
                    subscriptionEndDate: new Date(subscription.current_period_end)
                });
                return res.json({ message: 'Subscription synced', status: 'pro' });
            }
        }

        res.json({ message: 'No active subscription found', status: user.subscriptionStatus });

    } catch (error) {
        console.error('Error syncing subscription:', error);
        res.status(500).json({ message: 'Error syncing subscription' });
    }
};

// Admin endpoint to manually upgrade user (for fixing webhook failures)
export const manualUpgrade = async (req: Request, res: Response) => {
    try {
        const { email, plan = 'monthly', endDate } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email required' });
        }

        const user = await User.findOneAndUpdate(
            { email },
            {
                subscriptionStatus: 'pro',
                plan,
                subscriptionStartDate: new Date(),
                subscriptionEndDate: endDate ? new Date(endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                renewalReminderSent: false
            },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        console.log(`🔧 Manual upgrade for ${email} to ${plan}`);
        res.json({ message: 'User upgraded', user: { email: user.email, status: user.subscriptionStatus } });

    } catch (error) {
        console.error('Manual upgrade error:', error);
        res.status(500).json({ message: 'Upgrade failed' });
    }
};
