import mongoose from 'mongoose';
import crypto from 'crypto';

const referralSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
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
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
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
    return crypto.randomBytes(4).toString('hex').toUpperCase();
};

export const Referral = mongoose.model('Referral', referralSchema);
