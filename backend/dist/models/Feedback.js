"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Feedback = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const feedbackSchema = new mongoose_1.default.Schema({
    userId: {
        type: String,
        required: false // Optional if they logout/don't have account
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['support', 'feedback', 'bug', 'other'],
        default: 'feedback'
    },
    status: {
        type: String,
        enum: ['new', 'processed', 'ignored'],
        default: 'new'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });
exports.Feedback = mongoose_1.default.model('Feedback', feedbackSchema);
