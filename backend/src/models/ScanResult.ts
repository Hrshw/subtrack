import mongoose from 'mongoose';

const scanResultSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    connectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Connection', required: true },
    resourceName: { type: String, required: true }, // e.g., "repo-name" or "lambda-function-x"
    resourceType: { type: String, required: true }, // e.g., "repository", "function", "bucket"
    status: {
        type: String,
        enum: ['active', 'zombie', 'unused', 'downgrade_possible'],
        required: true
    },
    potentialSavings: { type: Number, default: 0 },
    currency: { type: String, default: 'USD' },
    accountLabel: { type: String }, // Denormalized for faster filtering and display
    reason: { type: String, required: true }, // e.g., "No commits in 92 days"
    smartRecommendation: { type: String }, // AI-generated roast from Gemini
    usesFallback: { type: Boolean, default: false }, // True if Gemini failed
    rawData: { type: mongoose.Schema.Types.Mixed }, // Store raw API data for debugging/display
    isEstimated: { type: Boolean, default: false }, // True if cost is an approximation (not from Billing API)
    detectedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Compound index to prevent duplicate findings
// One finding per user+connection+resource+status combination
scanResultSchema.index({ userId: 1, connectionId: 1, resourceName: 1, status: 1 }, { unique: true });

export const ScanResult = mongoose.model('ScanResult', scanResultSchema);
