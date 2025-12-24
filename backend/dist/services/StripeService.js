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
exports.StripeService = void 0;
const stripe_1 = __importDefault(require("stripe"));
const User_1 = require("../models/User");
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-11-17.clover',
});
class StripeService {
    static createCheckoutSession(userId, email) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = yield stripe.checkout.sessions.create({
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
        });
    }
    static handleWebhook(signature, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const event = stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET || '');
            if (event.type === 'checkout.session.completed') {
                const session = event.data.object;
                const userId = (_a = session.metadata) === null || _a === void 0 ? void 0 : _a.userId;
                if (userId) {
                    yield User_1.User.findByIdAndUpdate(userId, {
                        subscriptionStatus: 'pro',
                        stripeCustomerId: session.customer,
                    });
                    console.log(`User ${userId} upgraded to Pro`);
                }
            }
            return event;
        });
    }
}
exports.StripeService = StripeService;
