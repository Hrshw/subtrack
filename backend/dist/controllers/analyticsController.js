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
exports.getExportSummary = exports.exportData = exports.getLeaderboard = exports.getSavingsHistory = exports.getForecasting = exports.getAnalyticsTrends = exports.getAnalyticsSummary = void 0;
const ScanResult_1 = require("../models/ScanResult");
const BillingSummary_1 = require("../models/BillingSummary");
const Connection_1 = require("../models/Connection");
const User_1 = require("../models/User");
const AnalyticsService_1 = require("../services/AnalyticsService");
const ExportService_1 = require("../services/ExportService");
const getAnalyticsSummary = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const user = yield User_1.User.findOne({ clerkId });
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        // 1. Total Potential Savings (from latest scans)
        const latestScanResults = yield ScanResult_1.ScanResult.find({ userId: user._id });
        const totalSavings = latestScanResults.reduce((sum, res) => sum + (res.potentialSavings || 0), 0);
        // 2. Current Month Spend (from BillingSummary)
        const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
        const currentBilling = yield BillingSummary_1.BillingSummary.find({ userId: user._id, billingPeriod: currentMonth });
        const totalCurrentSpend = currentBilling.reduce((sum, b) => sum + (b.totalCost || 0), 0);
        // 2.1 Calculate Trend (MoM)
        const lastMonthDate = new Date();
        lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
        const lastMonth = lastMonthDate.toISOString().substring(0, 7);
        const lastMonthBilling = yield BillingSummary_1.BillingSummary.find({ userId: user._id, billingPeriod: lastMonth });
        const totalLastMonthSpend = lastMonthBilling.reduce((sum, b) => sum + (b.totalCost || 0), 0);
        let trendPercentage = 0;
        if (totalLastMonthSpend > 0) {
            trendPercentage = Math.round(((totalCurrentSpend - totalLastMonthSpend) / totalLastMonthSpend) * 100);
        }
        // 3. Breakdown by Provider
        const providerBreakdown = {};
        // Initialize with connections
        const connections = yield Connection_1.Connection.find({ userId: user._id });
        connections.forEach(c => {
            providerBreakdown[c.provider] = { cost: 0, savings: 0 };
        });
        // Add savings
        latestScanResults.forEach(r => {
            var _a;
            const provider = (_a = connections.find(c => c._id.toString() === r.connectionId.toString())) === null || _a === void 0 ? void 0 : _a.provider;
            if (provider) {
                providerBreakdown[provider].savings += r.potentialSavings || 0;
            }
        });
        // Add costs
        currentBilling.forEach(b => {
            if (providerBreakdown[b.provider]) {
                providerBreakdown[b.provider].cost += b.totalCost || 0;
            }
            else {
                providerBreakdown[b.provider] = { cost: b.totalCost || 0, savings: 0 };
            }
        });
        // 4. Dynamic Optimization Tips
        const optimizationTips = latestScanResults
            .filter(r => r.potentialSavings > 0)
            .sort((a, b) => b.potentialSavings - a.potentialSavings)
            .slice(0, 3)
            .map(r => ({
            title: r.resourceName,
            description: r.reason || `Detected optimization potential for ${r.resourceType}.`,
            savings: r.potentialSavings
        }));
        // 5. Service Velocity (Growth)
        const serviceVelocity = Object.keys(providerBreakdown).map(p => {
            var _a;
            const curr = providerBreakdown[p].cost;
            const prev = ((_a = lastMonthBilling.find(b => b.provider === p)) === null || _a === void 0 ? void 0 : _a.totalCost) || 0;
            const growth = prev > 0 ? Math.round(((curr - prev) / prev) * 100) : 0;
            return {
                name: p.toUpperCase(),
                cost: curr,
                growth
            };
        }).filter(v => v.cost > 0 || v.growth !== 0);
        // 6. Anomaly Detection
        const anomalies = serviceVelocity
            .filter(v => v.growth > 30)
            .map(v => ({
            service: v.name,
            message: `Abnormal spending detected: ${v.name} increased by ${v.growth}% this month.`,
            severity: v.growth > 100 ? 'high' : 'medium'
        }));
        // 7. Savings by Category (for Pie Charts)
        const categoryBreakdown = {};
        latestScanResults.forEach(r => {
            const category = r.resourceType || 'Other';
            categoryBreakdown[category] = (categoryBreakdown[category] || 0) + (r.potentialSavings || 0);
        });
        res.json({
            totalSavings,
            totalCurrentSpend,
            trendPercentage,
            period: currentMonth,
            breakdown: providerBreakdown,
            categoryBreakdown, // Power for the frontend pie chart
            optimalityScore: calculateOptimalityScore(totalCurrentSpend, totalSavings),
            optimizationTips,
            serviceVelocity,
            anomalies,
            efficiencyRate: Math.max(0, 100 - (totalSavings / (totalCurrentSpend + totalSavings) * 100))
        });
    }
    catch (error) {
        console.error('Analytics summary error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getAnalyticsSummary = getAnalyticsSummary;
const getAnalyticsTrends = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const user = yield User_1.User.findOne({ clerkId });
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        // Last 6 months of billing data
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const billingHistory = yield BillingSummary_1.BillingSummary.find({
            userId: user._id,
            fetchedAt: { $gte: sixMonthsAgo }
        }).sort({ billingPeriod: 1 });
        // Aggregating by month
        const trends = {};
        billingHistory.forEach(b => {
            if (!trends[b.billingPeriod]) {
                trends[b.billingPeriod] = { cost: 0, savings: 0 };
            }
            trends[b.billingPeriod].cost += b.totalCost || 0;
        });
        // 2. Aggregate Historical Savings from ScanResult
        const historicalScans = yield ScanResult_1.ScanResult.find({
            userId: user._id,
            createdAt: { $gte: sixMonthsAgo }
        });
        historicalScans.forEach(s => {
            const month = s.createdAt.toISOString().substring(0, 7);
            if (!trends[month]) {
                trends[month] = { cost: 0, savings: 0 };
            }
            trends[month].savings += s.potentialSavings || 0;
        });
        const formattedTrends = Object.entries(trends)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([period, data]) => (Object.assign({ period }, data)));
        res.json(formattedTrends);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getAnalyticsTrends = getAnalyticsTrends;
const getForecasting = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const user = yield User_1.User.findOne({ clerkId });
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        const currentMonth = new Date().toISOString().substring(0, 7);
        const currentBilling = yield BillingSummary_1.BillingSummary.find({ userId: user._id, billingPeriod: currentMonth });
        const totalCurrentSpend = currentBilling.reduce((sum, b) => sum + (b.totalCost || 0), 0);
        // Simple velocity-based forecasting
        // If we are at day 15 and spent $50, we project $100
        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const currentDay = now.getDate();
        const velocity = totalCurrentSpend / currentDay;
        const projectedSpend = velocity * daysInMonth;
        res.json({
            currentSpend: totalCurrentSpend,
            projectedSpend: Math.round(projectedSpend * 100) / 100,
            confidence: currentDay > 20 ? 'high' : currentDay > 10 ? 'medium' : 'low',
            daysRemaining: daysInMonth - currentDay,
            period: now.toLocaleString('default', { month: 'long', year: 'numeric' })
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getForecasting = getForecasting;
function calculateOptimalityScore(cost, savings) {
    // If no spend and no waste, you're perfectly optimized (or no data)
    if (cost === 0 && savings === 0)
        return 100;
    // If we have waste but 0 spend, it implies spend data hasn't synced yet (common)
    // We'll show a "Starting" score of 85 rather than 0 to avoid scaring new users
    if (cost <= 1 && savings > 0)
        return 85;
    // Industry Standard: Health = (Useful Spend / Total Spend Equivalent)
    const score = (cost / (cost + savings)) * 100;
    // Apply a floor if there is any useful spend
    return Math.max(5, Math.min(100, Math.round(score)));
}
/**
 * Get savings history for charts
 */
const getSavingsHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const user = yield User_1.User.findOne({ clerkId });
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        const days = parseInt(req.query.days) || 30;
        const connectionId = req.query.connectionId;
        const history = yield AnalyticsService_1.AnalyticsService.getUserSavingsHistory(user._id.toString(), days, connectionId || null);
        res.json(history);
    }
    catch (error) {
        console.error('Savings history error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getSavingsHistory = getSavingsHistory;
/**
 * Get public leaderboard
 */
const getLeaderboard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const leaderboard = yield AnalyticsService_1.AnalyticsService.getLeaderboard();
        res.json(leaderboard);
    }
    catch (error) {
        console.error('Leaderboard error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getLeaderboard = getLeaderboard;
/**
 * Export data as CSV
 */
const exportData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const user = yield User_1.User.findOne({ clerkId });
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        const csv = yield ExportService_1.ExportService.generateCSV(user._id.toString());
        const summary = yield ExportService_1.ExportService.generateSummary(user._id.toString());
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="subtrack-export-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csv);
    }
    catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.exportData = exportData;
/**
 * Get export summary (JSON)
 */
const getExportSummary = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const user = yield User_1.User.findOne({ clerkId });
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        const summary = yield ExportService_1.ExportService.generateSummary(user._id.toString());
        res.json(summary);
    }
    catch (error) {
        console.error('Export summary error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getExportSummary = getExportSummary;
