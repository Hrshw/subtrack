import Stripe from 'stripe';
import { User } from '../models/User';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-11-17.clover' as any,
});

export class StripeService {
    static async createCheckoutSession(userId: string, email: string) {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'inr',
                        product_data: {
                            name: 'SubTrack Pro',
                            description: 'Unlimited connections, weekly auto-scans, CSV export',
                        },
                        unit_amount: 79900, // ₹799.00
                        recurring: {
                            interval: 'month',
                        },
                    },
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${process.env.CLIENT_URL}/dashboard?success=true`,
            cancel_url: `${process.env.CLIENT_URL}/dashboard?canceled=true`,
            customer_email: email,
            metadata: {
                userId,
            },
        });

        return session;
    }

    static async handleWebhook(signature: string, payload: Buffer) {
        const event = stripe.webhooks.constructEvent(
            payload,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET || ''
        );

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session;
            const userId = session.metadata?.userId;

            if (userId) {
                await User.findByIdAndUpdate(userId, {
                    subscriptionStatus: 'pro',
                    stripeCustomerId: session.customer as string,
                });
                console.log(`User ${userId} upgraded to Pro`);
            }
        }

        return event;
    }
}
