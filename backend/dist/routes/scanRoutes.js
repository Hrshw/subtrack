"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const Connection_1 = require("../models/Connection");
const IntegrationService_1 = require("../services/IntegrationService");
const ScanResult_1 = require("../models/ScanResult");
const router = express_1.default.Router();
router.use(auth_1.requireAuth);
// Cache duration: 1 hour (in milliseconds)
const SCAN_CACHE_DURATION = 60 * 60 * 1000;
router.post('/trigger', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const { forceRefresh } = req.body; // Allow forcing fresh scan
        const { User } = yield Promise.resolve().then(() => __importStar(require('../models/User')));
        let user = yield User.findOne({ clerkId });
        if (!user) {
            user = yield User.create({ clerkId, email: `${clerkId}@temp.clerk` });
            console.log(`Auto-created user: ${clerkId}`);
        }
        const connections = yield Connection_1.Connection.find({ userId: user._id });
        if (connections.length === 0) {
            return res.json({
                message: 'No connections to scan',
                summary: [],
                data: [],
                cached: false
            });
        }
        // Check if we have recent scan results (within cache duration)
        const latestResult = yield ScanResult_1.ScanResult.findOne({ userId: user._id })
            .sort({ createdAt: -1 })
            .limit(1);
        const now = Date.now();
        const isCacheValid = !forceRefresh && latestResult &&
            (now - new Date(latestResult.createdAt).getTime()) < SCAN_CACHE_DURATION;
        if (isCacheValid) {
            // Return cached results
            console.log(`✅ Returning cached results for user ${clerkId}`);
            const cachedResults = yield ScanResult_1.ScanResult.find({ userId: user._id })
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
            const existingResults = yield ScanResult_1.ScanResult.findOne({
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
            const allResults = yield ScanResult_1.ScanResult.find({ userId: user._id })
                .populate('connectionId', 'provider');
            return res.json({
                message: 'Scan complete (all cached)',
                summary: ['All connections already scanned recently'],
                data: allResults,
                cached: true,
                lastScanTime: latestResult === null || latestResult === void 0 ? void 0 : latestResult.createdAt
            });
        }
        // CRITICAL: Only delete results for connections we're re-scanning
        for (const conn of connectionsToScan) {
            const deleteResult = yield ScanResult_1.ScanResult.deleteMany({
                userId: user._id,
                connectionId: conn._id
            });
            console.log(`🗑️  Deleted ${deleteResult.deletedCount} old results for ${conn.provider}`);
        }
        // Run fresh scans only for new/stale connections
        const results = [];
        for (const conn of connectionsToScan) {
            const integration = (0, IntegrationService_1.getIntegration)(conn.provider);
            if (integration) {
                yield integration.scan(conn);
                results.push(`Scanned ${conn.provider}`);
                // Update last scanned timestamp
                yield Connection_1.Connection.findByIdAndUpdate(conn._id, {
                    lastScannedAt: new Date()
                });
            }
        }
        // Fetch ALL results (old + new merged)
        const scanResults = yield ScanResult_1.ScanResult.find({ userId: user._id })
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Scan failed', error });
    }
}));
router.get('/results', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const { User } = yield Promise.resolve().then(() => __importStar(require('../models/User')));
        let user = yield User.findOne({ clerkId });
        if (!user) {
            user = yield User.create({ clerkId, email: `${clerkId}@temp.clerk` });
            console.log(`Auto-created user: ${clerkId}`);
        }
        const results = yield ScanResult_1.ScanResult.find({ userId: user._id })
            .populate('connectionId', 'provider')
            .sort({ createdAt: -1 }); // Most recent first
        res.json(results);
    }
    catch (error) {
        res.status(500).json({ message: 'Error fetching results' });
    }
}));
exports.default = router;
