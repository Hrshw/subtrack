import axios from 'axios';
import { User } from '../models/User';
import { Transaction } from '../models/Transaction';

const POLAR_API_URL = process.env.POLAR_API_URL || 'https://api.polar.sh/v1';
const POLAR_ACCESS_TOKEN = process.env.POLAR_ACCESS_TOKEN || '';
const POLAR_MONTHLY_PRODUCT_ID = process.env.POLAR_MONTHLY_PRODUCT_ID || '';
const POLAR_ANNUAL_PRODUCT_ID = process.env.POLAR_ANNUAL_PRODUCT_ID || '';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

interface PolarCheckoutResponse {
    id: string;
    url: string;
    status: string;
    expires_at: string;
    customer_email?: string;
    metadata?: Record<string, string>;
}

interface PolarWebhookPayload {
    type: string;
    data: {
        id: string;
        customer_id?: string;
        customer?: {
            id: string;
            email: string;
            external_id?: string;
        };
        subscription?: {
            id: string;
            status: string;
            current_period_start: string;
            current_period_end: string;
            product_id: string;
        };
        metadata?: Record<string, string>;
    };
}

export class PolarService {
    private static headers = {
        'Authorization': `Bearer ${POLAR_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
    };

    /**
     * Create a Polar checkout session
     * Returns the checkout URL for redirect
     */
    static async createCheckoutSession(
        userId: string,
        userEmail: string,
        plan: 'monthly' | 'annual' = 'annual'
    ): Promise<{ checkoutUrl: string; checkoutId: string }> {
        try {
            const user = await User.findById(userId);
            if (!user) throw new Error('User not found');

            const productId = plan === 'annual'
                ? POLAR_ANNUAL_PRODUCT_ID
                : POLAR_MONTHLY_PRODUCT_ID;

            const response = await axios.post<PolarCheckoutResponse>(
                `${POLAR_API_URL}/checkouts`,
                {
                    products: [productId],
                    customer_email: userEmail,
                    customer_external_id: userId, // Link to our user
                    success_url: `${CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
                    metadata: {
                        userId,
                        plan,
                        source: 'subtrack'
                    }
                },
                { headers: this.headers }
            );

            const checkout = response.data;

            console.log(`💳 Polar checkout created for user ${userId}`);
            console.log(`   Plan: ${plan}, Checkout ID: ${checkout.id}`);

            // Log initial pending transaction
            await Transaction.create({
                userId,
                txnid: checkout.id,
                amount: plan === 'annual' ? 99 : 9,
                plan,
                status: 'pending',
                paymentGateway: 'Polar'
            });

            return {
                checkoutUrl: checkout.url,
                checkoutId: checkout.id
            };

        } catch (error: any) {
            console.error('Polar checkout creation failed:', error.response?.data || error.message);
            throw new Error('Failed to create checkout session');
        }
    }

    /**
     * Handle successful checkout webhook
     * Upgrade user to Pro
     */
    static async handleCheckoutCompleted(payload: any) {
        try {
            const { data } = payload;

            console.log('📦 Webhook payload structure:');
            console.log('   Event type:', payload.type);
            console.log('   Data keys:', Object.keys(data || {}));

            // Try to get userId from metadata first
            let userId = data.metadata?.userId;
            let plan = data.metadata?.plan as 'monthly' | 'annual';

            // Get customer info
            const customerId = data.customer_id || data.customer?.id;
            const customerEmail = data.customer?.email || data.customer_email;
            const customerExternalId = data.customer?.external_id || data.customer_external_id;

            // Get subscription info - it might be nested differently
            const subscription = data.subscription || data;
            const subscriptionId = subscription.id || data.subscription_id;
            const periodStart = subscription.current_period_start || subscription.started_at;
            const periodEnd = subscription.current_period_end || subscription.ends_at;

            console.log('   Customer ID:', customerId);
            console.log('   Customer Email:', customerEmail);
            console.log('   Customer External ID:', customerExternalId);
            console.log('   Subscription ID:', subscriptionId);
            console.log('   User ID from metadata:', userId);

            // Find user by various methods
            let user = null;

            if (userId) {
                user = await User.findById(userId);
            }

            if (!user && customerExternalId) {
                // customerExternalId should be our MongoDB user ID
                user = await User.findById(customerExternalId);
            }

            if (!user && customerEmail) {
                // Fallback: find by email
                user = await User.findOne({ email: customerEmail });
            }

            if (!user) {
                console.error('❌ Could not find user for subscription');
                console.error('   Tried userId:', userId);
                console.error('   Tried externalId:', customerExternalId);
                console.error('   Tried email:', customerEmail);
                return;
            }

            console.log('✅ Found user:', user._id);

            // Determine plan from product if not in metadata
            if (!plan) {
                const productId = data.product_id || subscription.product_id;
                if (productId === POLAR_ANNUAL_PRODUCT_ID) {
                    plan = 'annual';
                } else {
                    plan = 'monthly';
                }
            }

            // Update user to Pro with subscription details
            const updatedUser = await User.findByIdAndUpdate(
                user._id,
                {
                    subscriptionStatus: 'pro',
                    polarCustomerId: customerId,
                    subscriptionId: subscriptionId,
                    subscriptionStartDate: periodStart ? new Date(periodStart) : new Date(),
                    subscriptionEndDate: periodEnd ? new Date(periodEnd) : null,
                    plan,
                    renewalReminderSent: false
                },
                { new: true }
            );

            console.log(`🎉 User ${user._id} upgraded to Pro via Polar!`);
            console.log(`   Plan: ${plan}, Subscription ID: ${subscriptionId}`);
            console.log(`   Period: ${periodStart} to ${periodEnd}`);

            // Update transaction if exists
            await Transaction.findOneAndUpdate(
                { userId: user._id.toString(), status: 'pending' },
                {
                    status: 'success',
                    polarSubscriptionId: subscriptionId,
                    rawResponse: data
                }
            );

            return updatedUser;

        } catch (error) {
            console.error('Failed to handle checkout completed:', error);
            throw error;
        }
    }


    /**
     * Handle subscription updated webhook
     * Updates subscription dates on renewal
     */
    static async handleSubscriptionUpdated(payload: PolarWebhookPayload) {
        try {
            const { data } = payload;
            const subscription = data.subscription || data;

            // Find user by Polar customer ID or external ID
            const user = await User.findOne({
                $or: [
                    { polarCustomerId: data.customer?.id },
                    { _id: data.customer?.external_id }
                ]
            });

            if (!user) {
                console.log('⚠️ No user found for subscription update');
                return;
            }

            // Update subscription dates
            await User.findByIdAndUpdate(user._id, {
                subscriptionStartDate: new Date((subscription as any).current_period_start),
                subscriptionEndDate: new Date((subscription as any).current_period_end),
                renewalReminderSent: false // Reset reminder flag on renewal
            });

            console.log(`🔄 Subscription updated for user ${user._id}`);

        } catch (error) {
            console.error('Failed to handle subscription update:', error);
        }
    }

    /**
     * Handle subscription cancelled webhook
     */
    static async handleSubscriptionCancelled(payload: PolarWebhookPayload) {
        try {
            const { data } = payload;

            const user = await User.findOne({
                $or: [
                    { polarCustomerId: data.customer?.id },
                    { subscriptionId: (data as any).id }
                ]
            });

            if (!user) {
                console.log('⚠️ No user found for subscription cancellation');
                return;
            }

            // Mark as cancelled but keep Pro until period ends
            console.log(`⚠️ Subscription cancelled for user ${user._id}`);
            // User stays Pro until subscriptionEndDate passes

        } catch (error) {
            console.error('Failed to handle subscription cancellation:', error);
        }
    }

    /**
     * Get subscription status from Polar
     */
    static async getSubscriptionStatus(subscriptionId: string) {
        try {
            const response = await axios.get(
                `${POLAR_API_URL}/subscriptions/${subscriptionId}`,
                { headers: this.headers }
            );
            return response.data;
        } catch (error: any) {
            console.error('Failed to get subscription:', error.response?.data || error.message);
            return null;
        }
    }
}
