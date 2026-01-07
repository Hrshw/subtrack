"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PolarService = void 0;
const axios_1 = __importDefault(require("axios"));
const User_1 = require("../models/User");
const Transaction_1 = require("../models/Transaction");
const POLAR_API_URL = process.env.POLAR_API_URL || 'https://api.polar.sh/v1';
const POLAR_ACCESS_TOKEN = process.env.POLAR_ACCESS_TOKEN || '';
const POLAR_MONTHLY_PRODUCT_ID = process.env.POLAR_MONTHLY_PRODUCT_ID || '';
const POLAR_ANNUAL_PRODUCT_ID = process.env.POLAR_ANNUAL_PRODUCT_ID || '';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
class PolarService {
    /**
     * Create a Polar checkout session
     * Returns the checkout URL for redirect
     */
    static createCheckoutSession(userId_1, userEmail_1) {
        return __awaiter(this, arguments, void 0, function* (userId, userEmail, plan = 'annual') {
            var _a;
            try {
                const user = yield User_1.User.findById(userId);
                if (!user)
                    throw new Error('User not found');
                const productId = plan === 'annual'
                    ? POLAR_ANNUAL_PRODUCT_ID
                    : POLAR_MONTHLY_PRODUCT_ID;
                const response = yield axios_1.default.post(`${POLAR_API_URL}/checkouts`, {
                    products: [productId],
                    customer_email: userEmail,
                    customer_external_id: userId, // Link to our user
                    success_url: `${CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
                    metadata: {
                        userId,
                        plan,
                        source: 'subtrack'
                    }
                }, { headers: this.headers });
                const checkout = response.data;
                console.log(`💳 Polar checkout created for user ${userId}`);
                console.log(`   Plan: ${plan}, Checkout ID: ${checkout.id}`);
                // Log initial pending transaction
                yield Transaction_1.Transaction.create({
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
            }
            catch (error) {
                console.error('Polar checkout creation failed:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw new Error('Failed to create checkout session');
            }
        });
    }
    /**
     * Handle successful checkout webhook
     * Upgrade user to Pro
     */
    static handleCheckoutCompleted(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e;
            try {
                const { data } = payload;
                console.log('📦 Webhook payload structure:');
                console.log('   Event type:', payload.type);
                console.log('   Data keys:', Object.keys(data || {}));
                // Try to get userId from metadata first
                let userId = (_a = data.metadata) === null || _a === void 0 ? void 0 : _a.userId;
                let plan = (_b = data.metadata) === null || _b === void 0 ? void 0 : _b.plan;
                // Get customer info
                const customerId = data.customer_id || ((_c = data.customer) === null || _c === void 0 ? void 0 : _c.id);
                const customerEmail = ((_d = data.customer) === null || _d === void 0 ? void 0 : _d.email) || data.customer_email;
                const customerExternalId = ((_e = data.customer) === null || _e === void 0 ? void 0 : _e.external_id) || data.customer_external_id;
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
                    user = yield User_1.User.findById(userId);
                }
                if (!user && customerExternalId) {
                    // customerExternalId should be our MongoDB user ID
                    user = yield User_1.User.findById(customerExternalId);
                }
                if (!user && customerEmail) {
                    // Fallback: find by email
                    user = yield User_1.User.findOne({ email: customerEmail });
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
                    }
                    else {
                        plan = 'monthly';
                    }
                }
                // Update user to Pro with subscription details
                const updatedUser = yield User_1.User.findByIdAndUpdate(user._id, {
                    subscriptionStatus: 'pro',
                    polarCustomerId: customerId,
                    subscriptionId: subscriptionId,
                    subscriptionStartDate: periodStart ? new Date(periodStart) : new Date(),
                    subscriptionEndDate: periodEnd ? new Date(periodEnd) : null,
                    plan,
                    renewalReminderSent: false
                }, { new: true });
                console.log(`🎉 User ${user._id} upgraded to Pro via Polar!`);
                console.log(`   Plan: ${plan}, Subscription ID: ${subscriptionId}`);
                console.log(`   Period: ${periodStart} to ${periodEnd}`);
                // Update transaction if exists
                yield Transaction_1.Transaction.findOneAndUpdate({ userId: user._id.toString(), status: 'pending' }, {
                    status: 'success',
                    polarSubscriptionId: subscriptionId,
                    rawResponse: data
                });
                return updatedUser;
            }
            catch (error) {
                console.error('Failed to handle checkout completed:', error);
                throw error;
            }
        });
    }
    /**
     * Handle subscription updated webhook
     * Updates subscription dates on renewal
     */
    static handleSubscriptionUpdated(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const { data } = payload;
                const subscription = data.subscription || data;
                // Find user by Polar customer ID or external ID
                const user = yield User_1.User.findOne({
                    $or: [
                        { polarCustomerId: (_a = data.customer) === null || _a === void 0 ? void 0 : _a.id },
                        { _id: (_b = data.customer) === null || _b === void 0 ? void 0 : _b.external_id }
                    ]
                });
                if (!user) {
                    console.log('⚠️ No user found for subscription update');
                    return;
                }
                // Update subscription dates
                yield User_1.User.findByIdAndUpdate(user._id, {
                    subscriptionStartDate: new Date(subscription.current_period_start),
                    subscriptionEndDate: new Date(subscription.current_period_end),
                    renewalReminderSent: false // Reset reminder flag on renewal
                });
                console.log(`🔄 Subscription updated for user ${user._id}`);
            }
            catch (error) {
                console.error('Failed to handle subscription update:', error);
            }
        });
    }
    /**
     * Handle subscription cancelled webhook
     */
    static handleSubscriptionCancelled(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { data } = payload;
                const user = yield User_1.User.findOne({
                    $or: [
                        { polarCustomerId: (_a = data.customer) === null || _a === void 0 ? void 0 : _a.id },
                        { subscriptionId: data.id }
                    ]
                });
                if (!user) {
                    console.log('⚠️ No user found for subscription cancellation');
                    return;
                }
                // Mark as cancelled but keep Pro until period ends
                console.log(`⚠️ Subscription cancelled for user ${user._id}`);
                // User stays Pro until subscriptionEndDate passes
            }
            catch (error) {
                console.error('Failed to handle subscription cancellation:', error);
            }
        });
    }
    /**
     * Get subscription status from Polar
     */
    static getSubscriptionStatus(subscriptionId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const response = yield axios_1.default.get(`${POLAR_API_URL}/subscriptions/${subscriptionId}`, { headers: this.headers });
                return response.data;
            }
            catch (error) {
                console.error('Failed to get subscription:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                return null;
            }
        });
    }
}
exports.PolarService = PolarService;
PolarService.headers = {
    'Authorization': `Bearer ${POLAR_ACCESS_TOKEN}`,
    'Content-Type': 'application/json'
};
