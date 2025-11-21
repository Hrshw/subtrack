// Vercel serverless function wrapper for Express backend
// This file exports the Express app for Vercel's serverless environment
// The backend must be built first (npm run build in backend/) to generate backend/dist/

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from '../backend/dist/config/db';
import userRoutes from '../backend/dist/routes/userRoutes';
import connectionRoutes from '../backend/dist/routes/connectionRoutes';
import scanRoutes from '../backend/dist/routes/scanRoutes';
import stripeRoutes from '../backend/dist/routes/stripeRoutes';
import waitlistRoutes from '../backend/dist/routes/waitlistRoutes';
import notificationRoutes from '../backend/dist/routes/notificationRoutes';

const app = express();

// CORS Configuration - Allow same origin (no CORS needed when frontend and backend are on same domain)
// Since everything is on the same Vercel domain, we can allow all origins or just same origin
const corsOptions = {
    origin: true, // Allow same origin - Vercel handles this automatically
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Length', 'Content-Type'],
    maxAge: 86400,
    preflightContinue: false,
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Stripe webhook must be before express.json() to get raw body
app.use('/api/stripe', stripeRoutes);

app.use(express.json());

// Connect to Database (Vercel caches this connection)
let dbConnected = false;
if (!dbConnected) {
    connectDB();
    dbConnected = true;
}

// Routes - these already have /api prefix in the Express app
app.use('/api/users', userRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/waitlist', waitlistRoutes);
app.use('/api/notifications', notificationRoutes);

// Basic Route
app.get('/', (req, res) => {
    res.send('SubTrack API is running');
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production'
    });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message || 'Internal server error'
    });
});

// Export for Vercel serverless
export default app;

