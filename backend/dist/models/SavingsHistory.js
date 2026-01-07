"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SavingsHistory = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const savingsHistorySchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    connectionId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'Connection',
        required: false // Null means aggregate for all accounts
    },
    totalSavings: {
        type: Number,
        default: 0
    },
    zombieCount: {
        type: Number,
        default: 0
    },
    activeCount: {
        type: Number,
        default: 0
    },
    serviceBreakdown: {
        type: Map,
        of: Number,
        default: {}
    }
}, { timestamps: true });
// Compound index: one entry per user per day per connection (or aggregate)
savingsHistorySchema.index({ userId: 1, connectionId: 1, date: 1 }, { unique: true });
// Index for efficient date range queries
savingsHistorySchema.index({ date: -1 });
exports.SavingsHistory = mongoose_1.default.model('SavingsHistory', savingsHistorySchema);
