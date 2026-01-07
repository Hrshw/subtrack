"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendChatMessage = exports.getRobotSpeech = void 0;
const RobotService_1 = require("../services/RobotService");
const User_1 = require("../models/User");
const getRobotSpeech = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        let user = yield User_1.User.findOne({ clerkId });
        if (!user) {
            user = yield User_1.User.create({
                clerkId,
                email: `${clerkId}@temp.clerk`,
                name: 'User'
            });
            console.log(`Auto-created user for robot: ${clerkId}`);
        }
        const speech = yield RobotService_1.RobotService.getRobotSpeech(user._id.toString());
        res.json({ message: speech });
    }
    catch (error) {
        console.error('Robot speech error:', error);
        res.status(500).json({ message: 'Error generating robot speech' });
    }
});
exports.getRobotSpeech = getRobotSpeech;
const sendChatMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const { message } = req.body;
        if (!message || typeof message !== 'string') {
            return res.status(400).json({ message: 'Message is required' });
        }
        let user = yield User_1.User.findOne({ clerkId });
        if (!user) {
            user = yield User_1.User.create({
                clerkId,
                email: `${clerkId}@temp.clerk`,
                name: 'User'
            });
            console.log(`Auto-created user for chat: ${clerkId}`);
        }
        const response = yield RobotService_1.RobotService.handleChatMessage(user._id.toString(), message);
        res.json(response);
    }
    catch (error) {
        console.error('Chat message error:', error);
        res.status(500).json({ message: 'Error processing chat message' });
    }
});
exports.sendChatMessage = sendChatMessage;
