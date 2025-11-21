import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { XCircle } from 'lucide-react';
import { Button } from '../components/ui/button';

const PaymentFailure = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full bg-slate-900 border-2 border-red-500 rounded-3xl p-8 text-center"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                    <XCircle className="w-12 h-12 text-white" />
                </motion.div>

                <h1 className="text-3xl font-black text-white mb-4">
                    Payment Failed
                </h1>

                <p className="text-slate-300 mb-8">
                    Your payment could not be processed. This could be due to:
                </p>

                <div className="bg-slate-950 rounded-2xl p-6 mb-8 text-left space-y-2 text-slate-400 text-sm">
                    <p>• Insufficient funds</p>
                    <p>• Payment gateway timeout</p>
                    <p>• Cancelled transaction</p>
                    <p>• Network error</p>
                </div>

                <div className="space-y-3">
                    <Button
                        onClick={() => navigate('/pricing')}
                        className="w-full py-6 text-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
                    >
                        Try Again
                    </Button>
                    <Button
                        onClick={() => navigate('/dashboard')}
                        variant="outline"
                        className="w-full py-6 text-lg border-slate-700 hover:bg-slate-800 text-white"
                    >
                        Back to Dashboard
                    </Button>
                </div>
            </motion.div>
        </div>
    );
};

export default PaymentFailure;
