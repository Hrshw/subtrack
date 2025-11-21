import mongoose from 'mongoose';

const robotChatCacheSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lastMessage: { type: String, required: true },
    timestamp: { type: Date, required: true },
    isPro: { type: Boolean, default: false },
    messageCount: { type: Number, default: 0 }, // Track messages in current session
    lastResetAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Index for fast lookups
robotChatCacheSchema.index({ userId: 1 });

export const RobotChatCache = mongoose.model('RobotChatCache', robotChatCacheSchema);
