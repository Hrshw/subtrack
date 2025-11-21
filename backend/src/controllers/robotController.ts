import { Request, Response } from 'express';
import { RobotService } from '../services/RobotService';
import { User } from '../models/User';

export const getRobotSpeech = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const user = await User.findOne({ clerkId });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const speech = await RobotService.getRobotSpeech(user._id.toString());
        res.json({ message: speech });
    } catch (error) {
        console.error('Robot speech error:', error);
        res.status(500).json({ message: 'Error generating robot speech' });
    }
};

export const sendChatMessage = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const { message } = req.body;

        if (!message || typeof message !== 'string') {
            return res.status(400).json({ message: 'Message is required' });
        }

        const user = await User.findOne({ clerkId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const response = await RobotService.handleChatMessage(user._id.toString(), message);
        res.json(response);
    } catch (error) {
        console.error('Chat message error:', error);
        res.status(500).json({ message: 'Error processing chat message' });
    }
};
