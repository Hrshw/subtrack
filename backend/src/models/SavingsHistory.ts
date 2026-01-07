import mongoose from 'mongoose';

const savingsHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    connectionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Connection',
        required: false // Null means aggregate for all accounts
    },
    totalSavings: {
        type: Number,
        default: 0
    },
    zombieCount: {
        type: Number,
        default: 0
    },
    activeCount: {
        type: Number,
        default: 0
    },
    serviceBreakdown: {
        type: Map,
        of: Number,
        default: {}
    }
}, { timestamps: true });

// Compound index: one entry per user per day per connection (or aggregate)
savingsHistorySchema.index({ userId: 1, connectionId: 1, date: 1 }, { unique: true });

// Index for efficient date range queries
savingsHistorySchema.index({ date: -1 });

export const SavingsHistory = mongoose.model('SavingsHistory', savingsHistorySchema);
