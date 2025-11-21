import mongoose from 'mongoose';

const notificationSettingsSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    monthlyDigest: {
        type: Boolean,
        default: true
    },
    leakAlerts: {
        type: Boolean,
        default: false
    },
    emailPreference: {
        type: String,
        enum: ['instant', 'daily', 'weekly'],
        default: 'instant'
    },
    lastDigestSentAt: {
        type: Date
    }
}, { timestamps: true });

export const NotificationSettings = mongoose.model('NotificationSettings', notificationSettingsSchema);
