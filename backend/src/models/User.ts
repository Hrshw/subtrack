import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    clerkId: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    subscriptionStatus: {
        type: String,
        enum: ['free', 'pro'],
        default: 'free'
    },
    stripeCustomerId: { type: String },
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
