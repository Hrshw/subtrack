import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    clerkId: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    name: { type: String },
    subscriptionStatus: {
        type: String,
        enum: ['free', 'pro'],
        default: 'free'
    },
    // Localization
    currency: {
        type: String,
        enum: ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'AED'],
        default: 'USD'
    },
    country: { type: String, default: '' },
    timezone: { type: String, default: 'UTC' },
    stripeCustomerId: { type: String },
    // Polar subscription fields
    polarCustomerId: { type: String },
    subscriptionId: { type: String },
    subscriptionStartDate: { type: Date },
    subscriptionEndDate: { type: Date },
    plan: { type: String, enum: ['monthly', 'annual'] },
    renewalReminderSent: { type: Boolean, default: false }
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
