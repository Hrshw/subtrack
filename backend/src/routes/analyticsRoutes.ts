import express from 'express';
import { requireAuth } from '../middleware/auth';
import {
    getAnalyticsSummary,
    getAnalyticsTrends,
    getForecasting,
    getSavingsHistory,
    getLeaderboard,
    exportData,
    getExportSummary
} from '../controllers/analyticsController';

const router = express.Router();

// Public endpoint (no auth required)
router.get('/leaderboard', getLeaderboard);

// Protected endpoints
router.use(requireAuth);

router.get('/summary', getAnalyticsSummary);
router.get('/trends', getAnalyticsTrends);
router.get('/forecast', getForecasting);
router.get('/history', getSavingsHistory);
router.get('/export', exportData);
router.get('/export/summary', getExportSummary);

export default router;
