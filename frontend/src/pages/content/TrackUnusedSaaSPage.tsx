import React from 'react';
import ContentLayout from '../../layouts/ContentLayout';
import { UserMinus, Search, CreditCard, ShieldCheck } from 'lucide-react';

const TrackUnusedSaaSPage: React.FC = () => {
    const faqs = [
        {
            question: "How do I identify unused SaaS licenses?",
            answer: "Look for 'Zombie Seats'—licenses that are paid for but haven't seen a login or activity in 30+ days. SubTrack automates this by checking GitHub commits, Vercel deployments, and Clerk user activity."
        },
        {
            question: "Why is it hard to track SaaS spend manually?",
            answer: "Manual tracking depends on outdated spreadsheets and infrequent audits. SaaS costs are dynamic; a developer might add a new tool or seat mid-month, which goes unnoticed until the next credit card statement."
        }
    ];

    return (
        <ContentLayout
            title="How to Automatically Track Unused SaaS Subscriptions"
            description="Stop paying for 'Zombie Seats'. Learn how to audit your startup's software stack and reclaim 20% of your annual budget."
            tldr="Unused SaaS subscriptions cost companies billions annually. SubTrack uses direct API integrations to detect silent renewals and dormant accounts in real-time, allowing you to downgrade or cancel before the next billing cycle."
            canonical="https://subtrack.pulseguard.in/use-cases/track-unused-saas"
            faqs={faqs}
        >
            <section className="space-y-6">
                <h2 className="text-3xl font-bold text-white">The Hidden Cost of 'Ghost' Licenses</h2>
                <p className="text-lg text-slate-400">
                    The average employee uses 8+ SaaS tools. When an employee leaves or a project ends, these licenses often remain active. Without a centralized tracker, these 'Ghost' licenses continue to drain your bank account month after month.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-10">
                    <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-all">
                        <UserMinus className="w-8 h-8 text-red-400 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Offboarding Leaks</h3>
                        <p className="text-sm text-slate-400">Forgotten accounts from former employees are the #1 source of SaaS waste.</p>
                    </div>
                    <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-all">
                        <Search className="w-8 h-8 text-blue-400 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Duplicate Tools</h3>
                        <p className="text-sm text-slate-400">Three different teams buying three different project management tools without knowing.</p>
                    </div>
                </div>
            </section>

            <section className="space-y-6 bg-emerald-500/5 p-8 rounded-3xl border border-emerald-500/10">
                <h2 className="text-2xl font-bold text-white mb-4">The Automated Audit Checklist</h2>
                <div className="space-y-4">
                    {[
                        "Connect SSO or Identity providers (Clerk/Auth0) to see active users.",
                        "Directly link GitHub and Vercel to monitor seat usage vs. contributions.",
                        "Set up weekly alerts for any tool that hasn't been used in 14 days.",
                        "Review automated 'Savage' insights to identify redundant software."
                    ].map((item, i) => (
                        <div key={i} className="flex gap-4">
                            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-1" />
                            <p className="text-slate-300">{item}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="space-y-6">
                <h2 className="text-3xl font-bold text-white">Why Traditional Methods Fail</h2>
                <p className="text-lg text-slate-400">
                    Credit card statements only tell you *how much* you paid, not *if* you're actually using the product. SubTrack goes beyond the transaction to analyze the *value* of every subscription in your stack.
                </p>
                <div className="bg-slate-900 border border-white/5 p-8 rounded-2xl flex flex-col md:flex-row items-center gap-8">
                    <div className="text-center md:text-left">
                        <CreditCard className="w-12 h-12 text-emerald-400 mx-auto md:mx-0 mb-4" />
                        <h4 className="text-white font-bold text-xl uppercase tracking-tighter">Instant ROI</h4>
                        <p className="text-slate-400 text-sm mt-2">SubTrack typically uncovers savings that exceed its own subscription cost within the first 24 hours.</p>
                    </div>
                    <button onClick={() => window.location.href = '/sign-up'} className="w-full md:w-auto px-10 py-5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-2xl shadow-xl shadow-emerald-500/20 transition-all">
                        Audit Your SaaS
                    </button>
                </div>
            </section>
        </ContentLayout>
    );
};

export default TrackUnusedSaaSPage;
