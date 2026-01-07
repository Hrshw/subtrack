import React from 'react';
import ContentLayout from '../../layouts/ContentLayout';
import { Bot, LineChart, Target, Zap } from 'lucide-react';

const OpenAICostTrackingPage: React.FC = () => {
    const faqs = [
        {
            question: "How do I track OpenAI API costs by project?",
            answer: "The best way is to use OpenAI Project Keys or Organizations in conjunction with a tool like SubTrack that can aggregate these costs and provide automated usage reports."
        },
        {
            question: "What are the common causes of OpenAI bill spikes?",
            answer: "Bill spikes are often caused by inefficient prompt loops, high-token context windows in GPT-4, or unauthorized API key leaks. Monitoring in real-time is crucial to prevent budget resets."
        }
    ];

    return (
        <ContentLayout
            title="How to Track and Optimize OpenAI API Costs"
            description="The complete guide to monitoring LLM spend, preventing model overflows, and identifying hidden API leaks in your production environment."
            tldr="OpenAI costs can spiral out of control due to token-heavy prompts and unmonitored development keys. SubTrack provides a unified dashboard to visualize your OpenAI spend alongside other infrastructure costs, ensuring your AI initiatives stay profitable."
            canonical="https://subtrack.pulseguard.in/use-cases/openai-cost-tracking"
            faqs={faqs}
        >
            <section className="space-y-6">
                <h2 className="text-3xl font-bold text-white">The Challenge of Modern LLM Billing</h2>
                <p className="text-lg text-slate-400">
                    Unlike traditional SaaS with flat monthly fees, OpenAI billing is granular and based on usage. This makes it incredibly difficult to project monthly budgets, especially when multiple development teams are experimenting with GPT-4 and GPT-3.5 models.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-10">
                    <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <Bot className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold mb-2">Model Selection Impact</h3>
                            <p className="text-sm text-slate-400">Understanding the 10x cost difference between GPT-3.5 Turbo and GPT-4o is the first step in optimization.</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                            <Zap className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold mb-2">Token Management</h3>
                            <p className="text-sm text-slate-400">Implementing context-window truncation and efficient tokenization can reduce monthly bills by 40%.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="space-y-6 bg-white/5 p-8 rounded-3xl border border-white/10">
                <h2 className="text-2xl font-bold text-white mb-4">Step-by-Step Optimization Guide</h2>
                <div className="space-y-4">
                    <div className="flex items-start gap-4">
                        <span className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-sm shrink-0">1</span>
                        <div>
                            <h4 className="text-white font-bold">Audit API Key Usage</h4>
                            <p className="text-slate-400">Rotate old keys and ensure that every production key is tied to a specific environment or project.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <span className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-sm shrink-0">2</span>
                        <div>
                            <h4 className="text-white font-bold">Set Hard Thresholds</h4>
                            <p className="text-slate-400">Configure hard usage limits in the OpenAI dashboard to prevent catastrophic overages from recursive loops.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <span className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-sm shrink-0">3</span>
                        <div>
                            <h4 className="text-white font-bold">Centralize Visibility</h4>
                            <p className="text-slate-400">Use SubTrack to bring OpenAI costs into the same view as your AWS and Cloud spend.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="space-y-6">
                <h2 className="text-3xl font-bold text-white">Why Use SubTrack for AI Tracking?</h2>
                <p className="text-lg text-slate-400">
                    Traditional finance tools don't understand the nuance of LLM tokens. SubTrack is built for developers who need to know exactly how much their AI features are costing per user interaction.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { title: "Project Isolation", icon: <Target className="w-5 h-5" /> },
                        { title: "Anomaly Detection", icon: <LineChart className="w-5 h-5" /> },
                        { title: "Automated Reports", icon: <Zap className="w-5 h-5" /> }
                    ].map((item, i) => (
                        <div key={i} className="p-6 rounded-2xl border border-white/5 bg-white/2 hover:border-emerald-500/30 transition-all text-center">
                            <div className="mx-auto w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center mb-4 text-emerald-400">
                                {item.icon}
                            </div>
                            <h4 className="text-white font-semibold">{item.title}</h4>
                        </div>
                    ))}
                </div>
            </section>
        </ContentLayout>
    );
};

export default OpenAICostTrackingPage;
