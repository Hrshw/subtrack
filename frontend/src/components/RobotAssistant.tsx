import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { X, Send, Sparkles, Play } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import axios from 'axios';
import { getApiUrl } from '../lib/api';
import { useAuth } from '@clerk/clerk-react';


// --- Custom SVG Robot Component ---
const CuteRobot = ({ isWalking, isWaving, isSitting }: { isWalking: boolean; isWaving: boolean; isSitting: boolean }) => {
    return (
        <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Shadow */}
            <motion.ellipse
                cx="50" cy="90" rx="30" ry="5" fill="rgba(0,0,0,0.2)"
                initial={{ opacity: 0.2 }}
                animate={{
                    scale: isWalking ? [1, 0.8, 1] : (isSitting ? 1.2 : 1),
                    opacity: isWalking ? [0.2, 0.1, 0.2] : 0.2
                }}
                transition={{ duration: 0.8, repeat: isWalking ? Infinity : 0 }}
            />

            {/* Legs */}
            <motion.g
                initial={{ opacity: 1 }}
                animate={{
                    y: isWalking ? [0, -2, 0] : (isSitting ? -5 : 0),
                    opacity: isSitting ? 0 : 1
                }}
                transition={{ duration: 0.4, repeat: isWalking ? Infinity : 0 }}
            >
                <rect x="35" y="75" width="10" height="15" rx="5" fill="#334155" />
                <rect x="55" y="75" width="10" height="15" rx="5" fill="#334155" />
            </motion.g>

            {/* Body */}
            <motion.rect
                x="25" y="40" width="50" height="40" rx="10" fill="#10B981"
                animate={{
                    y: isWalking ? [0, -1, 0] : (isSitting ? 15 : [0, 2, 0]),
                    rotate: isSitting ? [-1, 1, -1] : 0
                }}
                transition={{
                    y: { duration: isWalking ? 0.4 : (isSitting ? 0.5 : 2), repeat: isWalking || !isSitting ? Infinity : 0 },
                    rotate: { duration: 2, repeat: Infinity }
                }}
            />

            {/* Screen/Face */}
            <motion.rect
                x="30" y="45" width="40" height="25" rx="5" fill="#0F172A"
                animate={{ y: isSitting ? 15 : 0 }}
            />

            {/* Eyes (Blinking) */}
            <motion.g
                animate={{
                    scaleY: [1, 0.1, 1, 1, 1],
                    y: isSitting ? 15 : 0
                }}
                transition={{
                    scaleY: { duration: 3, repeat: Infinity, times: [0, 0.05, 0.1, 0.8, 1] },
                    y: { duration: 0.5 }
                }}
            >
                <circle cx="40" cy="55" r="4" fill="#34D399" />
                <circle cx="60" cy="55" r="4" fill="#34D399" />
            </motion.g>

            {/* Mouth */}
            <motion.path
                d="M45 62 Q50 65 55 62" stroke="#34D399" strokeWidth="2" strokeLinecap="round"
                animate={{ y: isSitting ? 15 : 0 }}
            />

            {/* Arms */}
            <motion.rect
                x="15" y="50" width="10" height="20" rx="5" fill="#334155"
                animate={{
                    rotate: isWalking ? [10, -10, 10] : (isSitting ? -45 : 0),
                    y: isSitting ? 15 : 0
                }}
                style={{ originY: 0 }}
                transition={{ duration: 0.8, repeat: isWalking ? Infinity : 0 }}
            />
            <motion.rect
                x="75" y="50" width="10" height="20" rx="5" fill="#334155"
                animate={isWaving ? { rotate: [0, -140, -100, -140, 0] } : {
                    rotate: isWalking ? [-10, 10, -10] : (isSitting ? 45 : 0),
                    y: isSitting ? 15 : 0
                }}
                style={{ originY: 0 }}
                transition={isWaving ? { duration: 1 } : { duration: 0.8, repeat: isWalking ? Infinity : 0 }}
            />

            {/* Antenna */}
            <motion.g animate={{ y: isSitting ? 15 : 0 }}>
                <line x1="50" y1="40" x2="50" y2="30" stroke="#334155" strokeWidth="3" />
                <motion.circle
                    cx="50" cy="25" r="5" fill="#EF4444"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                />
            </motion.g>
        </svg>
    );
};

const RobotAssistant = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [speech, setSpeech] = useState("");
    const [aiMessage, setAiMessage] = useState(""); // Store the "important" AI message
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showUpgrade, setShowUpgrade] = useState(false);
    const [isWalking, setIsWalking] = useState(false);
    const [isWaving, setIsWaving] = useState(false);
    const [isSitting, setIsSitting] = useState(false);
    const [hasPermission, setHasPermission] = useState(false);

    const { getToken, isLoaded, isSignedIn } = useAuth();
    const controls = useAnimation();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // --- Random "Naughty" Thoughts ---
    const NAUGHTY_THOUGHTS = [
        "Sitting here watching you waste money... 👀",
        "My back hurts from carrying your budget 🏋️",
        "Do you really need that many subscriptions? 🤔",
        "I'm judging your cloud bill right now...",
        "Bored... might delete a server later (jk) 😈",
        "Why walk when I can sit and judge? 🛋️",
        "Did you check the dashboard or just me? 🤨"
    ];

    // --- Update speech when AI message arrives ---
    useEffect(() => {
        if (aiMessage && !hasPermission) {
            setSpeech(aiMessage);
        }
    }, [aiMessage, hasPermission]);

    // --- Animation Logic ---
    useEffect(() => {
        let isMounted = true;

        const walkCycle = async () => {
            if (!hasPermission) {
                // Sit and show AI message for 10 minutes before auto-starting roaming
                setIsSitting(true);
                if (aiMessage) {
                    setSpeech(aiMessage);
                }

                // Wait for 10 minutes (600,000ms) or until user clicks
                await new Promise(r => setTimeout(r, 600000));
                if (!isMounted || hasPermission) return;

                // After 10 mins, auto-grant permission and start roaming
                setHasPermission(true);
                setIsSitting(false);
                setSpeech("Time to patrol! 🚀");
                await new Promise(r => setTimeout(r, 2000));
            }

            // Active Roaming Cycle (Permission Granted or Auto-granted after 10 mins)
            while (isMounted && hasPermission) {
                // Walk to left
                setIsSitting(false);
                setIsWalking(true);
                setSpeech("Patrolling for leaks... 🚶");
                const targetPos = -200;
                await controls.start({ x: targetPos, transition: { duration: 6, ease: "linear" } });
                setIsWalking(false);

                // Wave
                setIsWaving(true);
                setSpeech("All clear here! 👋");
                await new Promise(r => setTimeout(r, 2000));
                setIsWaving(false);

                // Walk back
                setIsWalking(true);
                setSpeech("Heading back... 🚶");
                await controls.start({ x: 0, transition: { duration: 6, ease: "linear" } });
                setIsWalking(false);

                // Sit and show AI message or random thought
                setIsSitting(true);
                if (aiMessage && Math.random() > 0.5) {
                    // 50% chance to show AI message again
                    setSpeech(aiMessage);
                } else {
                    const randomThought = NAUGHTY_THOUGHTS[Math.floor(Math.random() * NAUGHTY_THOUGHTS.length)];
                    setSpeech(randomThought);
                }

                // Sit for 15s
                await new Promise(r => setTimeout(r, 15000));

                // Stand
                setIsSitting(false);
                setSpeech("Back to work! ⚡");
                await new Promise(r => setTimeout(r, 2000));
            }
        };

        walkCycle();

        return () => { isMounted = false; };
    }, [controls, hasPermission, aiMessage]); // Re-run if aiMessage changes

    // --- Fetch Initial Speech on Mount ---
    useEffect(() => {
        const fetchSpeech = async () => {
            if (!isLoaded || !isSignedIn) return;

            // Add delay to ensure token is ready (1 second for reliability)
            await new Promise(resolve => setTimeout(resolve, 1000));

            try {
                const token = await getToken();
                if (!token) return;

                const apiUrl = getApiUrl();
                const response = await axios.get(`${apiUrl}/robot/speech`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.data.message) {
                    setSpeech(response.data.message);
                    setAiMessage(response.data.message); // Save as priority message
                }
            } catch (error) {
                console.error("Failed to fetch robot speech", error);
            }
        };
        fetchSpeech();
    }, [getToken, isLoaded, isSignedIn]);

    // --- Scroll to bottom of chat ---
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setInput("");
        setIsLoading(true);

        try {
            const token = await getToken();
            const apiUrl = getApiUrl();
            const response = await axios.post(`${apiUrl}/robot/chat`,
                { message: userMsg },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setMessages(prev => [...prev, { role: 'assistant', content: response.data.message }]);

            if (response.data.shouldUpgrade) {
                setShowUpgrade(true);
            }
        } catch (error) {
            console.error("Chat error", error);
            setMessages(prev => [...prev, { role: 'assistant', content: "My circuits are fried! Try again later 😵" }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRobotClick = async () => {
        if (!hasPermission) {
            setHasPermission(true);
            setSpeech("On it! 🚀");
        } else {
            // Stop walking and return to corner when opening chat
            setIsWalking(false);
            setIsSitting(false);
            await controls.start({ x: 0, transition: { duration: 0.5, ease: "easeOut" } });
            setIsOpen(true);
        }
    };

    const handleChatClose = () => {
        setIsOpen(false);
        // Robot will resume its normal cycle via the animation useEffect
    };

    return (
        <motion.div
            animate={controls}
            className="fixed bottom-4 right-4 z-50 no-print flex flex-col items-end pointer-events-none"
        >
            {/* Speech Bubble */}
            <AnimatePresence mode="wait">
                {!isOpen && speech && (
                    <motion.div
                        key={speech}
                        initial={{ opacity: 0, y: 20, scale: 0.8 }}
                        animate={{
                            opacity: 1,
                            y: isSitting ? 10 : 0,
                            scale: 1
                        }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="mb-4 mr-4 bg-white text-slate-900 px-4 py-3 rounded-2xl rounded-br-none shadow-xl border border-slate-200 max-w-[200px] pointer-events-auto relative cursor-pointer"
                        onClick={handleRobotClick}
                    >
                        <p className="text-sm font-medium leading-snug">{speech}</p>
                        {!hasPermission && (
                            <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1 text-xs font-bold text-emerald-600">
                                <Play className="w-3 h-3 fill-current" /> Let me explore! 🥺👉👈
                            </div>
                        )}
                        {/* Speech bubble tail */}
                        <div className="absolute -bottom-2 right-4 w-4 h-4 bg-white border-b border-r border-slate-200 transform rotate-45"></div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Robot Avatar */}
            <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleRobotClick}
                className="cursor-pointer pointer-events-auto"
            >
                <CuteRobot isWalking={isWalking} isWaving={isWaving} isSitting={isSitting} />
            </motion.div>

            {/* Chat Drawer Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleChatClose}
                            className="fixed inset-0 bg-black/50 z-40 pointer-events-auto"
                        />

                        {/* Drawer Panel */}
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 right-0 md:right-4 w-full md:w-[400px] h-[80vh] max-h-[600px] bg-slate-950 border-t border-x border-slate-800 rounded-t-2xl z-50 pointer-events-auto flex flex-col shadow-2xl"
                        >
                            <div className="mx-auto w-full flex flex-col h-full p-4">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                                            <Sparkles className="w-6 h-6 text-emerald-500" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white">SubTrack</h3>
                                            <p className="text-xs text-slate-400">Your money-saving sidekick</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={handleChatClose}>
                                        <X className="w-5 h-5 text-slate-400" />
                                    </Button>
                                </div>

                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                                    {messages.length === 0 && (
                                        <div className="text-center text-slate-500 mt-10">
                                            <p className="mb-2">👋 Hi! I'm your personal cost optimizer.</p>
                                            <p className="text-sm">Ask me anything about your subscriptions!</p>
                                        </div>
                                    )}

                                    {messages.map((msg, i) => (
                                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user'
                                                ? 'bg-emerald-500 text-white rounded-tr-none'
                                                : 'bg-slate-800 text-slate-200 rounded-tl-none'
                                                }`}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    ))}

                                    {isLoading && (
                                        <div className="flex justify-start">
                                            <div className="bg-slate-800 p-3 rounded-2xl rounded-tl-none flex gap-1">
                                                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-2 h-2 bg-slate-500 rounded-full" />
                                                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-2 h-2 bg-slate-500 rounded-full" />
                                                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-2 h-2 bg-slate-500 rounded-full" />
                                            </div>
                                        </div>
                                    )}

                                    {/* Upgrade Nudge Removed */}

                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input */}
                                <form onSubmit={handleSendMessage} className="flex gap-2">
                                    <Input
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        placeholder="Ask about your savings..."
                                        className="bg-slate-900 border-slate-800 text-white focus:border-emerald-500"
                                        disabled={isLoading || showUpgrade}
                                    />
                                    <Button
                                        type="submit"
                                        size="icon"
                                        className="bg-emerald-500 hover:bg-emerald-600 text-white"
                                        disabled={isLoading || showUpgrade || !input.trim()}
                                    >
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default RobotAssistant;
