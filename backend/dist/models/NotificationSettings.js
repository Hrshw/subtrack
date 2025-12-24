"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationSettings = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const notificationSettingsSchema = new mongoose_1.default.Schema({
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
exports.NotificationSettings = mongoose_1.default.model('NotificationSettings', notificationSettingsSchema);
