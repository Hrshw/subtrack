import mongoose from 'mongoose';

const connectionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    provider: {
        type: String,
        enum: ['github', 'vercel', 'aws', 'sentry', 'linear', 'resend', 'clerk', 'stripe', 'openai', 'digitalocean', 'supabase', 'notion'],
        required: true
    },
    encryptedToken: { type: String, required: true },
    encryptedRefreshToken: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed }, // For storing things like AWS region, GitHub username, etc.
    lastScannedAt: { type: Date },
    status: {
        type: String,
        enum: ['active', 'error', 'disconnected'],
        default: 'active'
    },
    errorMessage: { type: String },
    accountLabel: { type: String }, // User-defined name
    accountId: { type: String },    // Provider-defined internal ID
    isDefault: { type: Boolean, default: false },
    environment: {
        type: String,
        enum: ['production', 'staging', 'development', 'other'],
        default: 'other'
    }
}, { timestamps: true });

// Allow multiple accounts for the same provider
connectionSchema.index({ userId: 1, provider: 1, accountId: 1 }, { unique: true, sparse: true });
connectionSchema.index({ userId: 1, isDefault: 1 });

export const Connection = mongoose.model('Connection', connectionSchema);
