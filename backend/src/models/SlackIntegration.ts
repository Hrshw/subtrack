import mongoose from 'mongoose';

const slackIntegrationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    teamId: {
        type: String,
        required: true
    },
    teamName: {
        type: String
    },
    accessToken: {
        type: String,
        required: true
    },
    channelId: {
        type: String
    },
    channelName: {
        type: String
    },
    webhookUrl: {
        type: String
    },
    notificationsEnabled: {
        type: Boolean,
        default: true
    },
    weeklyPulseEnabled: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

export const SlackIntegration = mongoose.model('SlackIntegration', slackIntegrationSchema);
