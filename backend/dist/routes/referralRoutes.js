"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const auth_1 = require("../middleware/auth");
const ReferralService_1 = require("../services/ReferralService");
const User_1 = require("../models/User");
const router = express_1.default.Router();
/**
 * Get or create referral code
 */
router.get('/code', auth_1.requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const user = yield User_1.User.findOne({ clerkId });
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        const code = yield ReferralService_1.ReferralService.getOrCreateReferralCode(user._id.toString());
        res.json({ code });
    }
    catch (error) {
        console.error('Get referral code error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
}));
/**
 * Get referral stats
 */
router.get('/stats', auth_1.requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const user = yield User_1.User.findOne({ clerkId });
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        const stats = yield ReferralService_1.ReferralService.getReferralStats(user._id.toString());
        res.json(stats);
    }
    catch (error) {
        console.error('Get referral stats error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
}));
/**
 * Apply referral code (during signup)
 */
router.post('/apply', auth_1.requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const { code } = req.body;
        if (!code) {
            return res.status(400).json({ message: 'Referral code is required' });
        }
        const user = yield User_1.User.findOne({ clerkId });
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        const result = yield ReferralService_1.ReferralService.applyReferralCode(user._id.toString(), user.email, code);
        res.json(result);
    }
    catch (error) {
        console.error('Apply referral code error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
}));
/**
 * Validate referral code (public - for showing on signup page)
 */
router.get('/validate/:code', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { code } = req.params;
        const { Referral } = yield Promise.resolve().then(() => __importStar(require('../models/Referral')));
        const referral = yield Referral.findOne({ referralCode: code.toUpperCase() });
        if (!referral) {
            return res.json({ valid: false, message: 'Invalid referral code' });
        }
        const user = yield User_1.User.findById(referral.userId);
        const referrerName = ((_a = user === null || user === void 0 ? void 0 : user.email) === null || _a === void 0 ? void 0 : _a.split('@')[0]) || 'A friend';
        res.json({
            valid: true,
            message: `Referred by ${referrerName}! Connect 3 services to unlock rewards.`
        });
    }
    catch (error) {
        console.error('Validate referral code error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
}));
exports.default = router;
