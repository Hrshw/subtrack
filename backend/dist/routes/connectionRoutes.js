"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const connectionController_1 = require("../controllers/connectionController");
const router = express_1.default.Router();
router.use(auth_1.requireAuth);
router.get('/', connectionController_1.getConnections);
router.post('/', connectionController_1.addConnection);
router.patch('/:id', connectionController_1.updateConnection);
router.delete('/:id', connectionController_1.removeConnection);
exports.default = router;
