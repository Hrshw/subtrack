"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transaction = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const transactionSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    txnid: {
        type: String,
        required: true,
        unique: true
    },
    amount: {
        type: Number,
        required: true
    },
    plan: {
        type: String,
        enum: ['monthly', 'annual'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'success', 'failure'],
        default: 'pending'
    },
    paymentGateway: {
        type: String,
        default: 'Polar',
        enum: ['PayU', 'Polar', 'Stripe']
    },
    polarSubscriptionId: {
        type: String
    },
    rawResponse: {
        type: mongoose_1.default.Schema.Types.Mixed
    },
    errorMessage: {
        type: String
    }
}, { timestamps: true });
exports.Transaction = mongoose_1.default.model('Transaction', transactionSchema);
