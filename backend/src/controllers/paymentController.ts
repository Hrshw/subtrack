import { Request, Response } from 'express';
import { PayUService } from '../services/PayUService';
import { User } from '../models/User';

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

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

export const handlePaymentSuccess = async (req: Request, res: Response) => {
    try {
        const responseData = req.body;
        console.log('💳 PayU Success Callback received:', responseData.txnid);

        // Verify payment hash
        const isValid = await PayUService.verifyPayment(responseData);

        if (!isValid) {
            console.error('❌ Payment verification failed for:', responseData.txnid);
            return res.redirect(`${CLIENT_URL}/payment/failure?reason=verification_failed`);
        }

        // Check payment status
        if (responseData.status !== 'success') {
            console.error('❌ Payment status not success:', responseData.status);
            return res.redirect(`${CLIENT_URL}/payment/failure?reason=payment_not_successful`);
        }

        // Handle successful payment - upgrade user to Pro
        await PayUService.handleSuccessfulPayment(responseData);

        // Redirect to frontend success page with transaction details
        const successParams = new URLSearchParams({
            txnid: responseData.txnid || '',
            amount: responseData.amount || '',
            status: 'success'
        });

        res.redirect(`${CLIENT_URL}/payment/success?${successParams.toString()}`);

    } catch (error) {
        console.error('Payment success handling error:', error);
        res.redirect(`${CLIENT_URL}/payment/failure?reason=server_error`);
    }
};

export const handlePaymentFailure = async (req: Request, res: Response) => {
    try {
        const responseData = req.body;
        console.log('❌ PayU Failure Callback received:', responseData.txnid, responseData.error_Message);

        // Build failure URL with details
        const failParams = new URLSearchParams({
            txnid: responseData.txnid || '',
            reason: responseData.error_Message || responseData.unmappedstatus || 'payment_failed'
        });

        res.redirect(`${CLIENT_URL}/payment/failure?${failParams.toString()}`);

    } catch (error) {
        console.error('Payment failure handling error:', error);
        res.redirect(`${CLIENT_URL}/payment/failure?reason=server_error`);
    }
};
