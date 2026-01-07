"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const userController_1 = require("../controllers/userController");
const router = express_1.default.Router();
// Public webhook route
router.post('/webhook', userController_1.syncUser);
// Protected routes
router.get('/me', auth_1.requireAuth, userController_1.getProfile);
router.patch('/me', auth_1.requireAuth, userController_1.updateProfile);
exports.default = router;
