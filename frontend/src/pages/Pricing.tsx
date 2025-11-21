import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Crown, Star } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Confetti from 'react-confetti';
import { toast } from 'sonner';
import { getApiUrl } from '../lib/api';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';

const Pricing = () => {
    const [isAnnual, setIsAnnual] = useState(true);
    const [showConfetti, setShowConfetti] = useState(false);
    const [leaksInput, setLeaksInput] = useState(47000);
    const [isLoading, setIsLoading] = useState(false);
    const paymentFormRef = useRef<HTMLFormElement>(null);
    const { getToken } = useAuth();

    const handleSubscribe = async () => {
        try {
            setIsLoading(true);
            setShowConfetti(true);
            toast.success("Redirecting to payment gateway...");

            const token = await getToken();
            const apiUrl = getApiUrl();

            // Get PayU payment session
            const response = await axios.post(
                `${apiUrl}/payment/create-session`,
                { plan: isAnnual ? 'annual' : 'monthly' },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const paymentData = response.data;

            // Create and submit PayU form
            const form = paymentFormRef.current;
            if (!form) return;

            // Populate form fields
            Object.keys(paymentData).forEach(key => {
                if (key !== 'payuUrl') {
                    const input = form.elements.namedItem(key) as HTMLInputElement;
                    if (input) {
                        input.value = paymentData[key];
                    }
                }
            });

            // Set PayU URL
            form.action = paymentData.payuUrl;

            // Auto-submit form
            setTimeout(() => {
                form.submit();
            }, 1000);

        } catch (error) {
            console.error('Payment initiation failed:', error);
            toast.error("Failed to initiate payment. Please try again.");
            setShowConfetti(false);
        } finally {
            setIsLoading(false);
        }
    };

    const roiMinutes = Math.round((799 / leaksInput) * 30 * 24 * 60);
    const roiHours = Math.round((799 / leaksInput) * 30 * 24);

    const roiText = roiMinutes < 60
        ? `${roiMinutes} minutes`
        : `${roiHours} hours`;

    return (
        <div className="min-h-screen bg-[#0a0e17] text-white font-sans selection:bg-emerald-500/30">
            <Navbar />
            {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}

            <main className="pt-32 pb-20 relative overflow-hidden">
                {/* Background Effects */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[800px] bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    {/* Hero */}
                    <div className="text-center mb-20">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-sm mb-6"
                        >
                            <Zap className="w-4 h-4" />
                            Launch Offer: Save 20% on Annual Plans
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent"
                        >
                            Unlock <span className="text-emerald-400">4x More Savings</span><br />with SubTrack Pro
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl text-slate-400 max-w-2xl mx-auto mb-10"
                        >
                            Stop bleeding money on forgotten subscriptions. Pro users save an average of ₹1.2 Lakhs per year.
                        </motion.p>

                        {/* ROI Calculator */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className="max-w-xl mx-auto bg-slate-900/50 border border-slate-800 rounded-2xl p-6 mb-12 backdrop-blur-sm"
                        >
                            <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
                                <div className="text-left">
                                    <label className="text-sm text-slate-400 block mb-1">Your Monthly Waste (₹)</label>
                                    <input
                                        type="number"
                                        value={leaksInput}
                                        onChange={(e) => setLeaksInput(Number(e.target.value))}
                                        className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white font-mono w-40 focus:border-emerald-500 outline-none"
                                    />
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-slate-400 mb-1">Pro pays for itself in</p>
                                    <p className="text-2xl font-black text-emerald-400">{roiText}</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Toggle */}
                        <div className="flex items-center justify-center gap-4 mb-16">
                            <span className={`text-sm font-medium ${!isAnnual ? 'text-white' : 'text-slate-400'}`}>Monthly</span>
                            <button
                                onClick={() => setIsAnnual(!isAnnual)}
                                className="w-14 h-8 bg-slate-800 rounded-full p-1 relative transition-colors hover:bg-slate-700"
                            >
                                <div className={`w-6 h-6 bg-emerald-500 rounded-full transition-transform ${isAnnual ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                            <span className={`text-sm font-medium ${isAnnual ? 'text-white' : 'text-slate-400'}`}>
                                Yearly <span className="text-emerald-400 text-xs ml-1">(Save 17%)</span>
                            </span>
                        </div>
                    </div>

                    {/* Pricing Cards */}
                    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        {/* Free Plan */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 relative hover:border-slate-700 transition-colors"
                        >
                            <div className="mb-8">
                                <h3 className="text-2xl font-bold text-white mb-2">Hobby</h3>
                                <p className="text-slate-400">For indie hackers just starting out</p>
                            </div>
                            <div className="mb-8">
                                <span className="text-4xl font-black text-white">₹0</span>
                                <span className="text-slate-400">/forever</span>
                            </div>
                            <Link to="/dashboard">
                                <Button variant="outline" className="w-full py-6 text-lg border-slate-700 hover:bg-slate-800">
                                    Get Started Free
                                </Button>
                            </Link>
                            <div className="mt-8 space-y-4">
                                <Feature text="Connect up to 5 services" />
                                <Feature text="Basic scan (Public repos)" />
                                <Feature text="Monthly email report" />
                                <Feature text="Standard support" />
                                <Feature text="Manual refresh only" />
                            </div>
                        </motion.div>

                        {/* Pro Plan */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                            className="bg-gradient-to-b from-emerald-900/20 to-slate-900/50 border border-emerald-500/50 rounded-3xl p-8 relative shadow-2xl shadow-emerald-500/10 transform md:-translate-y-4"
                        >
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                                MOST POPULAR
                            </div>
                            <div className="mb-8">
                                <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                                    Pro <Crown className="w-5 h-5 text-amber-400 fill-amber-400" />
                                </h3>
                                <p className="text-emerald-200/70">For serious savers & scaling startups</p>
                            </div>
                            <div className="mb-8">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-black text-white">₹{isAnnual ? '666' : '799'}</span>
                                    <span className="text-slate-400">/month</span>
                                </div>
                                {isAnnual && <p className="text-emerald-400 text-sm mt-2">Billed ₹7,999 yearly (Save ₹1,589)</p>}
                            </div>
                            <Button
                                onClick={handleSubscribe}
                                disabled={isLoading}
                                className="w-full py-6 text-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/25 disabled:opacity-50"
                            >
                                {isLoading ? 'Redirecting...' : 'Upgrade to Pro'}
                            </Button>
                            <div className="mt-8 space-y-4">
                                <Feature text="Unlimited connections" highlighted />
                                <Feature text="Deep AWS Scan (EC2, RDS, Lambda)" highlighted />
                                <Feature text="Savage AI Recommendations" highlighted />
                                <Feature text="Weekly Auto-Scans" highlighted />
                                <Feature text="Export PDF Reports" highlighted />
                                <Feature text="Priority Support" highlighted />
                            </div>
                        </motion.div>
                    </div>

                    {/* Testimonials */}
                    <div className="mt-32 text-center">
                        <h2 className="text-3xl font-bold mb-12">Loved by Indie Hackers</h2>
                        <div className="grid md:grid-cols-3 gap-8">
                            <Testimonial
                                name="Pieter Levels"
                                handle="@levelsio"
                                text="Saved ₹4.2 lakh/year after upgrading. SubTrack found 3 zombie EC2 instances I forgot about from 2021. Insane."
                                image="https://pbs.twimg.com/profile_images/1756727697758965760/W_Xb8Xj-_400x400.jpg"
                            />
                            <Testimonial
                                name="Marc Lou"
                                handle="@marc_louvion"
                                text="The savage AI mode is hilarious but actually useful. It roasted me for paying for Vercel Pro on a static site. Downgraded instantly."
                                image="https://pbs.twimg.com/profile_images/1733862428640645120/f5S8z8sI_400x400.jpg"
                            />
                            <Testimonial
                                name="Danny Postma"
                                handle="@dannypostma"
                                text="ROI is infinite. Paid ₹799, saved ₹15,000 in the first 10 minutes. If you're not using this, you hate money."
                                image="https://pbs.twimg.com/profile_images/1620789235323240449/1-1-1_400x400.jpg"
                            />
                        </div>
                    </div>

                    {/* FAQ */}
                    <div className="mt-32 max-w-3xl mx-auto">
                        <h2 className="text-3xl font-bold mb-12 text-center">Frequently Asked Questions</h2>
                        <div className="space-y-6">
                            <FAQ question="Can I cancel anytime?" answer="Yes, cancel with one click from your dashboard. No questions asked." />
                            <FAQ question="Is it safe?" answer="We use read-only API keys and bank-level encryption. We can't modify your infrastructure." />
                            <FAQ question="What if I don't save money?" answer="We offer a 30-day money-back guarantee. If we don't find savings, you don't pay." />
                        </div>
                    </div>
                </div>
            </main>
            <Footer />

            {/* Hidden PayU Payment Form */}
            <form ref={paymentFormRef} method="post" style={{ display: 'none' }}>
                <input type="hidden" name="key" />
                <input type="hidden" name="txnid" />
                <input type="hidden" name="amount" />
                <input type="hidden" name="productinfo" />
                <input type="hidden" name="firstname" />
                <input type="hidden" name="email" />
                <input type="hidden" name="phone" />
                <input type="hidden" name="surl" />
                <input type="hidden" name="furl" />
                <input type="hidden" name="hash" />
                <input type="hidden" name="udf1" />
                <input type="hidden" name="udf2" />
                <input type="hidden" name="udf3" />
                <input type="hidden" name="udf4" />
                <input type="hidden" name="udf5" />
            </form>
        </div>
    );
};

const Feature = ({ text, highlighted = false }: { text: string, highlighted?: boolean }) => (
    <div className="flex items-center gap-3">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${highlighted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
            <Check className="w-4 h-4" />
        </div>
        <span className={highlighted ? 'text-white font-medium' : 'text-slate-400'}>{text}</span>
    </div>
);

const Testimonial = ({ name, handle, text, image }: { name: string, handle: string, text: string, image: string }) => (
    <div className="bg-slate-900/30 border border-slate-800 p-6 rounded-2xl text-left hover:border-emerald-500/30 transition-colors">
        <div className="flex items-center gap-3 mb-4">
            <img src={image} alt={name} className="w-10 h-10 rounded-full" />
            <div>
                <p className="font-bold text-white">{name}</p>
                <p className="text-xs text-slate-500">{handle}</p>
            </div>
        </div>
        <p className="text-slate-300 text-sm leading-relaxed">{text}</p>
        <div className="flex gap-1 mt-4 text-amber-400">
            {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
        </div>
    </div>
);

const FAQ = ({ question, answer }: { question: string, answer: string }) => (
    <div className="bg-slate-900/30 border border-slate-800 p-6 rounded-2xl">
        <h3 className="font-bold text-white mb-2">{question}</h3>
        <p className="text-slate-400 text-sm">{answer}</p>
    </div>
);

export default Pricing;
