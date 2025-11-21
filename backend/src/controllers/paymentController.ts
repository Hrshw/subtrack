import { Request, Response } from 'express';
import { PayUService } from '../services/PayUService';
import { User } from '../models/User';

export const createPaymentSession = async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const clerkId = req.auth.userId;
        const { plan = 'annual' } = req.body; // 'monthly' or 'annual'

        const user = await User.findOne({ clerkId });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const paymentData = await PayUService.createPaymentSession(
            user._id.toString(),
            user.email,
            plan
        );

        res.json(paymentData);
    } catch (error) {
        console.error('Payment session creation error:', error);
        res.status(500).json({ message: 'Error creating payment session' });
    }
};

export const handlePaymentResponse = async (req: Request, res: Response) => {
    try {
        const responseData = req.body;

        // Verify payment
        const isValid = await PayUService.verifyPayment(responseData);

        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: 'Payment verification failed'
            });
        }

        // Handle successful payment
        if (responseData.status === 'success') {
            await PayUService.handleSuccessfulPayment(responseData);
            return res.json({
                success: true,
                message: 'Payment successful! Welcome to Pro 🎉'
            });
        }

        res.json({
            success: false,
            message: 'Payment was not successful'
        });

    } catch (error) {
        console.error('Payment response handling error:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing payment response'
        });
    }
};
