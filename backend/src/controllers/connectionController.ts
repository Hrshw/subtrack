import { Request, Response } from 'express';
import { Connection } from '../models/Connection';
import { User } from '../models/User';
import { encryptToken } from '../utils/encryption';
import { RobotService } from '../services/RobotService';

// List all connections for the authenticated user
export const getConnections = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        let user = await User.findOne({ clerkId });

        // Auto-create user if not found (MVP approach)
        if (!user) {
            user = await User.create({
                clerkId,
                email: `${clerkId}@temp.clerk`,
                name: 'User'
            });
            console.log(`Auto-created user: ${clerkId}`);
        }

        const connections = await Connection.find({ userId: user._id }).sort({ isDefault: -1, createdAt: 1 });
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
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Add a new connection (Generic handler for MVP - in real app, OAuth callback handles this)
export const addConnection = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const { provider, token, metadata, accountLabel } = req.body;

        let user = await User.findOne({ clerkId });
        // Auto-create user if not found (MVP approach)
        if (!user) {
            user = await User.create({
                clerkId,
                email: `${clerkId}@temp.clerk`,
                name: 'User'
            });
            console.log(`Auto-created user: ${clerkId}`);
        }

        // Check connection limit for free users
        const totalConnections = await Connection.countDocuments({ userId: user._id });
        if (user.subscriptionStatus !== 'pro') {
            if (totalConnections >= 5) {
                return res.status(403).json({ message: 'Free plan limit reached (5 connections). Upgrade to Pro.' });
            }

            // Also check if they already have this provider (Free users get 1 per provider)
            const existing = await Connection.findOne({ userId: user._id, provider });
            if (existing && !accountLabel) {
                // If no label, update existing
                existing.encryptedToken = encryptToken(token);
                existing.metadata = metadata || existing.metadata;
                existing.status = 'active';
                await existing.save();
                return res.json({ message: 'Connection updated', connectionId: existing._id });
            }

            if (existing && accountLabel) {
                return res.status(403).json({ message: 'Multiple accounts for a single provider is a Pro feature.' });
            }
        }

        // Create new
        const newConnection = new Connection({
            userId: user._id,
            provider,
            encryptedToken: encryptToken(token),
            accountLabel: accountLabel || undefined,
            metadata: metadata || { type: 'manual' }
        });

        await newConnection.save();

        // Clear robot cache to refresh advice
        RobotService.clearCache(user._id.toString()).catch(err =>
            console.error('Failed to clear robot cache after connection:', err)
        );

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

        // Clear robot cache to refresh advice
        RobotService.clearCache(user._id.toString()).catch(err =>
            console.error('Failed to clear robot cache after disconnect:', err)
        );

        res.json({ message: 'Connection removed' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};

// Update connection label, environment, default status
export const updateConnection = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const { id } = req.params;
        const { accountLabel, environment, isDefault } = req.body;

        const user = await User.findOne({ clerkId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const connection = await Connection.findOne({ _id: id, userId: user._id });
        if (!connection) {
            return res.status(404).json({ message: 'Connection not found' });
        }

        // If setting as default, unset other defaults for this provider
        if (isDefault) {
            await Connection.updateMany(
                { userId: user._id, provider: connection.provider, _id: { $ne: id } },
                { isDefault: false }
            );
        }

        // Update fields
        if (accountLabel !== undefined) connection.accountLabel = accountLabel;
        if (environment !== undefined) connection.environment = environment;
        if (isDefault !== undefined) connection.isDefault = isDefault;

        await connection.save();
        res.json({
            message: 'Connection updated',
            connection: {
                id: connection._id,
                accountLabel: connection.accountLabel,
                environment: connection.environment,
                isDefault: connection.isDefault
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
