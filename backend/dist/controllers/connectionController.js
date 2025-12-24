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
exports.removeConnection = exports.addConnection = exports.getConnections = void 0;
const Connection_1 = require("../models/Connection");
const User_1 = require("../models/User");
const encryption_1 = require("../utils/encryption");
// List all connections for the authenticated user
const getConnections = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        let user = yield User_1.User.findOne({ clerkId });
        // Auto-create user if not found (MVP approach)
        if (!user) {
            user = yield User_1.User.create({ clerkId, email: `${clerkId}@temp.clerk` });
            console.log(`Auto-created user: ${clerkId}`);
        }
        const connections = yield Connection_1.Connection.find({ userId: user._id });
        // Don't return tokens to the frontend!
        const safeConnections = connections.map(conn => ({
            id: conn._id,
            provider: conn.provider,
            lastScannedAt: conn.lastScannedAt,
            status: conn.status,
            metadata: conn.metadata
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
        const { provider, token, metadata } = req.body;
        let user = yield User_1.User.findOne({ clerkId });
        // Auto-create user if not found (MVP approach)
        if (!user) {
            user = yield User_1.User.create({ clerkId, email: `${clerkId}@temp.clerk` });
            console.log(`Auto-created user: ${clerkId}`);
        }
        // Check connection limit for free users
        if (user.subscriptionStatus !== 'pro') {
            const count = yield Connection_1.Connection.countDocuments({ userId: user._id });
            if (count >= 5) {
                return res.status(403).json({ message: 'Free plan limit reached (5 connections). Upgrade to Pro.' });
            }
        }
        // Check if connection already exists
        const existing = yield Connection_1.Connection.findOne({ userId: user._id, provider });
        if (existing) {
            // Update existing
            existing.encryptedToken = (0, encryption_1.encryptToken)(token);
            existing.metadata = metadata || existing.metadata;
            existing.status = 'active';
            yield existing.save();
            return res.json({ message: 'Connection updated', connectionId: existing._id });
        }
        // Create new
        const newConnection = new Connection_1.Connection({
            userId: user._id,
            provider,
            encryptedToken: (0, encryption_1.encryptToken)(token),
            metadata
        });
        yield newConnection.save();
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
        res.json({ message: 'Connection removed' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.removeConnection = removeConnection;
