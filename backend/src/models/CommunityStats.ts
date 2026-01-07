import mongoose from 'mongoose';

const communityStatsSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        unique: true
    },
    totalSavings: {
        type: Number,
        default: 0
    },
    totalUsers: {
        type: Number,
        default: 0
    },
    totalZombiesKilled: {
        type: Number,
        default: 0
    },
    totalScans: {
        type: Number,
        default: 0
    },
    topServices: [{
        service: String,
        savings: Number
    }]
}, { timestamps: true });

// Index for date queries
communityStatsSchema.index({ date: -1 });

export const CommunityStats = mongoose.model('CommunityStats', communityStatsSchema);
