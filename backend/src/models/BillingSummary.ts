import mongoose from 'mongoose';

const billingSummarySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    connectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Connection', required: true },
    provider: { type: String, required: true },
    billingPeriod: { type: String, required: true }, // e.g., "2023-11"
    totalCost: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    breakdown: { type: mongoose.Schema.Types.Mixed }, // Store per-service costs
    fetchedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// One entry per user+connection+month
billingSummarySchema.index({ connectionId: 1, billingPeriod: 1 }, { unique: true });

export const BillingSummary = mongoose.model('BillingSummary', billingSummarySchema);
