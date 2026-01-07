"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingSummary = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const billingSummarySchema = new mongoose_1.default.Schema({
    userId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', required: true },
    connectionId: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Connection', required: true },
    provider: { type: String, required: true },
    billingPeriod: { type: String, required: true }, // e.g., "2023-11"
    totalCost: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    breakdown: { type: mongoose_1.default.Schema.Types.Mixed }, // Store per-service costs
    fetchedAt: { type: Date, default: Date.now }
}, { timestamps: true });
// One entry per user+connection+month
billingSummarySchema.index({ connectionId: 1, billingPeriod: 1 }, { unique: true });
exports.BillingSummary = mongoose_1.default.model('BillingSummary', billingSummarySchema);
