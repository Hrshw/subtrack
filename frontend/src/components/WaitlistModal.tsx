import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { motion } from 'framer-motion';
import { Sparkles, Check, Zap, TrendingUp, Lock, Mail, Bell } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { getApiUrl } from '../lib/api';
import axios from 'axios';
import { toast } from 'sonner';
import Confetti from 'react-confetti';
import { useCurrency } from '../contexts/CurrencyContext';

interface WaitlistModalProps {
    isOpen: boolean;
    onClose: () => void;
    potentialSavings: number;
}

const WaitlistModal: React.FC<WaitlistModalProps> = ({ isOpen, onClose, potentialSavings }) => {
    const { getToken, userId } = useAuth();
    const { formatAmount, getSymbol } = useCurrency();
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [email, setEmail] = useState('');
    const [expectedSavings, setExpectedSavings] = useState(potentialSavings.toString());
    const [waitlistPosition, setWaitlistPosition] = useState(0);
    const [showConfetti, setShowConfetti] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = await getToken();
            const apiUrl = getApiUrl();
            const response = await axios.post(
                `${apiUrl}/waitlist/join`,
                {
                    email,
                    expectedSavings: parseInt(expectedSavings) || 0,
                    userId
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setWaitlistPosition(response.data.position);
            setSubmitted(true);
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 5000);
            toast.success('🎉 You\'re on the waitlist! We\'ll email you first when Pro launches.');
        } catch (error: any) {
            console.error('Waitlist join failed:', error);
            if (error.response?.data?.message === 'Already on waitlist') {
                toast.info('You\'re already on the waitlist!');
                setSubmitted(true);
                setWaitlistPosition(error.response.data.position);
            } else {
                toast.error('Failed to join waitlist. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-slate-900 to-slate-950 border-emerald-500/30 text-white">
                    <DialogHeader>
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: 'spring' }}
                            className="mx-auto mb-4"
                        >
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-2xl shadow-amber-500/50">
                                <Bell className="w-10 h-10 text-white" />
                            </div>
                        </motion.div>
                        <DialogTitle className="text-2xl md:text-3xl font-bold text-center bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                            SubTrack Pro Launching Soon!
                        </DialogTitle>
                        <DialogDescription className="text-center text-slate-300 text-base md:text-lg">
                            {potentialSavings > 0 ? (
                                <>
                                    You've found <span className="font-bold text-emerald-400">{formatAmount(potentialSavings)}/month</span> in savings.
                                    <br />
                                    Get <span className="font-bold text-amber-400">first access</span> when Pro launches!
                                </>
                            ) : (
                                'Be the first to know when we launch unlimited connections & weekly auto-scans'
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    {!submitted ? (
                        <div className="space-y-6 py-4 md:py-6">
                            {/* Pro Features Preview */}
                            <div className="space-y-2 md:space-y-3">
                                <h3 className="text-sm font-semibold text-amber-400 mb-3">What you'll get with Pro:</h3>
                                {[
                                    { icon: Sparkles, text: 'Unlimited connections & Multi-Account Support' },
                                    { icon: Zap, text: 'Weekly automatic scans (never miss a leak)' },
                                    { icon: TrendingUp, text: 'Savings history & trend charts' },
                                    { icon: Lock, text: 'Priority support & early access' },
                                    { icon: Check, text: 'Export reports & 1-click cancel' }
                                ].map((feature, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="flex items-center gap-3 p-2 md:p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30"
                                    >
                                        <feature.icon className="w-4 h-4 md:w-5 md:h-5 text-emerald-400 flex-shrink-0" />
                                        <span className="text-sm md:text-base font-medium">{feature.text}</span>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Waitlist Form */}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-sm font-medium">Email Address *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        required
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="savings" className="text-sm font-medium">Expected Monthly Savings (Optional)</Label>
                                    <Input
                                        id="savings"
                                        type="number"
                                        placeholder={`Enter amount in ${getSymbol()}`}
                                        value={expectedSavings}
                                        onChange={(e) => setExpectedSavings(e.target.value)}
                                        className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500"
                                    />
                                    <p className="text-xs text-slate-500">Helps us prioritize features for your needs</p>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    size="lg"
                                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-base md:text-lg py-5 md:py-6 shadow-2xl shadow-emerald-500/50"
                                >
                                    {loading ? (
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                                        />
                                    ) : (
                                        <>
                                            <Mail className="w-5 h-5 mr-2" />
                                            Get Notified First
                                        </>
                                    )}
                                </Button>
                            </form>

                            <p className="text-center text-xs text-slate-400">
                                We'll email you as soon as Pro launches • No spam, guaranteed
                            </p>
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="py-6 md:py-8 space-y-6 text-center"
                        >
                            <div className="text-6xl md:text-7xl mb-4">🎉</div>
                            <h3 className="text-2xl md:text-3xl font-black text-emerald-400">You're In!</h3>
                            <div className="space-y-2">
                                <p className="text-lg md:text-xl text-slate-300">
                                    You're <span className="font-bold text-amber-400">#{waitlistPosition}</span> on the waitlist
                                </p>
                                <p className="text-sm md:text-base text-slate-400">
                                    We'll email you at <span className="text-white font-semibold">{email}</span> the moment Pro launches
                                </p>
                            </div>

                            <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-xl p-4 md:p-6">
                                <p className="text-sm md:text-base text-slate-300">
                                    💡 <span className="font-semibold">Tip:</span> Share SubTrack with friends to move up the list!
                                </p>
                            </div>

                            <Button
                                onClick={onClose}
                                variant="outline"
                                className="border-slate-700 hover:bg-slate-800"
                            >
                                Close
                            </Button>
                        </motion.div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
};

export default WaitlistModal;
