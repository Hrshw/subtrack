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
exports.updateConnection = exports.removeConnection = exports.addConnection = exports.getConnections = void 0;
const Connection_1 = require("../models/Connection");
const User_1 = require("../models/User");
const encryption_1 = require("../utils/encryption");
const RobotService_1 = require("../services/RobotService");
// List all connections for the authenticated user
const getConnections = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        let user = yield User_1.User.findOne({ clerkId });
        // Auto-create user if not found (MVP approach)
        if (!user) {
            user = yield User_1.User.create({
                clerkId,
                email: `${clerkId}@temp.clerk`,
                name: 'User'
            });
            console.log(`Auto-created user: ${clerkId}`);
        }
        const connections = yield Connection_1.Connection.find({ userId: user._id }).sort({ isDefault: -1, createdAt: 1 });
        // Don't return tokens to the frontend!
        const safeConnections = connections.map(conn => ({
            id: conn._id,
            provider: conn.provider,
            lastScannedAt: conn.lastScannedAt,
            status: conn.status,
            metadata: conn.metadata,
            errorMessage: conn.errorMessage,
            // Multi-account fields
            accountLabel: conn.accountLabel || null,
            accountId: conn.accountId || null,
            isDefault: conn.isDefault || false,
            environment: conn.environment || 'other'
        }));
        res.json(safeConnections);
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getConnections = getConnections;
// Add a new connection (Generic handler for MVP - in real app, OAuth callback handles this)
const addConnection = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const { provider, token, metadata, accountLabel } = req.body;
        let user = yield User_1.User.findOne({ clerkId });
        // Auto-create user if not found (MVP approach)
        if (!user) {
            user = yield User_1.User.create({
                clerkId,
                email: `${clerkId}@temp.clerk`,
                name: 'User'
            });
            console.log(`Auto-created user: ${clerkId}`);
        }
        // Check connection limit for free users
        const totalConnections = yield Connection_1.Connection.countDocuments({ userId: user._id });
        if (user.subscriptionStatus !== 'pro') {
            if (totalConnections >= 5) {
                return res.status(403).json({ message: 'Free plan limit reached (5 connections). Upgrade to Pro.' });
            }
            // Also check if they already have this provider (Free users get 1 per provider)
            const existing = yield Connection_1.Connection.findOne({ userId: user._id, provider });
            if (existing && !accountLabel) {
                // If no label, update existing
                existing.encryptedToken = (0, encryption_1.encryptToken)(token);
                existing.metadata = metadata || existing.metadata;
                existing.status = 'active';
                yield existing.save();
                return res.json({ message: 'Connection updated', connectionId: existing._id });
            }
            if (existing && accountLabel) {
                return res.status(403).json({ message: 'Multiple accounts for a single provider is a Pro feature.' });
            }
        }
        // Create new
        const newConnection = new Connection_1.Connection({
            userId: user._id,
            provider,
            encryptedToken: (0, encryption_1.encryptToken)(token),
            accountLabel: accountLabel || undefined,
            metadata: metadata || { type: 'manual' }
        });
        yield newConnection.save();
        // Clear robot cache to refresh advice
        RobotService_1.RobotService.clearCache(user._id.toString()).catch(err => console.error('Failed to clear robot cache after connection:', err));
        res.status(201).json({ message: 'Connection added', connectionId: newConnection._id });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.addConnection = addConnection;
// Remove a connection
const removeConnection = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const { id } = req.params;
        const user = yield User_1.User.findOne({ clerkId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        yield Connection_1.Connection.findOneAndDelete({ _id: id, userId: user._id });
        // Clear robot cache to refresh advice
        RobotService_1.RobotService.clearCache(user._id.toString()).catch(err => console.error('Failed to clear robot cache after disconnect:', err));
        res.json({ message: 'Connection removed' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.removeConnection = removeConnection;
// Update connection label, environment, default status
const updateConnection = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const { id } = req.params;
        const { accountLabel, environment, isDefault } = req.body;
        const user = yield User_1.User.findOne({ clerkId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const connection = yield Connection_1.Connection.findOne({ _id: id, userId: user._id });
        if (!connection) {
            return res.status(404).json({ message: 'Connection not found' });
        }
        // If setting as default, unset other defaults for this provider
        if (isDefault) {
            yield Connection_1.Connection.updateMany({ userId: user._id, provider: connection.provider, _id: { $ne: id } }, { isDefault: false });
        }
        // Update fields
        if (accountLabel !== undefined)
            connection.accountLabel = accountLabel;
        if (environment !== undefined)
            connection.environment = environment;
        if (isDefault !== undefined)
            connection.isDefault = isDefault;
        yield connection.save();
        res.json({
            message: 'Connection updated',
            connection: {
                id: connection._id,
                accountLabel: connection.accountLabel,
                environment: connection.environment,
                isDefault: connection.isDefault
            }
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.updateConnection = updateConnection;
