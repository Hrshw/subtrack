import React from 'react';
import ContentLayout from '../../layouts/ContentLayout';
import { Check, X } from 'lucide-react';

const ComparisonSpreadsheetPage: React.FC = () => {
    const comparisonData = [
        { feature: "Real-time Detection", subtrack: true, manual: false },
        { feature: "Direct AWS/GitHub Integration", subtrack: true, manual: false },
        { feature: "Automated Seat Monitoring", subtrack: true, manual: false },
        { feature: "Cost Outlier Alerts", subtrack: true, manual: false },
        { feature: "Multi-Account Sync", subtrack: true, manual: false },
        { feature: "Historical Trend Analysis", subtrack: true, manual: true },
        { feature: "Zero Maintenance", subtrack: true, manual: false },
    ];

    const faqs = [
        {
            question: "Is it worth moving from a spreadsheet to SubTrack?",
            answer: "For teams spending more than ₹10,000/month on SaaS, the answer is yes. Spreadsheets are outdated the second they are updated, while SubTrack gives you live, actionable data that can save you 10-20% of your budget automatically."
        },
        {
            question: "How long does it take to set up SubTrack?",
            answer: "Most integrations take less than 2 minutes. Unlike manual audits that take hours or days, SubTrack populates your cost data instantly once connected."
        }
    ];

    return (
        <ContentLayout
            title="SubTrack vs Manual Spreadsheets: The Real Cost of 'Free' Tracking"
            description="Comparing automated SaaS optimization with manual audits. Discover why spreadsheets are the hidden cause of SaaS budget leaks."
            tldr="While spreadsheets are free, they lack real-time visibility and direct API integrations. SubTrack automates the detection of unused cloud resources and ghost subscriptions, paying for itself by identifying leaks that spreadsheets miss."
            canonical="https://subtrack.pulseguard.in/compare/subtrack-vs-spreadsheets"
            faqs={faqs}
        >
            <section className="space-y-8">
                <h2 className="text-3xl font-bold text-white">Direct Feature Comparison</h2>
                <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white/5">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="p-6 text-slate-400 font-bold uppercase tracking-wider text-xs">Feature</th>
                                <th className="p-6 text-emerald-400 font-bold uppercase tracking-wider text-xs">SubTrack</th>
                                <th className="p-6 text-slate-400 font-bold uppercase tracking-wider text-xs">Manual Spreadsheets</th>
                            </tr>
                        </thead>
                        <tbody>
                            {comparisonData.map((row, i) => (
                                <tr key={i} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                                    <td className="p-6 text-white font-medium">{row.feature}</td>
                                    <td className="p-6">
                                        {row.subtrack ? <Check className="w-5 h-5 text-emerald-500" /> : <X className="w-5 h-5 text-slate-600" />}
                                    </td>
                                    <td className="p-6">
                                        {row.manual ? <Check className="w-5 h-5 text-emerald-500" /> : <X className="w-5 h-5 text-slate-600" />}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="space-y-6 mt-20">
                <h2 className="text-3xl font-bold text-white">The Spreadsheet Tax</h2>
                <p className="text-lg text-slate-400">
                    Most finance teams spend 4-8 hours a month manually cross-referencing credit card statements with SaaS tools. Even then, they miss the "Shadow SaaS" signed up for using engineering budgets or individual expense reports.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-10">
                    <div className="bg-red-500/5 p-8 rounded-3xl border border-red-500/10">
                        <h4 className="text-red-400 font-bold mb-4 uppercase tracking-widest text-xs">Spreadsheet Cons</h4>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3 text-slate-400 text-sm">
                                <X className="w-4 h-4 text-red-500 shrink-0 mt-1" />
                                <span>Becomes outdated within 24 hours of creation.</span>
                            </li>
                            <li className="flex items-start gap-3 text-slate-400 text-sm">
                                <X className="w-4 h-4 text-red-500 shrink-0 mt-1" />
                                <span>No ability to detect unused cloud resources (AWS/Vercel).</span>
                            </li>
                            <li className="flex items-start gap-3 text-slate-400 text-sm">
                                <X className="w-4 h-4 text-red-500 shrink-0 mt-1" />
                                <span>Manual error-prone data entry and calculation mistakes.</span>
                            </li>
                        </ul>
                    </div>
                    <div className="bg-emerald-500/5 p-8 rounded-3xl border border-emerald-500/10">
                        <h4 className="text-emerald-400 font-bold mb-4 uppercase tracking-widest text-xs">SubTrack Pros</h4>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3 text-slate-400 text-sm">
                                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-1" />
                                <span>Live data pulled directly from vendor APIs.</span>
                            </li>
                            <li className="flex items-start gap-3 text-slate-400 text-sm">
                                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-1" />
                                <span>Proactive alerts when costs spike or seats go unused.</span>
                            </li>
                            <li className="flex items-start gap-3 text-slate-400 text-sm">
                                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-1" />
                                <span>Detailed technical audits of cloud infrastructure.</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            <section className="bg-slate-900 rounded-3xl p-10 text-center border border-white/5">
                <h3 className="text-2xl font-bold text-white mb-4 italic">"Stop tracking. Start optimizing."</h3>
                <p className="text-slate-400 mb-8">
                    Upgrade from a dead spreadsheet to a living dashboard in minutes.
                </p>
                <div className="flex flex-col md:flex-row gap-4 justify-center">
                    <button onClick={() => window.location.href = '/'} className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl transition-all">
                        Switch to SubTrack
                    </button>
                    <button onClick={() => window.location.href = '/pricing'} className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all border border-white/10">
                        View Price Savings
                    </button>
                </div>
            </section>
        </ContentLayout>
    );
};

export default ComparisonSpreadsheetPage;
