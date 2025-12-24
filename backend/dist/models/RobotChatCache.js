"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RobotChatCache = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const robotChatCacheSchema = new mongoose_1.default.Schema({
    userId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', required: true },
    lastMessage: { type: String, required: true },
    timestamp: { type: Date, required: true },
    isPro: { type: Boolean, default: false },
    messageCount: { type: Number, default: 0 }, // Track messages in current session
    lastResetAt: { type: Date, default: Date.now },
    greetingShown: { type: Boolean, default: false } // Track if greeting was shown
}, { timestamps: true });
// Index for fast lookups
robotChatCacheSchema.index({ userId: 1 });
exports.RobotChatCache = mongoose_1.default.model('RobotChatCache', robotChatCacheSchema);
