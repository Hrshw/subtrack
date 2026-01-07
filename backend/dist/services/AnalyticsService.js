"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsService = void 0;
const ScanResult_1 = require("../models/ScanResult");
const SavingsHistory_1 = require("../models/SavingsHistory");
const CommunityStats_1 = require("../models/CommunityStats");
class AnalyticsService {
    /**
     * Snapshot current savings for a user (called after each scan)
     */
    static snapshotUserSavings(userId, connectionId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                // 1. Snapshot for the specific connection if provided
                if (connectionId) {
                    const connectionResults = yield ScanResult_1.ScanResult.find({ userId, connectionId });
                    yield this.createSnapshot(userId, today, connectionResults, connectionId);
                }
                // 2. Snapshot Aggregate for the user (all connections)
                const allResults = yield ScanResult_1.ScanResult.find({ userId });
                yield this.createSnapshot(userId, today, allResults);
                console.log(`📊 Savings snapshots updated for user ${userId}${connectionId ? ` (Connection: ${connectionId})` : ''}`);
            }
            catch (error) {
                console.error('Failed to snapshot user savings:', error);
            }
        });
    }
    static createSnapshot(userId_1, date_1, results_1) {
        return __awaiter(this, arguments, void 0, function* (userId, date, results, connectionId = null) {
            const zombies = results.filter(r => r.status === 'zombie' || r.status === 'unused' || r.status === 'downgrade_possible');
            const active = results.filter(r => r.status === 'active');
            const totalSavings = zombies.reduce((sum, z) => sum + (z.potentialSavings || 0), 0);
            const serviceBreakdown = new Map();
            zombies.forEach(z => {
                const service = z.resourceType || 'unknown';
                const current = serviceBreakdown.get(service) || 0;
                serviceBreakdown.set(service, current + (z.potentialSavings || 0));
            });
            yield SavingsHistory_1.SavingsHistory.findOneAndUpdate({ userId, date, connectionId: connectionId || null }, {
                userId,
                date,
                connectionId: connectionId || null,
                totalSavings,
                zombieCount: zombies.length,
                activeCount: active.length,
                serviceBreakdown: Object.fromEntries(serviceBreakdown)
            }, { upsert: true, new: true });
        });
    }
    /**
     * Get historical savings data for charts
     * @param connectionId - If null, returns aggregate history for all connections
     */
    static getUserSavingsHistory(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, days = 30, connectionId = null) {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            startDate.setHours(0, 0, 0, 0);
            const query = {
                userId,
                date: { $gte: startDate },
                connectionId: connectionId || null // Null = aggregate for all accounts
            };
            const history = yield SavingsHistory_1.SavingsHistory.find(query).sort({ date: 1 });
            return history.map(h => ({
                date: h.date,
                totalSavings: h.totalSavings,
                zombieCount: h.zombieCount,
                activeCount: h.activeCount,
                serviceBreakdown: h.serviceBreakdown
            }));
        });
    }
    /**
     * Update community-wide stats (called periodically)
     */
    static updateCommunityStats() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                // Aggregate all users' savings
                const allSavings = yield SavingsHistory_1.SavingsHistory.aggregate([
                    { $match: { date: today } },
                    {
                        $group: {
                            _id: null,
                            totalSavings: { $sum: '$totalSavings' },
                            totalZombies: { $sum: '$zombieCount' },
                            userCount: { $sum: 1 }
                        }
                    }
                ]);
                const stats = allSavings[0] || { totalSavings: 0, totalZombies: 0, userCount: 0 };
                // Get top services by savings
                const topServices = yield ScanResult_1.ScanResult.aggregate([
                    { $match: { status: { $in: ['zombie', 'unused', 'downgrade_possible'] } } },
                    {
                        $group: {
                            _id: '$resourceType',
                            savings: { $sum: '$potentialSavings' }
                        }
                    },
                    { $sort: { savings: -1 } },
                    { $limit: 5 }
                ]);
                // Get total scan count
                const totalScans = yield ScanResult_1.ScanResult.countDocuments();
                yield CommunityStats_1.CommunityStats.findOneAndUpdate({ date: today }, {
                    date: today,
                    totalSavings: stats.totalSavings,
                    totalUsers: stats.userCount,
                    totalZombiesKilled: stats.totalZombies,
                    totalScans,
                    topServices: topServices.map(s => ({
                        service: s._id || 'unknown',
                        savings: s.savings
                    }))
                }, { upsert: true });
                console.log(`🌐 Community stats updated: ₹${stats.totalSavings} saved by ${stats.userCount} users`);
            }
            catch (error) {
                console.error('Failed to update community stats:', error);
            }
        });
    }
    /**
     * Get public leaderboard data
     */
    static getLeaderboard() {
        return __awaiter(this, void 0, void 0, function* () {
            // Get this month's stats
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);
            const monthlyStats = yield CommunityStats_1.CommunityStats.aggregate([
                { $match: { date: { $gte: startOfMonth } } },
                {
                    $group: {
                        _id: null,
                        totalSavings: { $sum: '$totalSavings' },
                        totalUsers: { $max: '$totalUsers' },
                        totalZombies: { $sum: '$totalZombiesKilled' }
                    }
                }
            ]);
            const stats = monthlyStats[0] || { totalSavings: 0, totalUsers: 0, totalZombies: 0 };
            // Get all-time stats
            const allTimeStats = yield CommunityStats_1.CommunityStats.aggregate([
                {
                    $group: {
                        _id: null,
                        totalSavings: { $sum: '$totalSavings' }
                    }
                }
            ]);
            const allTime = allTimeStats[0] || { totalSavings: 0 };
            return {
                thisMonth: {
                    savings: stats.totalSavings,
                    users: stats.totalUsers,
                    zombiesKilled: stats.totalZombies
                },
                allTime: {
                    savings: allTime.totalSavings
                }
            };
        });
    }
}
exports.AnalyticsService = AnalyticsService;
