"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const db_1 = require("./config/db");
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const connectionRoutes_1 = __importDefault(require("./routes/connectionRoutes"));
const scanRoutes_1 = __importDefault(require("./routes/scanRoutes"));
const waitlistRoutes_1 = __importDefault(require("./routes/waitlistRoutes"));
const notificationRoutes_1 = __importDefault(require("./routes/notificationRoutes"));
const robotRoutes_1 = __importDefault(require("./routes/robotRoutes"));
const paymentRoutes_1 = __importDefault(require("./routes/paymentRoutes"));
const oauthRoutes_1 = __importDefault(require("./routes/oauthRoutes"));
const supportRoutes_1 = __importDefault(require("./routes/supportRoutes"));
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT) || 5000;
// CORS Configuration
const envOrigins = [
    process.env.CLIENT_URL,
    process.env.CLIENT_URLS,
];
const allowedOrigins = [
    ...envOrigins
        .filter(Boolean)
        .flatMap(origin => origin.split(','))
        .map(origin => origin.trim().replace(/\/$/, '')),
    // Production domain
    'https://subtrack.pulseguard.in',
    'http://subtrack.pulseguard.in',
    // Development
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5000',
];
// CORS middleware with explicit configuration
const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        const normalizedOrigin = origin.replace(/\/$/, '');
        // Allow exact matches from environment variables
        if (allowedOrigins.includes(normalizedOrigin)) {
            console.log(`CORS: Allowing configured origin: ${normalizedOrigin}`);
            return callback(null, true);
        }
        // Allow in development mode
        if (process.env.NODE_ENV === 'development') {
            console.log(`CORS: Allowing origin in development: ${normalizedOrigin}`);
            return callback(null, true);
        }
        console.warn(`CORS blocked origin: ${normalizedOrigin}. Allowed origins:`, allowedOrigins);
        callback(new Error(`Not allowed by CORS: ${normalizedOrigin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Length', 'Content-Type'],
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 204
};
app.use((0, cors_1.default)(corsOptions));
// Explicit CORS headers middleware
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
        const normalizedOrigin = origin.replace(/\/$/, '');
        const isAllowed = allowedOrigins.includes(normalizedOrigin);
        if (isAllowed || process.env.NODE_ENV === 'development') {
            // Explicitly set CORS headers
            res.setHeader('Access-Control-Allow-Origin', normalizedOrigin);
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
            res.setHeader('Access-Control-Max-Age', '86400');
        }
    }
    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }
    next();
});
app.use(express_1.default.json());
// Connect to Database
(0, db_1.connectDB)();
// Routes
app.use('/api/users', userRoutes_1.default);
app.use('/api/connections', connectionRoutes_1.default);
app.use('/api/scan', scanRoutes_1.default);
app.use('/api/waitlist', waitlistRoutes_1.default);
app.use('/api/notifications', notificationRoutes_1.default);
app.use('/api/robot', robotRoutes_1.default);
app.use('/api/payment', paymentRoutes_1.default);
app.use('/api/oauth', oauthRoutes_1.default);
app.use('/api/support', supportRoutes_1.default);
// Serve static frontend files from 'public' directory
const publicPath = path_1.default.join(__dirname, '..', 'public');
app.use(express_1.default.static(publicPath));
// Health check endpoint (API routes take priority)
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});
// CORS debug endpoint
app.get('/api/cors-debug', (req, res) => {
    res.status(200).json({
        origin: req.headers.origin,
        allowedOrigins: allowedOrigins,
        clientUrl: process.env.CLIENT_URL,
        clientUrls: process.env.CLIENT_URLS,
        nodeEnv: process.env.NODE_ENV
    });
});
// SPA catch-all: serve index.html for any non-API route (React Router handles client-side routing)
// Express 5.x requires named wildcards: use '*path' instead of '*'
app.get('/{*path}', (req, res) => {
    // Only serve index.html for non-API routes
    if (!req.path.startsWith('/api')) {
        res.sendFile(path_1.default.join(publicPath, 'index.html'));
    }
    else {
        res.status(404).json({ error: 'API endpoint not found' });
    }
});
// Error handling middleware
app.use((err, req, res, next) => {
    // Handle CORS errors specifically
    if (err.message && err.message.includes('CORS')) {
        console.error('CORS Error:', err.message);
        console.error('Request origin:', req.headers.origin);
        console.error('Allowed origins:', allowedOrigins);
        return res.status(403).json({
            error: 'CORS policy violation',
            message: err.message,
            origin: req.headers.origin
        });
    }
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message || 'Internal server error'
    });
});
// Start Server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
