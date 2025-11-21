import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import Navbar from '../components/Navbar';
import { Check, Zap } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

const Pricing = () => {
    const { isSignedIn } = useAuth();
    const navigate = useNavigate();

    const handleGetStarted = (plan: 'free' | 'pro') => {
        if (!isSignedIn) {
            navigate('/sign-in');
        } else {
            if (plan === 'pro') {
                // Redirect to Stripe checkout or upgrade flow
                window.location.href = '/api/stripe/checkout?plan=pro';
            } else {
                navigate('/dashboard');
            }
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
                {/* Header */}
                <div className="text-center mb-16">
                    <h1 className="text-5xl md:text-6xl font-bold mb-6">
                        <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                            Simple pricing.
                        </span>
                        <br />
                        <span className="text-white">Massive savings.</span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                        Most users save ₹4–8 lakh per year. Pro pays for itself 50x over.
                    </p>
                </div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {/* Free Tier */}
                    <Card className="bg-slate-900/50 border-slate-700 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="text-3xl text-white">Free</CardTitle>
                            <CardDescription className="text-slate-400">Perfect for trying SubTrack</CardDescription>
                            <div className="mt-4">
                                <span className="text-5xl font-bold text-white">₹0</span>
                                <span className="text-slate-400">/month</span>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ul className="space-y-3">
                                <li className="flex items-center text-slate-300">
                                    <Check className="h-5 w-5 text-emerald-400 mr-3" />
                                    Connect up to 3 accounts
                                </li>
                                <li className="flex items-center text-slate-300">
                                    <Check className="h-5 w-5 text-emerald-400 mr-3" />
                                    Basic leak detection
                                </li>
                                <li className="flex items-center text-slate-300">
                                    <Check className="h-5 w-5 text-emerald-400 mr-3" />
                                    Monthly scans
                                </li>
                                <li className="flex items-center text-slate-300">
                                    <Check className="h-5 w-5 text-emerald-400 mr-3" />
                                    Email reports
                                </li>
                            </ul>
                            <Button
                                onClick={() => handleGetStarted('free')}
                                variant="outline"
                                className="w-full mt-6 border-slate-600 hover:bg-slate-800"
                            >
                                Get Started Free
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Pro Tier */}
                    <Card className="bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border-emerald-500/50 backdrop-blur-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-gradient-to-l from-emerald-500 to-teal-500 text-white px-4 py-1 text-sm font-bold">
                            MOST POPULAR
                        </div>
                        <CardHeader>
                            <CardTitle className="text-3xl text-white flex items-center">
                                Pro <Zap className="ml-2 h-6 w-6 text-yellow-400" />
                            </CardTitle>
                            <CardDescription className="text-emerald-200">For serious savers</CardDescription>
                            <div className="mt-4">
                                <div className="flex items-baseline space-x-2">
                                    <span className="text-5xl font-bold text-white">₹799</span>
                                    <span className="text-slate-300">/month</span>
                                </div>
                                <div className="mt-2 text-sm text-emerald-300">
                                    or ₹7,999/year (save 17%)
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ul className="space-y-3">
                                <li className="flex items-center text-white font-medium">
                                    <Check className="h-5 w-5 text-emerald-400 mr-3" />
                                    Unlimited accounts
                                </li>
                                <li className="flex items-center text-white">
                                    <Check className="h-5 w-5 text-emerald-400 mr-3" />
                                    AI-powered recommendations
                                </li>
                                <li className="flex items-center text-white">
                                    <Check className="h-5 w-5 text-emerald-400 mr-3" />
                                    Real-time monitoring
                                </li>
                                <li className="flex items-center text-white">
                                    <Check className="h-5 w-5 text-emerald-400 mr-3" />
                                    Automated cancellations
                                </li>
                                <li className="flex items-center text-white">
                                    <Check className="h-5 w-5 text-emerald-400 mr-3" />
                                    Priority support
                                </li>
                                <li className="flex items-center text-white">
                                    <Check className="h-5 w-5 text-emerald-400 mr-3" />
                                    Advanced analytics
                                </li>
                            </ul>
                            <Button
                                onClick={() => handleGetStarted('pro')}
                                className="w-full mt-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold"
                            >
                                Upgrade to Pro
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* ROI Calculator */}
                <div className="mt-20 max-w-3xl mx-auto">
                    <Card className="bg-slate-900/50 border-emerald-500/30 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="text-2xl text-white text-center">
                                Average User Saves ₹34,000/month
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-3 gap-6 text-center">
                                <div>
                                    <div className="text-3xl font-bold text-emerald-400">₹4,08,000</div>
                                    <div className="text-sm text-slate-400 mt-1">Saved per year</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-emerald-400">42x</div>
                                    <div className="text-sm text-slate-400 mt-1">ROI on Pro plan</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-emerald-400">12 mins</div>
                                    <div className="text-sm text-slate-400 mt-1">Average setup time</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* FAQ */}
                <div className="mt-20 max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold text-white text-center mb-10">Frequently Asked Questions</h2>
                    <div className="space-y-4">
                        {[
                            {
                                q: "Can I cancel anytime?",
                                a: "Yes! Cancel with one click from Settings. No questions asked."
                            },
                            {
                                q: "Do you offer refunds?",
                                a: "We offer a 7-day money-back guarantee. If you don't save more than ₹799 in your first week, we'll refund you completely."
                            },
                            {
                                q: "Is my data safe?",
                                a: "Absolutely. We use read-only access with AES-256 encryption. We can't delete or modify anything in your accounts."
                            },
                            {
                                q: "What payment methods do you accept?",
                                a: "We accept all major credit/debit cards, UPI, and international payments via Stripe."
                            }
                        ].map((faq, i) => (
                            <Card key={i} className="bg-slate-900/50 border-slate-700 backdrop-blur-xl">
                                <CardHeader>
                                    <CardTitle className="text-lg text-white">{faq.q}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-slate-400">{faq.a}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="border-t border-slate-800 mt-20 py-12 bg-slate-950/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-4 gap-8">
                        <div>
                            <div className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-4">
                                SubTrack
                            </div>
                            <p className="text-slate-400 text-sm">
                                Stop wasting money on dev tools you forgot about.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-white mb-3">Product</h3>
                            <ul className="space-y-2 text-sm">
                                <li><a href="/pricing" className="text-slate-400 hover:text-white">Pricing</a></li>
                                <li><a href="/dashboard" className="text-slate-400 hover:text-white">Dashboard</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold text-white mb-3">Legal</h3>
                            <ul className="space-y-2 text-sm">
                                <li><a href="/privacy" className="text-slate-400 hover:text-white">Privacy Policy</a></li>
                                <li><a href="/terms" className="text-slate-400 hover:text-white">Terms of Service</a></li>
                                <li><a href="/eula" className="text-slate-400 hover:text-white">EULA</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold text-white mb-3">Support</h3>
                            <ul className="space-y-2 text-sm">
                                <li><a href="/support" className="text-slate-400 hover:text-white">Help Center</a></li>
                                <li><a href="mailto:support@subtrack.app" className="text-slate-400 hover:text-white">Email Us</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="mt-8 pt-8 border-t border-slate-800 text-center text-slate-400 text-sm">
                        © 2025 SubTrack. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Pricing;
