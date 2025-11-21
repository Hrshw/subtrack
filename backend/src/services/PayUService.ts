import crypto from 'crypto';
import { User } from '../models/User';

const PAYU_URL = process.env.PAYU_URL || 'https://secure.payu.in';
const PAYU_MERCHANT_KEY = process.env.PAYU_MERCHANT_KEY || '';
const PAYU_SALT = process.env.PAYU_SALT || '';

export class PayUService {
    /**
     * Create PayU payment form data
     * Returns HTML form that auto-submits to PayU
     */
    static async createPaymentSession(userId: string, userEmail: string, plan: 'monthly' | 'annual' = 'annual') {
        try {
            const user = await User.findById(userId);
            if (!user) throw new Error('User not found');

            // Pricing
            const amount = plan === 'annual' ? '7999' : '799';
            const productInfo = plan === 'annual'
                ? 'SubTrack Pro - Annual Plan (Save 17%)'
                : 'SubTrack Pro - Monthly Plan';

            // Generate unique transaction ID
            const txnid = `SUBTRACK_${Date.now()}_${userId.substring(0, 8)}`;

            // PayU required fields
            const paymentData = {
                key: PAYU_MERCHANT_KEY,
                txnid,
                amount,
                productinfo: productInfo,
                firstname: user.email.split('@')[0], // Use email username as firstname
                email: userEmail,
                phone: '9999999999', // Default - user can update on PayU page
                surl: `${process.env.CLIENT_URL}/payment/success`, // Success URL
                furl: `${process.env.CLIENT_URL}/payment/failure`, // Failure URL
                udf1: userId, // Store userId for webhook processing
                udf2: plan,
                udf3: '',
                udf4: '',
                udf5: ''
            };

            // Generate hash
            // Hash format: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT
            const hashString = `${paymentData.key}|${paymentData.txnid}|${paymentData.amount}|${paymentData.productinfo}|${paymentData.firstname}|${paymentData.email}|${paymentData.udf1}|${paymentData.udf2}|${paymentData.udf3}|${paymentData.udf4}|${paymentData.udf5}||||||${PAYU_SALT}`;

            const hash = crypto.createHash('sha512').update(hashString).digest('hex');

            console.log(`💳 PayU session created for user ${userId}`);
            console.log(`   Amount: ₹${amount}, Plan: ${plan}, TxnID: ${txnid}`);

            return {
                ...paymentData,
                hash,
                payuUrl: `${PAYU_URL}/_payment`
            };

        } catch (error) {
            console.error('PayU session creation failed:', error);
            throw error;
        }
    }

    /**
     * Verify PayU webhook/response
     * Called after payment completion
     */
    static async verifyPayment(responseData: any): Promise<boolean> {
        try {
            const {
                key,
                txnid,
                amount,
                productinfo,
                firstname,
                email,
                status,
                hash: receivedHash,
                udf1, // userId
                udf2, // plan
                udf3,
                udf4,
                udf5
            } = responseData;

            // Reverse hash for verification
            // Format: SALT|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
            const hashString = `${PAYU_SALT}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
            const calculatedHash = crypto.createHash('sha512').update(hashString).digest('hex');

            if (calculatedHash !== receivedHash) {
                console.error('❌ PayU hash mismatch!');
                return false;
            }

            console.log(`✅ PayU payment verified: ${txnid}, Status: ${status}`);
            return status === 'success';

        } catch (error) {
            console.error('PayU verification failed:', error);
            return false;
        }
    }

    /**
     * Handle successful payment
     * Upgrade user to Pro
     */
    static async handleSuccessfulPayment(responseData: any) {
        try {
            const { udf1: userId, udf2: plan, txnid, amount } = responseData;

            if (!userId) {
                throw new Error('User ID not found in payment response');
            }

            // Update user to Pro
            const user = await User.findByIdAndUpdate(
                userId,
                {
                    subscriptionStatus: 'pro',
                    // You can add more fields like subscriptionStartDate, subscriptionEndDate, etc.
                },
                { new: true }
            );

            if (!user) {
                throw new Error('User not found');
            }

            console.log(`🎉 User ${userId} upgraded to Pro!`);
            console.log(`   Plan: ${plan}, Amount: ₹${amount}, TxnID: ${txnid}`);

            // TODO: Send confirmation email
            // TODO: Log transaction in database

            return user;

        } catch (error) {
            console.error('Failed to handle successful payment:', error);
            throw error;
        }
    }
}
