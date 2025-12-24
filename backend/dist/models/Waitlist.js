"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Waitlist = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const waitlistSchema = new mongoose_1.default.Schema({
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
exports.Waitlist = mongoose_1.default.model('Waitlist', waitlistSchema);
