import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import Confetti from 'react-confetti';
import { getApiUrl } from '../lib/api';
import axios from 'axios';

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [isVerifying, setIsVerifying] = useState(true);

    useEffect(() => {
        verifyPayment();
    }, []);

    const verifyPayment = async () => {
        try {
            // Get all PayU response params
            const payuResponse: any = {};
            searchParams.forEach((value, key) => {
                payuResponse[key] = value;
            });

            const apiUrl = getApiUrl();
            const response = await axios.post(`${apiUrl}/payment/response`, payuResponse);

            if (!response.data.success) {
                navigate('/payment/failure');
            }
        } catch (error) {
            console.error('Payment verification failed:', error);
            navigate('/payment/failure');
        } finally {
            setIsVerifying(false);
        }
    };

    if (isVerifying) {
        return (
            <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-16 h-16 text-emerald-500 animate-spin mx-auto mb-4" />
                    <p className="text-white text-xl">Verifying your payment...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center p-6">
            <Confetti recycle={false} numberOfPieces={500} />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full bg-slate-900 border-2 border-emerald-500 rounded-3xl p-8 text-center"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                    <CheckCircle2 className="w-12 h-12 text-white" />
                </motion.div>

                <h1 className="text-3xl font-black text-white mb-4">
                    Welcome to Pro! 🎉
                </h1>

                <p className="text-slate-300 mb-8">
                    Your payment was successful. You now have access to:
                </p>

                <div className="bg-slate-950 rounded-2xl p-6 mb-8 text-left space-y-3">
                    <div className="flex items-center gap-3 text-emerald-400">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Unlimited connections</span>
                    </div>
                    <div className="flex items-center gap-3 text-emerald-400">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Deep AWS Scan</span>
                    </div>
                    <div className="flex items-center gap-3 text-emerald-400">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Savage AI Recommendations</span>
                    </div>
                    <div className="flex items-center gap-3 text-emerald-400">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Weekly Auto-Scans</span>
                    </div>
                </div>

                <Button
                    onClick={() => navigate('/dashboard')}
                    className="w-full py-6 text-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
                >
                    Go to Dashboard
                </Button>
            </motion.div>
        </div>
    );
};

export default PaymentSuccess;
