import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
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
        type: mongoose.Schema.Types.Mixed
    },
    errorMessage: {
        type: String
    }
}, { timestamps: true });

export const Transaction = mongoose.model('Transaction', transactionSchema);
