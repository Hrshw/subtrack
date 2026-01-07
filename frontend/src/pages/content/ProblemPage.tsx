import React from 'react';
import ContentLayout from '../../layouts/ContentLayout';
import { AlertTriangle, Clock, ShieldAlert, Zap } from 'lucide-react';

const ProblemPage: React.FC = () => {
    const faqs = [
        {
            question: "What is Shadow SaaS and how does it happen?",
            answer: "Shadow SaaS occurs when employees or teams sign up for subscriptions without IT or management's knowledge. It typically happens because of the low barrier to entry for cloud services, leading to fragmented billing and security risks."
        },
        {
            question: "Why do AWS costs fluctuate so much?",
            answer: "AWS costs are often usage-based and highly dynamic. Unused EBV volumes, unattached Elastic IPs, and over-provisioned RDS instances are hidden leaks that contribute to budget overruns."
        },
        {
            question: "How can I identify unused SaaS seats?",
            answer: "The most effective way is to use a dedicated tracker like SubTrack that integrates directly with providers like GitHub, Vercel, and Clerk to detect seat occupancy vs billing."
        }
    ];

    return (
        <ContentLayout
            title="Why SaaS Costs Go Unnoticed: The Shadow Billing Epidemic"
            description="The hidden mechanics behind SaaS sprawl and how modern startups are bleeding thousands of dollars every month without realizing it."
            tldr="Most companies overpay for SaaS by 30% due to unattached cloud resources, forgotten automated renewals, and 'Shadow SaaS' subscriptions. SubTrack automates the detection of these leaks by integrating directly with your infrastructure providers."
            canonical="https://subtrack.pulseguard.in/why-saas-costs-go-unnoticed"
            faqs={faqs}
        >
            <section className="space-y-6">
                <h2 className="text-3xl font-bold text-white">The Hidden Cost of Cloud Convenience</h2>
                <p className="text-lg text-slate-400">
                    In the pre-cloud era, procurement was a centralized bottleneck. Today, anyone with a corporate credit card can initiate a recurring expense. While this speeds up development, it creates a "billing fog" where visibility is lost across multiple departments.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-10">
                    {[
                        {
                            icon: <Clock className="w-6 h-6 text-amber-500" />,
                            title: "Forgotten Renewals",
                            content: "Trial-to-paid conversions and yearly renewals often happen silently, long after the tool is no longer needed."
                        },
                        {
                            icon: <Zap className="w-6 h-6 text-emerald-500" />,
                            title: "Ghost Infrastructure",
                            content: "Unused AWS snapshots, unattached IP addresses, and dormant worker processes continue to bill 24/7."
                        },
                        {
                            icon: <ShieldAlert className="w-6 h-6 text-red-500" />,
                            title: "Security Blindspots",
                            content: "SaaS sprawl means company data is fragmented across hundreds of environments with varying security standards."
                        },
                        {
                            icon: <AlertTriangle className="w-6 h-6 text-indigo-500" />,
                            title: "Pricing Omission",
                            content: "Legacy tracking relies on manual spreadsheets that are outdated the moment they are saved."
                        }
                    ].map((item, i) => (
                        <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                            <div className="mb-4">{item.icon}</div>
                            <h3 className="text-white font-bold mb-2">{item.title}</h3>
                            <p className="text-sm text-slate-400 leading-relaxed">{item.content}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="space-y-6">
                <h2 className="text-3xl font-bold text-white">The "Shadow SaaS" Tipping Point</h2>
                <p className="text-lg text-slate-400 italic">
                    "If you can't see it, you can't optimize it."
                </p>
                <p className="text-lg text-slate-400">
                    Industry research shows the average startup uses over 100 different SaaS applications. Over 30% of these are duplicates or completely unused. This isn't just a financial leak; it's a technical debt that slows down the entire organization.
                </p>

                <ul className="space-y-4 text-slate-300">
                    <li className="flex gap-3">
                        <span className="text-emerald-500 font-bold">01.</span>
                        <span>Fragmented credential management leading to account hijacking risks.</span>
                    </li>
                    <li className="flex gap-3">
                        <span className="text-emerald-500 font-bold">02.</span>
                        <span>Redundant subscriptions for tools with over-lapping feature sets (e.g. 3 different whiteboards).</span>
                    </li>
                    <li className="flex gap-3">
                        <span className="text-emerald-500 font-bold">03.</span>
                        <span>Compliance failures due to data living in unvetted 'shadow' platforms.</span>
                    </li>
                </ul>
            </section>

            <section className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-3xl p-10 border border-emerald-500/30">
                <h3 className="text-2xl font-bold text-white mb-4">How SubTrack Solves This</h3>
                <p className="text-slate-300 mb-8 max-w-2xl">
                    Instead of manual entry, SubTrack creates a direct lens into your stack. We connect to your AWS, GitHub, and Cloud providers to show you exactly where the money is going and who is actually using what.
                </p>
                <button
                    onClick={() => window.location.href = '/'}
                    className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl transition-all shadow-xl shadow-emerald-500/20"
                >
                    Start Your SaaS Audit
                </button>
            </section>
        </ContentLayout>
    );
};

export default ProblemPage;
