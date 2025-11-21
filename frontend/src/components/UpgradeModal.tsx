import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { motion } from 'framer-motion';
import { Crown, Check, Zap, TrendingUp, Lock, Sparkles } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { getApiUrl } from '../lib/api';
import axios from 'axios';
import { toast } from 'sonner';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    potentialSavings: number;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, potentialSavings }) => {
    const { getToken } = useAuth();
    const [loading, setLoading] = React.useState(false);

    const handleUpgrade = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            const apiUrl = getApiUrl();
            const response = await axios.post(
                `${apiUrl}/stripe/create-checkout-session`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            window.location.href = response.data.url;
        } catch (error) {
            console.error('Upgrade failed:', error);
            toast.error('Failed to start upgrade. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const roi = potentialSavings > 0 ? Math.round(potentialSavings / 799) : 0;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] bg-gradient-to-br from-slate-900 to-slate-950 border-emerald-500/30 text-white">
                <DialogHeader>
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring' }}
                        className="mx-auto mb-4"
                    >
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-2xl shadow-amber-500/50">
                            <Crown className="w-10 h-10 text-white" />
                        </div>
                    </motion.div>
                    <DialogTitle className="text-3xl font-bold text-center bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                        Unlock SubTrack Pro
                    </DialogTitle>
                    <DialogDescription className="text-center text-slate-300 text-lg">
                        {potentialSavings > 0 ? (
                            <>
                                You've found <span className="font-bold text-emerald-400">₹{potentialSavings.toLocaleString('en-IN')}/month</span> in savings.
                                <br />
                                Pro pays for itself <span className="font-bold text-amber-400">{roi}x over</span> instantly.
                            </>
                        ) : (
                            'Maximize your savings with unlimited connections and weekly auto-scans'
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-6">
                    {/* Pricing */}
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                            <span className="text-4xl font-black text-white">₹799</span>
                            <span className="text-slate-400">/month</span>
                        </div>
                        <p className="text-sm text-emerald-400">
                            Save ₹{((potentialSavings - 799) * 12).toLocaleString('en-IN')}/year after paying ₹9,588
                        </p>
                    </div>

                    {/* Features */}
                    <div className="space-y-3">
                        {[
                            { icon: Sparkles, text: 'Unlimited connections to all 8 integrations', highlight: true },
                            { icon: Zap, text: 'Weekly automatic scans (never miss a leak)', highlight: true },
                            { icon: TrendingUp, text: 'Savings history & trend charts' },
                            { icon: Lock, text: 'Priority support & early access to new features' },
                            { icon: Check, text: 'Export reports to CSV/PDF' },
                            { icon: Check, text: 'Cancel/downgrade with 1 click' }
                        ].map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className={`flex items-center gap-3 p-3 rounded-xl ${feature.highlight
                                        ? 'bg-emerald-500/10 border border-emerald-500/30'
                                        : 'bg-slate-800/50'
                                    }`}
                            >
                                <feature.icon className={`w-5 h-5 ${feature.highlight ? 'text-emerald-400' : 'text-slate-400'}`} />
                                <span className={feature.highlight ? 'font-semibold' : 'text-slate-300'}>{feature.text}</span>
                            </motion.div>
                        ))}
                    </div>

                    {/* CTA */}
                    <div className="space-y-3">
                        <Button
                            onClick={handleUpgrade}
                            disabled={loading}
                            size="lg"
                            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-lg py-6 shadow-2xl shadow-emerald-500/50"
                        >
                            {loading ? (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                                />
                            ) : (
                                <>
                                    <Crown className="w-5 h-5 mr-2" />
                                    Upgrade to Pro Now
                                </>
                            )}
                        </Button>
                        <p className="text-center text-xs text-slate-400">
                            Secure payment via Stripe • Cancel anytime • 30-day money-back guarantee
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default UpgradeModal;
