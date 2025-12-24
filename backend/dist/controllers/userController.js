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
exports.getProfile = exports.syncUser = void 0;
const User_1 = require("../models/User");
// Webhook to sync Clerk users to our DB
// NOTE: In production, you should verify the Clerk webhook signature
const syncUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { type, data } = req.body;
        if (type === 'user.created' || type === 'user.updated') {
            const { id, email_addresses } = data;
            const email = (_a = email_addresses[0]) === null || _a === void 0 ? void 0 : _a.email_address;
            yield User_1.User.findOneAndUpdate({ clerkId: id }, { clerkId: id, email }, { upsert: true, new: true });
            console.log(`User synced: ${email}`);
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
        const user = yield User_1.User.findOne({ clerkId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
exports.getProfile = getProfile;
