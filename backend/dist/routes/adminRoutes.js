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
const Feedback_1 = require("../models/Feedback");
const Waitlist_1 = require("../models/Waitlist");
const User_1 = require("../models/User");
const router = express_1.default.Router();
// Get all feedback and waitlist entries (Admin only - typically you'd add middleware here)
// For now, we'll keep it open or assume the frontend handles basic role checking
router.get('/stats', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const [feedbacks, waitlist, users] = yield Promise.all([
            Feedback_1.Feedback.find().sort({ createdAt: -1 }),
            Waitlist_1.Waitlist.find().sort({ createdAt: -1 }),
            User_1.User.countDocuments()
        ]);
        res.status(200).json({
            feedbacks,
            waitlist,
            userCount: users
        });
    }
    catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ message: 'Failed to fetch admin stats' });
    }
}));
// Update feedback status
router.patch('/feedback/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status } = req.body;
        const feedback = yield Feedback_1.Feedback.findByIdAndUpdate(req.params.id, { status }, { new: true });
        res.status(200).json(feedback);
    }
    catch (error) {
        res.status(500).json({ message: 'Failed to update feedback' });
    }
}));
exports.default = router;
