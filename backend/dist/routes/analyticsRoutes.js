"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const analyticsController_1 = require("../controllers/analyticsController");
const router = express_1.default.Router();
// Public endpoint (no auth required)
router.get('/leaderboard', analyticsController_1.getLeaderboard);
// Protected endpoints
router.use(auth_1.requireAuth);
router.get('/summary', analyticsController_1.getAnalyticsSummary);
router.get('/trends', analyticsController_1.getAnalyticsTrends);
router.get('/forecast', analyticsController_1.getForecasting);
router.get('/history', analyticsController_1.getSavingsHistory);
router.get('/export', analyticsController_1.exportData);
router.get('/export/summary', analyticsController_1.getExportSummary);
exports.default = router;
