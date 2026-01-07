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
exports.ReferralService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const Referral_1 = require("../models/Referral");
const User_1 = require("../models/User");
const Connection_1 = require("../models/Connection");
const REQUIRED_SERVICES_FOR_REWARD = 3;
const FREE_MONTHS_PER_REFERRAL = 1;
class ReferralService {
    /**
     * Get or create referral code for a user
     */
    static getOrCreateReferralCode(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            let referral = yield Referral_1.Referral.findOne({ userId });
            if (!referral) {
                // Generate unique code
                let code;
                let attempts = 0;
                do {
                    code = crypto_1.default.randomBytes(4).toString('hex').toUpperCase();
                    const existing = yield Referral_1.Referral.findOne({ referralCode: code });
                    if (!existing)
                        break;
                    attempts++;
                } while (attempts < 10);
                referral = yield Referral_1.Referral.create({
                    userId,
                    referralCode: code,
                    referredUsers: [],
                    totalRewardsEarned: 0,
                    totalReferrals: 0
                });
            }
            return referral.referralCode;
        });
    }
    /**
     * Apply a referral code during signup
     */
    static applyReferralCode(newUserId, newUserEmail, code) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const referral = yield Referral_1.Referral.findOne({ referralCode: code.toUpperCase() });
                if (!referral) {
                    return { success: false, message: 'Invalid referral code' };
                }
                // Check if user already referred
                const alreadyReferred = referral.referredUsers.some((r) => { var _a; return ((_a = r.userId) === null || _a === void 0 ? void 0 : _a.toString()) === newUserId || r.email === newUserEmail; });
                if (alreadyReferred) {
                    return { success: false, message: 'Already referred by this code' };
                }
                // Can't refer yourself
                if (referral.userId.toString() === newUserId) {
                    return { success: false, message: 'Cannot use your own referral code' };
                }
                // Add to referred users list
                referral.referredUsers.push({
                    userId: newUserId,
                    email: newUserEmail,
                    connectedServices: 0,
                    qualifiedAt: null,
                    rewardApplied: false
                });
                referral.totalReferrals++;
                yield referral.save();
                console.log(`🎉 User ${newUserEmail} signed up with referral code ${code}`);
                return { success: true, message: 'Referral code applied! Connect 3 services to unlock rewards.' };
            }
            catch (error) {
                console.error('Referral code application failed:', error);
                return { success: false, message: 'Failed to apply referral code' };
            }
        });
    }
    /**
     * Check if a referred user qualifies for reward (3+ services connected)
     */
    static checkAndApplyReward(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Count user's connections
                const connectionCount = yield Connection_1.Connection.countDocuments({
                    userId,
                    status: 'active'
                });
                if (connectionCount < REQUIRED_SERVICES_FOR_REWARD)
                    return;
                // Find the referral where this user was referred
                const referral = yield Referral_1.Referral.findOne({
                    'referredUsers.userId': userId,
                    'referredUsers.rewardApplied': false
                });
                if (!referral)
                    return;
                // Update the referred user entry
                const referredUserIndex = referral.referredUsers.findIndex((r) => { var _a; return ((_a = r.userId) === null || _a === void 0 ? void 0 : _a.toString()) === userId && !r.rewardApplied; });
                if (referredUserIndex === -1)
                    return;
                referral.referredUsers[referredUserIndex].connectedServices = connectionCount;
                referral.referredUsers[referredUserIndex].qualifiedAt = new Date();
                referral.referredUsers[referredUserIndex].rewardApplied = true;
                referral.totalRewardsEarned += FREE_MONTHS_PER_REFERRAL;
                yield referral.save();
                // Grant the referrer a free month (extend their subscription)
                const referrer = yield User_1.User.findById(referral.userId);
                if (referrer) {
                    // If they're free, upgrade to pro for 1 month
                    // If already pro, this could extend their subscription
                    // For simplicity, we'll just log it - full implementation would need subscription dates
                    console.log(`🎁 Referrer ${referrer.email} earned ${FREE_MONTHS_PER_REFERRAL} free month(s)!`);
                    // TODO: Implement subscription extension logic
                    // This would require adding subscriptionEndDate to User model
                }
            }
            catch (error) {
                console.error('Referral reward check failed:', error);
            }
        });
    }
    /**
     * Get referral stats for a user
     */
    static getReferralStats(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const referral = yield Referral_1.Referral.findOne({ userId });
            if (!referral) {
                return {
                    code: yield this.getOrCreateReferralCode(userId),
                    totalReferrals: 0,
                    pendingReferrals: 0,
                    qualifiedReferrals: 0,
                    rewardsEarned: 0
                };
            }
            const qualified = referral.referredUsers.filter((r) => r.rewardApplied).length;
            const pending = referral.referredUsers.length - qualified;
            return {
                code: referral.referralCode,
                totalReferrals: referral.totalReferrals,
                pendingReferrals: pending,
                qualifiedReferrals: qualified,
                rewardsEarned: referral.totalRewardsEarned
            };
        });
    }
}
exports.ReferralService = ReferralService;
