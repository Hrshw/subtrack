import express from 'express';
import { requireAuth } from '../middleware/auth';
import { getRobotSpeech, sendChatMessage } from '../controllers/robotController';

const router = express.Router();

router.use(requireAuth);

// GET /robot/speech - Get dynamic robot speech bubble
router.get('/speech', getRobotSpeech);

// POST /robot/chat - Send chat message to robot
router.post('/chat', sendChatMessage);

export default router;
