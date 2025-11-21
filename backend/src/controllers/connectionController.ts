import { Request, Response } from 'express';
import { Connection } from '../models/Connection';
import { User } from '../models/User';
import { encryptToken } from '../utils/encryption';

// List all connections for the authenticated user
export const getConnections = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        let user = await User.findOne({ clerkId });

        // Auto-create user if not found (MVP approach)
        if (!user) {
            user = await User.create({ clerkId, email: `${clerkId}@temp.clerk` });
            console.log(`Auto-created user: ${clerkId}`);
        }

        const connections = await Connection.find({ userId: user._id });
        // Don't return tokens to the frontend!
        const safeConnections = connections.map(conn => ({
            id: conn._id,
            provider: conn.provider,
            lastScannedAt: conn.lastScannedAt,
            status: conn.status,
            metadata: conn.metadata
        }));

        res.json(safeConnections);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Add a new connection (Generic handler for MVP - in real app, OAuth callback handles this)
export const addConnection = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const { provider, token, metadata } = req.body;

        let user = await User.findOne({ clerkId });
        // Auto-create user if not found (MVP approach)
        if (!user) {
            user = await User.create({ clerkId, email: `${clerkId}@temp.clerk` });
            console.log(`Auto-created user: ${clerkId}`);
        }

        // Check connection limit for free users
        if (user.subscriptionStatus !== 'pro') {
            const count = await Connection.countDocuments({ userId: user._id });
            if (count >= 5) {
                return res.status(403).json({ message: 'Free plan limit reached (5 connections). Upgrade to Pro.' });
            }
        }

        // Check if connection already exists
        const existing = await Connection.findOne({ userId: user._id, provider });
        if (existing) {
            // Update existing
            existing.encryptedToken = encryptToken(token);
            existing.metadata = metadata || existing.metadata;
            existing.status = 'active';
            await existing.save();
            return res.json({ message: 'Connection updated', connectionId: existing._id });
        }

        // Create new
        const newConnection = new Connection({
            userId: user._id,
            provider,
            encryptedToken: encryptToken(token),
            metadata
        });

        await newConnection.save();
        res.status(201).json({ message: 'Connection added', connectionId: newConnection._id });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Remove a connection
export const removeConnection = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const { id } = req.params;

        const user = await User.findOne({ clerkId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        await Connection.findOneAndDelete({ _id: id, userId: user._id });
        res.json({ message: 'Connection removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
