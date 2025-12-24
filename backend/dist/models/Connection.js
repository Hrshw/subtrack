"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Connection = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const connectionSchema = new mongoose_1.default.Schema({
    userId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', required: true },
    provider: {
        type: String,
        enum: ['github', 'vercel', 'aws', 'sentry', 'linear', 'resend', 'clerk', 'stripe'],
        required: true
    },
    encryptedToken: { type: String, required: true },
    encryptedRefreshToken: { type: String },
    metadata: { type: mongoose_1.default.Schema.Types.Mixed }, // For storing things like AWS region, GitHub username, etc.
    lastScannedAt: { type: Date },
    status: {
        type: String,
        enum: ['active', 'error', 'disconnected'],
        default: 'active'
    }
}, { timestamps: true });
// Compound index to ensure one provider per user (unless we want to allow multiple GitHub accounts? MVP says 3-6 accounts, maybe multiple allowed? Let's stick to one per provider for simplicity in MVP, or allow multiple. The prompt says "User connects 3-6 accounts". Let's allow multiple but maybe unique by provider+metadata identifier if needed. For now, simple.)
connectionSchema.index({ userId: 1, provider: 1 }, { unique: true });
exports.Connection = mongoose_1.default.model('Connection', connectionSchema);
