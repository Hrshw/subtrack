import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { XCircle, RefreshCw, ArrowLeft, AlertTriangle, HelpCircle } from 'lucide-react';
import { Button } from '../components/ui/button';

const PaymentFailure = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const reason = searchParams.get('reason') || 'unknown';
    const txnid = searchParams.get('txnid');

    const getErrorMessage = (reason: string) => {
        const messages: Record<string, string> = {
            'verification_failed': 'Payment verification failed. Please try again.',
            'payment_not_successful': 'The payment was not completed successfully.',
            'server_error': 'A server error occurred. Please try again.',
            'cancelled': 'You cancelled the payment.',
            'insufficient_funds': 'Insufficient funds in your account.',
            'card_declined': 'Your card was declined.',
            'unknown': 'An unknown error occurred.',
        };
        return messages[reason] || reason.replace(/_/g, ' ');
    };

    const commonIssues = [
        'Insufficient funds',
        'Payment gateway timeout',
        'Cancelled transaction',
        'Network connectivity issues',
        'Bank server down',
    ];

    return (
        <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Animated Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="relative z-10 max-w-lg w-full"
            >
                {/* Failure Card */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-red-500/50 rounded-3xl overflow-hidden shadow-2xl">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border-b border-red-500/30 p-8 text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                            className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4"
                        >
                            <XCircle className="w-12 h-12 text-white" />
                        </motion.div>

                        <h1 className="text-3xl font-black text-white mb-2">
                            Payment Failed
                        </h1>
                        <p className="text-red-300">
                            {getErrorMessage(reason)}
                        </p>
                    </div>

                    {/* Content */}
                    <div className="p-8">
                        {/* Transaction ID if available */}
                        {txnid && (
                            <div className="bg-slate-800/50 rounded-xl p-4 mb-6">
                                <p className="text-slate-400 text-sm">Transaction ID</p>
                                <p className="text-white font-mono text-sm">{txnid}</p>
                            </div>
                        )}

                        {/* Common Issues */}
                        <div className="bg-slate-800/30 rounded-xl p-6 mb-6">
                            <div className="flex items-center gap-2 mb-4">
                                <AlertTriangle className="w-5 h-5 text-amber-400" />
                                <span className="text-slate-300 font-medium">This could be due to:</span>
                            </div>
                            <ul className="space-y-2">
                                {commonIssues.map((issue, i) => (
                                    <motion.li
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 + i * 0.1 }}
                                        className="flex items-center gap-2 text-slate-400 text-sm"
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                                        {issue}
                                    </motion.li>
                                ))}
                            </ul>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            <Button
                                onClick={() => navigate('/checkout')}
                                className="w-full py-6 text-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl group"
                            >
                                <RefreshCw className="w-5 h-5 mr-2" />
                                <span>Try Again</span>
                            </Button>

                            <Button
                                onClick={() => navigate('/dashboard')}
                                variant="outline"
                                className="w-full py-6 text-lg border-slate-700 hover:bg-slate-800 text-white rounded-xl"
                            >
                                <ArrowLeft className="w-5 h-5 mr-2" />
                                <span>Back to Dashboard</span>
                            </Button>
                        </div>

                        {/* Help Link */}
                        <div className="mt-6 text-center">
                            <a
                                href="/support"
                                className="inline-flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors text-sm"
                            >
                                <HelpCircle className="w-4 h-4" />
                                <span>Need help? Contact Support</span>
                            </a>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default PaymentFailure;
