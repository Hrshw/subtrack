import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import { Request, Response, NextFunction } from 'express';

// Verify Clerk secret key is loaded
if (!process.env.CLERK_SECRET_KEY) {
    console.error('❌ CLERK_SECRET_KEY is missing in environment variables!');
    console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('CLERK')));
    throw new Error('CLERK_SECRET_KEY is required for authentication');
}

console.log('✅ Clerk initialized with secret key:', process.env.CLERK_SECRET_KEY.substring(0, 10) + '...');

// Enhanced auth middleware with debug logging
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    // DEBUG LOGGING
    console.log('🔒 Auth check for:', req.method, req.path);
    console.log('📋 Headers:', {
        authorization: req.headers.authorization ? 'Present' : 'MISSING',
        authLength: req.headers.authorization?.length || 0,
        contentType: req.headers['content-type']
    });

    if (!req.headers.authorization) {
        console.error('❌ NO AUTH HEADER!');
        return res.status(401).json({ error: 'Authorization header missing' });
    }

    return (ClerkExpressRequireAuth() as unknown as import('express').RequestHandler)(req, res, (err) => {
        if (err) {
            console.error('❌ Clerk Auth Error:', err.message || err);
            return next(err);
        }

        // @ts-ignore
        if (!req.auth?.userId) {
            console.error('❌ Clerk Auth Failed: No userId in req.auth');
            return res.status(401).json({ error: 'Authentication failed - no user ID' });
        }

        // @ts-ignore
        console.log('✅ Auth Success for user:', req.auth.userId.substring(0, 15) + '...');
        next();
    });
};

// Helper to get user ID from request
export const getAuthId = (req: Request): string | null => {
    // @ts-ignore - Clerk adds 'auth' to the request object
    const auth = req.auth;
    return auth?.userId || null;
};
