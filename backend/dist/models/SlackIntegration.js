"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlackIntegration = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const slackIntegrationSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
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
exports.SlackIntegration = mongoose_1.default.model('SlackIntegration', slackIntegrationSchema);
