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
exports.updateProfile = exports.getProfile = exports.syncUser = void 0;
const User_1 = require("../models/User");
const EmailService_1 = require("../services/EmailService");
// Webhook to sync Clerk users to our DB
// NOTE: In production, you should verify the Clerk webhook signature
const syncUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { type, data } = req.body;
        if (type === 'user.created' || type === 'user.updated') {
            const { id, email_addresses, first_name, last_name } = data;
            const email = ((_a = email_addresses === null || email_addresses === void 0 ? void 0 : email_addresses[0]) === null || _a === void 0 ? void 0 : _a.email_address) || `${id}@noemail.clerk`;
            const name = [first_name, last_name].filter(Boolean).join(' ') || 'User';
            yield User_1.User.findOneAndUpdate({ clerkId: id }, { clerkId: id, email, name }, { upsert: true, new: true });
            console.log(`User synced: ${email} (${name || 'No Name'})`);
            // Send welcome email for new users
            if (type === 'user.created' && email && !email.includes('@temp.clerk')) {
                yield EmailService_1.EmailService.sendWelcomeEmail(email, name || 'Developer');
            }
        }
        res.status(200).json({ success: true });
    }
    catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ message: 'Webhook error' });
    }
});
exports.syncUser = syncUser;
// Get current user profile
const getProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        let user = yield User_1.User.findOne({ clerkId });
        if (!user) {
            user = yield User_1.User.create({
                clerkId,
                email: `${clerkId}@temp.clerk`, // Placeholder until webhook syncs real email
                name: 'User'
            });
            console.log(`Auto-created user profile: ${clerkId}`);
        }
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getProfile = getProfile;
// Update user profile (currency, timezone, etc.)
const updateProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const { currency, country, timezone } = req.body;
        const validCurrencies = ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'AED'];
        if (currency && !validCurrencies.includes(currency)) {
            return res.status(400).json({ message: 'Invalid currency code' });
        }
        const updateData = {};
        if (currency)
            updateData.currency = currency;
        if (country)
            updateData.country = country;
        if (timezone)
            updateData.timezone = timezone;
        const user = yield User_1.User.findOneAndUpdate({ clerkId }, updateData, { new: true });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    }
    catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
exports.updateProfile = updateProfile;
