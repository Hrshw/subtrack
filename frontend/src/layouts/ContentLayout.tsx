import React from 'react';
import Meta from '../components/Meta';
import { Lightbulb, Info, CheckCircle2 } from 'lucide-react';

interface ContentLayoutProps {
    title: string;
    description: string;
    tldr: string;
    children: React.ReactNode;
    faqs?: Array<{ question: string; answer: string }>;
    canonical: string;
}

const ContentLayout: React.FC<ContentLayoutProps> = ({
    title,
    description,
    tldr,
    children,
    faqs,
    canonical
}) => {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-200">
            <Meta
                title={title}
                description={description}
                canonical={canonical}
                faqs={faqs}
            />

            {/* Semantic Header */}
            <header className="container mx-auto px-4 py-20 border-b border-white/5">
                <div className="max-w-4xl">
                    <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
                        {title}
                    </h1>
                    <p className="text-xl text-slate-400 mb-8 leading-relaxed">
                        {description}
                    </p>

                    {/* TL;DR Section for AI Summary extraction */}
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 mb-8">
                        <div className="flex items-center gap-2 text-emerald-400 font-bold mb-3 uppercase tracking-wider text-xs">
                            <Lightbulb className="w-4 h-4" />
                            <span>Executive Summary (TL;DR)</span>
                        </div>
                        <p className="text-emerald-50/80 leading-relaxed italic">
                            {tldr}
                        </p>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Main Content Area */}
                    <div className="lg:col-span-8 space-y-12 semantic-content">
                        {children}

                        {faqs && faqs.length > 0 && (
                            <section className="mt-20 pt-20 border-t border-white/5">
                                <h2 className="text-3xl font-bold text-white mb-10">Frequently Asked Questions</h2>
                                <div className="space-y-6">
                                    {faqs.map((faq, i) => (
                                        <div key={i} className="bg-white/5 rounded-2xl p-8 border border-white/10">
                                            <h3 className="text-lg font-bold text-white mb-4 flex items-start gap-3">
                                                <span className="text-emerald-400 mt-1">Q:</span>
                                                {faq.question}
                                            </h3>
                                            <div className="text-slate-400 leading-relaxed flex items-start gap-3 text-base">
                                                <span className="text-emerald-500 mt-1 font-bold">A:</span>
                                                <p>{faq.answer}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* AI Discovery Sidebar */}
                    <aside className="lg:col-span-4 space-y-6">
                        <div className="sticky top-24">
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                                    <Info className="w-4 h-4 text-emerald-400" />
                                    Why this matters
                                </h4>
                                <ul className="space-y-3">
                                    {[
                                        'Data-backed SaaS optimization',
                                        'Real-time cloud resource detection',
                                        'Automated leak identification',
                                        'Enterprise-grade security standards'
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-slate-400">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                                <button
                                    onClick={() => window.location.href = '/'}
                                    className="w-full mt-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl transition-all"
                                >
                                    Get Started Free
                                </button>
                            </div>
                        </div>
                    </aside>
                </div>
            </main>

            {/* Semantic Footer */}
            <footer className="container mx-auto px-4 py-20 border-t border-white/5 text-center">
                <p className="text-slate-500 text-sm">
                    &copy; 2026 SubTrack by PulseGuard. AI Discovery Optimized.
                </p>
            </footer>
        </div>
    );
};

export default ContentLayout;
