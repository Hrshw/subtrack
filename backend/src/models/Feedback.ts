import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
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

export const Feedback = mongoose.model('Feedback', feedbackSchema);
