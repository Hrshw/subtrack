"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const userSchema = new mongoose_1.default.Schema({
    clerkId: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    name: { type: String },
    subscriptionStatus: {
        type: String,
        enum: ['free', 'pro'],
        default: 'free'
    },
    stripeCustomerId: { type: String },
}, { timestamps: true });
exports.User = mongoose_1.default.model('User', userSchema);
