import express from 'express';
import { requireAuth } from '../middleware/auth';
import { Connection } from '../models/Connection';
import { getIntegration } from '../services/IntegrationService';
import { ScanResult } from '../models/ScanResult';
import { BillingSummary } from '../models/BillingSummary';
import { User } from '../models/User';
import { AnalyticsService } from '../services/AnalyticsService';
import { RobotService } from '../services/RobotService';

const router = express.Router();

router.use(requireAuth);

// Cache duration: 1 hour (in milliseconds)
const SCAN_CACHE_DURATION = 60 * 60 * 1000;

router.post('/trigger', async (req, res) => {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const { forceRefresh } = req.body; // Allow forcing fresh scan

        const { User } = await import('../models/User');
        let user = await User.findOne({ clerkId });

        if (!user) {
            user = await User.create({
                clerkId,
                email: `${clerkId}@temp.clerk`,
                name: 'User'
            });
            console.log(`Auto-created user: ${clerkId}`);
        }

        const connections = await Connection.find({ userId: user._id });

        if (connections.length === 0) {
            return res.json({
                message: 'No connections to scan',
                summary: [],
                data: [],
                cached: false
            });
        }

        // Check if we have recent scan results (within cache duration)
        const latestResult = await ScanResult.findOne({ userId: user._id })
            .sort({ createdAt: -1 })
            .limit(1);

        const now = Date.now();
        const isCacheValid = !forceRefresh && latestResult &&
            (now - new Date(latestResult.createdAt).getTime()) < SCAN_CACHE_DURATION;

        if (isCacheValid) {
            // Return cached results
            console.log(`✅ Returning cached results for user ${clerkId}`);
            const cachedResults = await ScanResult.find({ userId: user._id })
                .populate('connectionId', 'provider');

            return res.json({
                message: 'Scan complete (cached)',
                summary: ['Using cached results from recent scan'],
                data: cachedResults,
                cached: true,
                lastScanTime: latestResult.createdAt
            });
        }

        // INCREMENTAL SCAN LOGIC
        // Find connections that haven't been scanned recently or are new
        const connectionsToScan = [];
        for (const conn of connections) {
            // Check if this connection has been scanned recently
            const existingResults = await ScanResult.findOne({
                userId: user._id,
                connectionId: conn._id
            }).sort({ createdAt: -1 });

            const shouldScan = forceRefresh ||
                !existingResults ||
                !conn.lastScannedAt ||
                (now - new Date(conn.lastScannedAt).getTime()) > SCAN_CACHE_DURATION;

            if (shouldScan) {
                connectionsToScan.push(conn);
            }
        }

        if (connectionsToScan.length === 0) {
            console.log(`✅ All connections already scanned recently for user ${clerkId}`);
            const allResults = await ScanResult.find({ userId: user._id })
                .populate('connectionId', 'provider');

            return res.json({
                message: 'Scan complete (all cached)',
                summary: ['All connections already scanned recently'],
                data: allResults,
                cached: true,
                lastScanTime: latestResult?.createdAt
            });
        }

        // CRITICAL: Only delete results for connections we're re-scanning
        for (const conn of connectionsToScan) {
            const deleteResult = await ScanResult.deleteMany({
                userId: user._id,
                connectionId: conn._id
            });
            console.log(`🗑️  Deleted ${deleteResult.deletedCount} old results for ${conn.provider}`);
        }

        // Run fresh scans in parallel for new/stale connections
        const results: string[] = [];
        await Promise.all(connectionsToScan.map(async (conn) => {
            try {
                const integration = getIntegration(conn.provider);
                if (integration) {
                    await integration.scan(conn);
                    results.push(`Scanned ${conn.provider}`);

                    // Update last scanned timestamp
                    await Connection.findByIdAndUpdate(conn._id, {
                        lastScannedAt: new Date()
                    });
                }
            } catch (err) {
                console.error(`Error scanning ${conn.provider}:`, err);
                // We don't throw here to allow other scans to finish
            }
        }));

        // Fetch ALL results (old + new merged)
        const scanResults = await ScanResult.find({ userId: user._id })
            .populate('connectionId', 'provider')
            .sort({ createdAt: -1 });

        console.log(`✅ Incremental scan complete for user ${clerkId}: scanned ${connectionsToScan.length} connections, total ${scanResults.length} findings`);

        res.json({
            message: `Scan complete (${connectionsToScan.length} services scanned)`,
            summary: results,
            data: scanResults,
            cached: false,
            lastScanTime: new Date(),
            scannedCount: connectionsToScan.length,
            totalConnections: connections.length
        });

        // Trigger community stats update in background
        AnalyticsService.updateCommunityStats().catch(err =>
            console.error('Failed to update community stats after scan:', err)
        );

        // Clear robot cache to force fresh advice
        RobotService.clearCache(user._id.toString()).catch(err =>
            console.error('Failed to clear robot cache after scan:', err)
        );
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Scan failed', error });
    }
});

router.get('/results', async (req, res) => {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const { User } = await import('../models/User');
        let user = await User.findOne({ clerkId });

        if (!user) {
            user = await User.create({
                clerkId,
                email: `${clerkId}@temp.clerk`,
                name: 'User'
            });
            console.log(`Auto-created user: ${clerkId}`);
        }

        const results = await ScanResult.find({ userId: user._id })
            .populate('connectionId', 'provider')
            .sort({ createdAt: -1 }); // Most recent first

        res.json(results);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching results' });
    }
});

router.get('/billing/:connectionId', async (req, res) => {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const user = await User.findOne({ clerkId });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const history = await BillingSummary.find({
            userId: user._id,
            connectionId: req.params.connectionId
        }).sort({ billingPeriod: 1 });

        res.json(history);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching billing history' });
    }
});

export default router;
