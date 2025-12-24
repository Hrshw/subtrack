"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const robotController_1 = require("../controllers/robotController");
const router = express_1.default.Router();
router.use(auth_1.requireAuth);
// GET /robot/speech - Get dynamic robot speech bubble
router.get('/speech', robotController_1.getRobotSpeech);
// POST /robot/chat - Send chat message to robot
router.post('/chat', robotController_1.sendChatMessage);
exports.default = router;
