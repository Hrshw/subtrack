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
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleWebhook = exports.createCheckoutSession = void 0;
const StripeService_1 = require("../services/StripeService");
const User_1 = require("../models/User");
const createCheckoutSession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const user = yield User_1.User.findOne({ clerkId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const session = yield StripeService_1.StripeService.createCheckoutSession(user._id.toString(), user.email);
        res.json({ url: session.url });
    }
    catch (error) {
        console.error('Stripe error:', error);
        res.status(500).json({ message: 'Error creating checkout session' });
    }
});
exports.createCheckoutSession = createCheckoutSession;
const handleWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const sig = req.headers['stripe-signature'];
    try {
        if (!sig)
            throw new Error('No signature');
        // Use raw body for webhook verification - Express needs to be configured for this
        yield StripeService_1.StripeService.handleWebhook(sig, req.body);
        res.json({ received: true });
    }
    catch (error) {
        console.error('Webhook error:', error);
        res.status(400).send(`Webhook Error: ${error}`);
    }
});
exports.handleWebhook = handleWebhook;
