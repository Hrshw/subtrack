import React, { useState } from 'react';
import { Dialog, DialogContent } from './ui/dialog';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface OnboardingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (provider: string) => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose, onComplete }) => {
    const [step, setStep] = useState(0);

    const steps = [
        {
            title: 'Welcome to SubTrack! 🎉',
            description: 'Most indie hackers waste ₹30,000–₹80,000/month on unused dev tools.',
            content: (
                <div className="text-center space-y-4">
                    <div className="text-6xl mb-4">💸</div>
                    <p className="text-slate-300 text-lg">
                        Let's find your money leaks in <span className="font-bold text-emerald-400">2 minutes</span>.
                    </p>
                </div>
            )
        },
        {
            title: 'Connect Your Most Expensive Tools First',
            description: 'We recommend starting with these high-impact integrations:',
            content: (
                <div className="space-y-3">
                    {[
                        { name: 'GitHub', icon: '🐙', savings: '₹18,000/year', reason: 'Unused Pro subscriptions' },
                        { name: 'Vercel', icon: '▲', savings: '₹25,000/year', reason: 'Over-provisioned bandwidth' },
                        { name: 'AWS', icon: '☁️', savings: '₹45,000/year', reason: 'Forgotten resources' }
                    ].map((tool, idx) => (
                        <motion.div
                            key={tool.name}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-emerald-500/50 transition-all"
                        >
                            <div className="flex items-center gap-3">
                                <div className="text-3xl">{tool.icon}</div>
                                <div>
                                    <div className="font-semibold">{tool.name}</div>
                                    <div className="text-xs text-slate-400">{tool.reason}</div>
                                </div>
                            </div>
                            <div className="text-emerald-400 font-bold text-sm">{tool.savings}</div>
                        </motion.div>
                    ))}
                </div>
            )
        },
        {
            title: 'Ready to Find Your Leaks? 🚀',
            description: 'Pick your first integration to connect:',
            content: (
                <div className="grid grid-cols-2 gap-3">
                    {['GitHub', 'Vercel', 'AWS', 'Sentry'].map((provider, idx) => (
                        <motion.button
                            key={provider}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onComplete(provider)}
                            className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700 hover:border-emerald-500/50 transition-all group"
                        >
                            <div className="text-4xl mb-2">
                                {provider === 'GitHub' && '🐙'}
                                {provider === 'Vercel' && '▲'}
                                {provider === 'AWS' && '☁️'}
                                {provider === 'Sentry' && '🔍'}
                            </div>
                            <div className="font-semibold group-hover:text-emerald-400 transition-colors">
                                {provider}
                            </div>
                        </motion.button>
                    ))}
                </div>
            )
        }
    ];

    const currentStep = steps[step];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[550px] bg-gradient-to-br from-slate-900 to-slate-950 border-emerald-500/30 text-white">
                <div className="py-6">
                    {/* Progress Bar */}
                    <div className="flex gap-2 mb-8">
                        {steps.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-1.5 rounded-full flex-1 transition-all ${idx === step
                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                                    : idx < step
                                        ? 'bg-emerald-500/50'
                                        : 'bg-slate-700'
                                    }`}
                            />
                        ))}
                    </div>

                    {/* Content */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="text-center mb-6">
                                <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                                    {currentStep.title}
                                </h2>
                                <p className="text-slate-400">{currentStep.description}</p>
                            </div>

                            <div className="mb-8">
                                {currentStep.content}
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation */}
                    <div className="flex items-center justify-between">
                        <Button
                            variant="ghost"
                            onClick={() => step > 0 ? setStep(step - 1) : onClose()}
                            className="text-slate-400 hover:text-white"
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            {step === 0 ? 'Skip' : 'Back'}
                        </Button>

                        {step < steps.length - 1 && (
                            <Button
                                onClick={() => setStep(step + 1)}
                                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                            >
                                Next
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default OnboardingModal;
