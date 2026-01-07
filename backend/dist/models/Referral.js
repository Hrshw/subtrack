"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Referral = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const crypto_1 = __importDefault(require("crypto"));
const referralSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    referralCode: {
        type: String,
        required: true,
        unique: true
    },
    referredUsers: [{
            userId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User' },
            email: String,
            connectedServices: { type: Number, default: 0 },
            qualifiedAt: Date, // Date when they connected 3+ services
            rewardApplied: { type: Boolean, default: false }
        }],
    totalRewardsEarned: {
        type: Number,
        default: 0 // Total free months earned
    },
    totalReferrals: {
        type: Number,
        default: 0
    }
}, { timestamps: true });
// Generate unique referral code
referralSchema.statics.generateCode = function () {
    return crypto_1.default.randomBytes(4).toString('hex').toUpperCase();
};
exports.Referral = mongoose_1.default.model('Referral', referralSchema);
