import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, useUser } from '@clerk/clerk-react';
import {
    CheckCircle2,
    Shield,
    Zap,
    Crown,
    ArrowLeft,
    Loader2,
    CreditCard,
    Lock,
    Sparkles,
    Star,
    BadgeCheck
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { getApiUrl } from '../lib/api';
import axios from 'axios';

const Checkout = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { getToken } = useAuth();
    const { user } = useUser();

    const planParam = searchParams.get('plan') || 'annual';
    const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>(
        planParam === 'monthly' ? 'monthly' : 'annual'
    );
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const plans = {
        monthly: {
            name: 'Monthly',
            price: 799,
            period: '/month',
            savings: null,
            popular: false
        },
        annual: {
            name: 'Annual',
            price: 7999,
            originalPrice: 9588,
            period: '/year',
            savings: '17%',
            popular: true
        }
    };

    const features = [
        { icon: Zap, text: 'Unlimited service connections', highlight: true },
        { icon: Shield, text: 'Deep AWS infrastructure scan' },
        { icon: Sparkles, text: 'Savage AI recommendations' },
        { icon: Star, text: 'Weekly automated scans' },
        { icon: BadgeCheck, text: 'Priority support' },
        { icon: Crown, text: 'Export reports (PDF/CSV)' },
    ];

    const handlePayment = async () => {
        setIsProcessing(true);
        setError(null);

        try {
            const token = await getToken();
            const apiUrl = getApiUrl();

            // Create PayU payment session
            const response = await axios.post(
                `${apiUrl}/payment/create-session`,
                { plan: selectedPlan },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const paymentData = response.data;

            // Create and submit PayU form
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = paymentData.payuUrl;

            // Add all payment fields
            const fields = [
                'key', 'txnid', 'amount', 'productinfo', 'firstname',
                'email', 'phone', 'surl', 'furl', 'hash',
                'udf1', 'udf2', 'udf3', 'udf4', 'udf5'
            ];

            fields.forEach(field => {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = field;
                input.value = paymentData[field] || '';
                form.appendChild(input);
            });

            document.body.appendChild(form);
            form.submit();

        } catch (err: any) {
            console.error('Payment error:', err);
            setError(err.response?.data?.message || 'Failed to initiate payment. Please try again.');
            setIsProcessing(false);
        }
    };

    const currentPlan = plans[selectedPlan];

    return (
        <div className="min-h-screen bg-[#0a0e17] relative overflow-hidden">
            {/* Animated Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 -left-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-40 right-20 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            {/* Header */}
            <div className="relative z-10 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/pricing')}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back to Pricing</span>
                    </button>
                    <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm text-slate-400">Secure Checkout</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 max-w-6xl mx-auto px-6 py-12">
                <div className="grid lg:grid-cols-2 gap-12 items-start">

                    {/* Left: Order Summary */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-8"
                    >
                        <div>
                            <h1 className="text-3xl font-black text-white mb-2">
                                Upgrade to <span className="text-emerald-400">Pro</span>
                            </h1>
                            <p className="text-slate-400">
                                Join 1000+ indie hackers saving money on dev tools
                            </p>
                        </div>

                        {/* Plan Selection */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white">Select Plan</h3>
                            <div className="grid grid-cols-2 gap-4">
                                {(['monthly', 'annual'] as const).map((plan) => (
                                    <motion.button
                                        key={plan}
                                        onClick={() => setSelectedPlan(plan)}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`relative p-6 rounded-2xl border-2 transition-all text-left ${selectedPlan === plan
                                            ? 'border-emerald-500 bg-emerald-500/10'
                                            : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
                                            }`}
                                    >
                                        {plans[plan].popular && (
                                            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                                <span className="px-3 py-1 text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full">
                                                    BEST VALUE
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-3 mb-3">
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedPlan === plan
                                                ? 'border-emerald-500 bg-emerald-500'
                                                : 'border-slate-600'
                                                }`}>
                                                {selectedPlan === plan && (
                                                    <CheckCircle2 className="w-3 h-3 text-white" />
                                                )}
                                            </div>
                                            <span className="font-semibold text-white">{plans[plan].name}</span>
                                        </div>

                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-black text-white">₹{plans[plan].price.toLocaleString()}</span>
                                            <span className="text-slate-400 text-sm">{plans[plan].period}</span>
                                        </div>

                                        {plans[plan].savings && (
                                            <div className="mt-2 flex items-center gap-2">
                                                <span className="text-slate-500 line-through text-sm">
                                                    ₹{plans[plan].originalPrice?.toLocaleString()}
                                                </span>
                                                <span className="text-emerald-400 text-sm font-semibold">
                                                    Save {plans[plan].savings}
                                                </span>
                                            </div>
                                        )}
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        {/* Features */}
                        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6">
                            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Crown className="w-5 h-5 text-amber-400" />
                                What's included in Pro
                            </h3>
                            <div className="space-y-3">
                                {features.map((feature, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="flex items-center gap-3"
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${feature.highlight ? 'bg-emerald-500/20' : 'bg-slate-800'
                                            }`}>
                                            <feature.icon className={`w-4 h-4 ${feature.highlight ? 'text-emerald-400' : 'text-slate-400'
                                                }`} />
                                        </div>
                                        <span className={feature.highlight ? 'text-white font-medium' : 'text-slate-300'}>
                                            {feature.text}
                                        </span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        {/* Trust Badges */}
                        <div className="flex items-center gap-6 text-slate-500 text-sm">
                            <div className="flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                <span>256-bit encryption</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Lock className="w-4 h-4" />
                                <span>Secure payment</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right: Payment Card */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:sticky lg:top-8"
                    >
                        <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl border border-slate-800 overflow-hidden">
                            {/* Card Header */}
                            <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-b border-slate-800 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Order Summary</h2>
                                        <p className="text-slate-400 text-sm mt-1">SubTrack Pro - {currentPlan.name}</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                                        <CreditCard className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-6 space-y-6">
                                {/* User Info */}
                                <div className="bg-slate-800/50 rounded-xl p-4">
                                    <p className="text-slate-400 text-sm mb-1">Billing email</p>
                                    <p className="text-white font-medium">{user?.primaryEmailAddress?.emailAddress}</p>
                                </div>

                                {/* Price Breakdown */}
                                <div className="space-y-3">
                                    <div className="flex justify-between text-slate-300">
                                        <span>SubTrack Pro ({currentPlan.name})</span>
                                        <span>₹{currentPlan.price.toLocaleString()}</span>
                                    </div>
                                    {currentPlan.savings && (
                                        <div className="flex justify-between text-emerald-400 text-sm">
                                            <span>Annual discount ({currentPlan.savings} off)</span>
                                            <span>-₹{(9588 - 7999).toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="border-t border-slate-700 pt-3 flex justify-between">
                                        <span className="text-lg font-semibold text-white">Total</span>
                                        <div className="text-right">
                                            <span className="text-2xl font-black text-white">₹{currentPlan.price.toLocaleString()}</span>
                                            <p className="text-slate-400 text-sm">{currentPlan.period}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Error Message */}
                                <AnimatePresence>
                                    {error && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm"
                                        >
                                            {error}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Payment Button */}
                                <Button
                                    onClick={handlePayment}
                                    disabled={isProcessing}
                                    className="w-full py-6 text-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/25 transition-all"
                                >
                                    {isProcessing ? (
                                        <div className="flex items-center gap-3">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Processing...</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <Lock className="w-5 h-5" />
                                            <span>Pay ₹{currentPlan.price.toLocaleString()}</span>
                                        </div>
                                    )}
                                </Button>

                                {/* Payment Methods */}
                                <div className="text-center">
                                    <p className="text-slate-500 text-sm mb-3">Powered by PayU - India's trusted payment gateway</p>
                                    <div className="flex items-center justify-center gap-4 text-slate-600">
                                        <span className="text-xs">UPI</span>
                                        <span className="text-xs">Cards</span>
                                        <span className="text-xs">NetBanking</span>
                                        <span className="text-xs">Wallets</span>
                                    </div>
                                </div>

                                {/* Guarantee */}
                                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 text-center">
                                    <p className="text-emerald-400 text-sm font-medium">
                                        ✨ 7-day money-back guarantee
                                    </p>
                                    <p className="text-slate-400 text-xs mt-1">
                                        Not satisfied? Get a full refund, no questions asked.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Testimonial */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="mt-6 bg-slate-900/30 rounded-xl p-4 border border-slate-800"
                        >
                            <div className="flex gap-1 mb-2">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                                ))}
                            </div>
                            <p className="text-slate-300 text-sm italic">
                                "Paid ₹799, saved ₹15,000 in the first 10 minutes. If you're not using this, you hate money."
                            </p>
                            <p className="text-slate-500 text-sm mt-2">— Danny Postma, @dannypostma</p>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;
