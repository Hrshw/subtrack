import mongoose from 'mongoose';

const waitlistSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true
    },
    expectedSavings: {
        type: Number,
        default: 0
    },
    position: {
        type: Number,
        required: true
    },
    notified: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

waitlistSchema.index({ position: 1 });

export const Waitlist = mongoose.model('Waitlist', waitlistSchema);
