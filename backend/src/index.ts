import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { connectDB } from './config/db';
import userRoutes from './routes/userRoutes';
import connectionRoutes from './routes/connectionRoutes';
import scanRoutes from './routes/scanRoutes';
import waitlistRoutes from './routes/waitlistRoutes';
import notificationRoutes from './routes/notificationRoutes';
import robotRoutes from './routes/robotRoutes';
import paymentRoutes from './routes/paymentRoutes';
import oauthRoutes from './routes/oauthRoutes';
import supportRoutes from './routes/supportRoutes';

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// CORS Configuration
const envOrigins = [
    process.env.CLIENT_URL,
    process.env.CLIENT_URLS,
];

const allowedOrigins = [
    ...envOrigins
        .filter(Boolean)
        .flatMap(origin => origin!.split(','))
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
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

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

app.use(cors(corsOptions));

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

app.use(express.json());

// Connect to Database
connectDB();

// Routes
app.use('/api/users', userRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/robot', robotRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/support', supportRoutes);

// Serve static frontend files from 'public' directory
const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));

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
        res.sendFile(path.join(publicPath, 'index.html'));
    } else {
        res.status(404).json({ error: 'API endpoint not found' });
    }
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
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
