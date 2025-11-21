import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Check, X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import WaitlistModal from '../../components/WaitlistModal';

const DocsPricing = () => {
    const [showWaitlist, setShowWaitlist] = React.useState(false);

    return (
        <>
            <Helmet>
                <title>Pricing - SubTrack Documentation</title>
                <meta name="description" content="Simple, transparent pricing. Start for free and upgrade as you grow. Save thousands on your SaaS bills." />
            </Helmet>

            <div className="prose prose-invert prose-emerald max-w-none">
                <h1 className="text-4xl font-bold text-white mb-6">Pricing</h1>
                <p className="text-xl text-slate-400 mb-12">
                    Start saving money for free. Upgrade to Pro for automated monitoring and unlimited connections.
                </p>

                <div className="grid md:grid-cols-2 gap-8 max-w-4xl">
                    {/* Free Plan */}
                    <div className="bg-slate-900/50 p-8 rounded-2xl border border-slate-800 relative">
                        <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
                        <div className="text-4xl font-bold text-white mb-6">₹0<span className="text-lg text-slate-500 font-normal">/mo</span></div>
                        <p className="text-slate-400 mb-8">Perfect for indie hackers and small projects.</p>

                        <ul className="space-y-4 mb-8">
                            <li className="flex items-center gap-3 text-slate-300">
                                <Check className="w-5 h-5 text-emerald-400" />
                                Up to 3 connected services
                            </li>
                            <li className="flex items-center gap-3 text-slate-300">
                                <Check className="w-5 h-5 text-emerald-400" />
                                Manual scans
                            </li>
                            <li className="flex items-center gap-3 text-slate-300">
                                <Check className="w-5 h-5 text-emerald-400" />
                                Basic savings report
                            </li>
                            <li className="flex items-center gap-3 text-slate-500">
                                <X className="w-5 h-5" />
                                No historical data
                            </li>
                        </ul>

                        <Button className="w-full bg-slate-800 hover:bg-slate-700 text-white">
                            Current Plan
                        </Button>
                    </div>

                    {/* Pro Plan */}
                    <div className="bg-gradient-to-br from-emerald-900/20 to-slate-900/50 p-8 rounded-2xl border border-emerald-500/30 relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                            RECOMMENDED
                        </div>

                        <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
                        <div className="text-4xl font-bold text-white mb-6">₹799<span className="text-lg text-slate-500 font-normal">/mo</span></div>
                        <p className="text-emerald-400 mb-8">Save ₹80,000+/year on average.</p>

                        <ul className="space-y-4 mb-8">
                            <li className="flex items-center gap-3 text-white">
                                <Check className="w-5 h-5 text-emerald-400" />
                                Unlimited connections
                            </li>
                            <li className="flex items-center gap-3 text-white">
                                <Check className="w-5 h-5 text-emerald-400" />
                                Weekly auto-scans & alerts
                            </li>
                            <li className="flex items-center gap-3 text-white">
                                <Check className="w-5 h-5 text-emerald-400" />
                                Advanced savings insights
                            </li>
                            <li className="flex items-center gap-3 text-white">
                                <Check className="w-5 h-5 text-emerald-400" />
                                Priority support
                            </li>
                        </ul>

                        <Button
                            onClick={() => setShowWaitlist(true)}
                            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold shadow-lg shadow-emerald-500/20"
                        >
                            Join Waitlist
                        </Button>
                    </div>
                </div>
            </div>

            <WaitlistModal
                isOpen={showWaitlist}
                onClose={() => setShowWaitlist(false)}
                potentialSavings={0}
            />
        </>
    );
};

export default DocsPricing;
