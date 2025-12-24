import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Sparkles, Crown, Zap, Shield, Star, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import Confetti from 'react-confetti';

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [showConfetti, setShowConfetti] = useState(true);

    const txnid = searchParams.get('txnid');
    const amount = searchParams.get('amount');

    useEffect(() => {
        // Stop confetti after 5 seconds
        const timer = setTimeout(() => setShowConfetti(false), 5000);
        return () => clearTimeout(timer);
    }, []);

    const features = [
        { icon: Zap, text: 'Unlimited connections' },
        { icon: Shield, text: 'Deep AWS Scan' },
        { icon: Sparkles, text: 'Savage AI Recommendations' },
        { icon: Star, text: 'Weekly Auto-Scans' },
        { icon: Crown, text: 'Priority Support' },
    ];

    return (
        <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Animated Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="relative z-10 max-w-lg w-full"
            >
                {/* Success Card */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-emerald-500/50 rounded-3xl overflow-hidden shadow-2xl shadow-emerald-500/10">
                    {/* Header with gradient */}
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-8 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />

                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                            className="relative z-10 w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl"
                        >
                            <CheckCircle2 className="w-14 h-14 text-emerald-500" />
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="relative z-10 text-3xl font-black text-white mb-2"
                        >
                            Welcome to Pro! 🎉
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="relative z-10 text-emerald-100"
                        >
                            Your payment was successful
                        </motion.p>
                    </div>

                    {/* Content */}
                    <div className="p-8">
                        {/* Transaction Details */}
                        {(txnid || amount) && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 }}
                                className="bg-slate-800/50 rounded-xl p-4 mb-6 flex justify-between items-center"
                            >
                                <div>
                                    <p className="text-slate-400 text-sm">Transaction ID</p>
                                    <p className="text-white font-mono text-sm">{txnid}</p>
                                </div>
                                {amount && (
                                    <div className="text-right">
                                        <p className="text-slate-400 text-sm">Amount</p>
                                        <p className="text-emerald-400 font-bold">₹{parseFloat(amount).toLocaleString()}</p>
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* Features */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                            className="space-y-3 mb-8"
                        >
                            <p className="text-slate-300 font-medium mb-4">You now have access to:</p>
                            {features.map((feature, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.9 + i * 0.1 }}
                                    className="flex items-center gap-3"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                        <feature.icon className="w-4 h-4 text-emerald-400" />
                                    </div>
                                    <span className="text-slate-300">{feature.text}</span>
                                </motion.div>
                            ))}
                        </motion.div>

                        {/* CTA Button */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.4 }}
                        >
                            <Button
                                onClick={() => navigate('/dashboard')}
                                className="w-full py-6 text-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl group"
                            >
                                <span>Go to Dashboard</span>
                                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </motion.div>

                        {/* Support Text */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.5 }}
                            className="text-center text-slate-500 text-sm mt-6"
                        >
                            Need help? Contact us at{' '}
                            <a href="mailto:support@subtrack.in" className="text-emerald-400 hover:underline">
                                support@subtrack.in
                            </a>
                        </motion.p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default PaymentSuccess;
