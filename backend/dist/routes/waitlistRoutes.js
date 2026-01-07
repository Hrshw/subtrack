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
const express_1 = __importDefault(require("express"));
const Waitlist_1 = require("../models/Waitlist");
const EmailService_1 = require("../services/EmailService");
const router = express_1.default.Router();
// Join waitlist
router.post('/join', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const { email, expectedSavings, userId } = req.body;
        // Check if already on waitlist
        const existing = yield Waitlist_1.Waitlist.findOne({ userId: clerkId });
        if (existing) {
            return res.status(400).json({
                message: 'Already on waitlist',
                position: existing.position
            });
        }
        // Get current count to determine position
        const count = yield Waitlist_1.Waitlist.countDocuments();
        const position = count + 1;
        // Create waitlist entry
        yield Waitlist_1.Waitlist.create({
            userId: clerkId,
            email,
            expectedSavings: expectedSavings || 0,
            position
        });
        console.log(`✅ User ${clerkId} joined waitlist at position #${position}`);
        // Send confirmation email
        if (email) {
            yield EmailService_1.EmailService.sendWaitlistEmail(email, position);
        }
        res.json({
            message: 'Successfully joined waitlist',
            position
        });
    }
    catch (error) {
        console.error('Waitlist join error:', error);
        res.status(500).json({ message: 'Failed to join waitlist', error });
    }
}));
// Get waitlist stats (admin)
router.get('/stats', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const total = yield Waitlist_1.Waitlist.countDocuments();
        const avgSavings = yield Waitlist_1.Waitlist.aggregate([
            {
                $group: {
                    _id: null,
                    average: { $avg: '$expectedSavings' },
                    total: { $sum: '$expectedSavings' }
                }
            }
        ]);
        res.json({
            totalUsers: total,
            averageSavings: ((_a = avgSavings[0]) === null || _a === void 0 ? void 0 : _a.average) || 0,
            totalExpectedSavings: ((_b = avgSavings[0]) === null || _b === void 0 ? void 0 : _b.total) || 0
        });
    }
    catch (error) {
        console.error('Waitlist stats error:', error);
        res.status(500).json({ message: 'Failed to fetch stats', error });
    }
}));
// Get user's position
router.get('/position', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const entry = yield Waitlist_1.Waitlist.findOne({ userId: clerkId });
        if (!entry) {
            return res.status(404).json({ message: 'Not on waitlist' });
        }
        res.json({
            position: entry.position,
            email: entry.email,
            createdAt: entry.createdAt
        });
    }
    catch (error) {
        console.error('Position fetch error:', error);
        res.status(500).json({ message: 'Failed to fetch position', error });
    }
}));
exports.default = router;
