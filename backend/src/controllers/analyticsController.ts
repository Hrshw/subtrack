import { Request, Response } from 'express';
import { ScanResult } from '../models/ScanResult';
import { BillingSummary } from '../models/BillingSummary';
import { Connection } from '../models/Connection';
import { User } from '../models/User';
import { AnalyticsService } from '../services/AnalyticsService';
import { ExportService } from '../services/ExportService';

export const getAnalyticsSummary = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const user = await User.findOne({ clerkId });
        if (!user) return res.status(404).json({ message: 'User not found' });

        // 1. Total Potential Savings (from latest scans)
        const latestScanResults = await ScanResult.find({ userId: user._id });
        const totalSavings = latestScanResults.reduce((sum, res) => sum + (res.potentialSavings || 0), 0);

        // 2. Current Month Spend (from BillingSummary)
        const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
        const currentBilling = await BillingSummary.find({ userId: user._id, billingPeriod: currentMonth });
        const totalCurrentSpend = currentBilling.reduce((sum, b) => sum + (b.totalCost || 0), 0);

        // 2.1 Calculate Trend (MoM)
        const lastMonthDate = new Date();
        lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
        const lastMonth = lastMonthDate.toISOString().substring(0, 7);
        const lastMonthBilling = await BillingSummary.find({ userId: user._id, billingPeriod: lastMonth });
        const totalLastMonthSpend = lastMonthBilling.reduce((sum, b) => sum + (b.totalCost || 0), 0);

        let trendPercentage = 0;
        if (totalLastMonthSpend > 0) {
            trendPercentage = Math.round(((totalCurrentSpend - totalLastMonthSpend) / totalLastMonthSpend) * 100);
        }

        // 3. Breakdown by Provider
        const providerBreakdown: Record<string, { cost: number; savings: number }> = {};

        // Initialize with connections
        const connections = await Connection.find({ userId: user._id });
        connections.forEach(c => {
            providerBreakdown[c.provider] = { cost: 0, savings: 0 };
        });

        // Add savings
        latestScanResults.forEach(r => {
            const provider = connections.find(c => c._id.toString() === r.connectionId.toString())?.provider;
            if (provider) {
                providerBreakdown[provider].savings += r.potentialSavings || 0;
            }
        });

        // Add costs
        currentBilling.forEach(b => {
            if (providerBreakdown[b.provider]) {
                providerBreakdown[b.provider].cost += b.totalCost || 0;
            } else {
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
            const curr = providerBreakdown[p].cost;
            const prev = lastMonthBilling.find(b => b.provider === p)?.totalCost || 0;
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
        const categoryBreakdown: Record<string, number> = {};
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
    } catch (error) {
        console.error('Analytics summary error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

export const getAnalyticsTrends = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const user = await User.findOne({ clerkId });
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Last 6 months of billing data
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const billingHistory = await BillingSummary.find({
            userId: user._id,
            fetchedAt: { $gte: sixMonthsAgo }
        }).sort({ billingPeriod: 1 });

        // Aggregating by month
        const trends: Record<string, { cost: number; savings: number }> = {};

        billingHistory.forEach(b => {
            if (!trends[b.billingPeriod]) {
                trends[b.billingPeriod] = { cost: 0, savings: 0 };
            }
            trends[b.billingPeriod].cost += b.totalCost || 0;
        });

        // 2. Aggregate Historical Savings from ScanResult
        const historicalScans = await ScanResult.find({
            userId: user._id,
            createdAt: { $gte: sixMonthsAgo }
        });

        historicalScans.forEach(s => {
            const month = (s as any).createdAt.toISOString().substring(0, 7);
            if (!trends[month]) {
                trends[month] = { cost: 0, savings: 0 };
            }
            trends[month].savings += s.potentialSavings || 0;
        });

        const formattedTrends = Object.entries(trends)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([period, data]) => ({
                period,
                ...data
            }));

        res.json(formattedTrends);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

export const getForecasting = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const user = await User.findOne({ clerkId });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const currentMonth = new Date().toISOString().substring(0, 7);
        const currentBilling = await BillingSummary.find({ userId: user._id, billingPeriod: currentMonth });
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
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

function calculateOptimalityScore(cost: number, savings: number): number {
    // If no spend and no waste, you're perfectly optimized (or no data)
    if (cost === 0 && savings === 0) return 100;

    // If we have waste but 0 spend, it implies spend data hasn't synced yet (common)
    // We'll show a "Starting" score of 85 rather than 0 to avoid scaring new users
    if (cost <= 1 && savings > 0) return 85;

    // Industry Standard: Health = (Useful Spend / Total Spend Equivalent)
    const score = (cost / (cost + savings)) * 100;

    // Apply a floor if there is any useful spend
    return Math.max(5, Math.min(100, Math.round(score)));
}

/**
 * Get savings history for charts
 */
export const getSavingsHistory = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const user = await User.findOne({ clerkId });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const days = parseInt(req.query.days as string) || 30;
        const connectionId = req.query.connectionId as string | undefined;
        const history = await AnalyticsService.getUserSavingsHistory(
            (user._id as any).toString(),
            days,
            connectionId || null
        );

        res.json(history);
    } catch (error) {
        console.error('Savings history error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

/**
 * Get public leaderboard
 */
export const getLeaderboard = async (req: Request, res: Response) => {
    try {
        const leaderboard = await AnalyticsService.getLeaderboard();
        res.json(leaderboard);
    } catch (error) {
        console.error('Leaderboard error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

/**
 * Export data as CSV
 */
export const exportData = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const user = await User.findOne({ clerkId });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const csv = await ExportService.generateCSV((user._id as any).toString());
        const summary = await ExportService.generateSummary((user._id as any).toString());

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="subtrack-export-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csv);
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};

/**
 * Get export summary (JSON)
 */
export const getExportSummary = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const user = await User.findOne({ clerkId });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const summary = await ExportService.generateSummary((user._id as any).toString());
        res.json(summary);
    } catch (error) {
        console.error('Export summary error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
};
