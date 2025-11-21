import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import { Request, Response, NextFunction } from 'express';

// This middleware will ensure the request is authenticated by Clerk
// It attaches the auth object to the request
export const requireAuth = ClerkExpressRequireAuth({
    // Add any specific configuration here if needed
}) as unknown as import('express').RequestHandler;

// Helper to get user ID from request (if using loose auth or custom handling)
export const getAuthId = (req: Request): string | null => {
    // @ts-ignore - Clerk adds 'auth' to the request object
    return req.auth?.userId || null;
};
