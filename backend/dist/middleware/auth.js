"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuthId = exports.requireAuth = void 0;
const clerk_sdk_node_1 = require("@clerk/clerk-sdk-node");
// Verify Clerk secret key is loaded
if (!process.env.CLERK_SECRET_KEY) {
    console.error('❌ CLERK_SECRET_KEY is missing in environment variables!');
    console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('CLERK')));
    throw new Error('CLERK_SECRET_KEY is required for authentication');
}
console.log('✅ Clerk initialized with secret key:', process.env.CLERK_SECRET_KEY.substring(0, 10) + '...');
// Enhanced auth middleware with debug logging
const requireAuth = (req, res, next) => {
    var _a;
    // DEBUG LOGGING
    console.log('🔒 Auth check for:', req.method, req.path);
    console.log('📋 Headers:', {
        authorization: req.headers.authorization ? 'Present' : 'MISSING',
        authLength: ((_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.length) || 0,
        contentType: req.headers['content-type']
    });
    if (!req.headers.authorization) {
        console.error('❌ NO AUTH HEADER!');
        return res.status(401).json({ error: 'Authorization header missing' });
    }
    return (0, clerk_sdk_node_1.ClerkExpressRequireAuth)()(req, res, (err) => {
        var _a;
        if (err) {
            console.error('❌ Clerk Auth Error:', err.message || err);
            return next(err);
        }
        // @ts-ignore
        if (!((_a = req.auth) === null || _a === void 0 ? void 0 : _a.userId)) {
            console.error('❌ Clerk Auth Failed: No userId in req.auth');
            return res.status(401).json({ error: 'Authentication failed - no user ID' });
        }
        // @ts-ignore
        console.log('✅ Auth Success for user:', req.auth.userId.substring(0, 15) + '...');
        next();
    });
};
exports.requireAuth = requireAuth;
// Helper to get user ID from request
const getAuthId = (req) => {
    // @ts-ignore - Clerk adds 'auth' to the request object
    const auth = req.auth;
    return (auth === null || auth === void 0 ? void 0 : auth.userId) || null;
};
exports.getAuthId = getAuthId;
