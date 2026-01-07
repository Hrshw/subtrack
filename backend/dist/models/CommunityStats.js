"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunityStats = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const communityStatsSchema = new mongoose_1.default.Schema({
    date: {
        type: Date,
        required: true,
        unique: true
    },
    totalSavings: {
        type: Number,
        default: 0
    },
    totalUsers: {
        type: Number,
        default: 0
    },
    totalZombiesKilled: {
        type: Number,
        default: 0
    },
    totalScans: {
        type: Number,
        default: 0
    },
    topServices: [{
            service: String,
            savings: Number
        }]
}, { timestamps: true });
// Index for date queries
communityStatsSchema.index({ date: -1 });
exports.CommunityStats = mongoose_1.default.model('CommunityStats', communityStatsSchema);
