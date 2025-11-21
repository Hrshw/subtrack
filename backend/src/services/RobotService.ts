import { RobotChatCache } from '../models/RobotChatCache';
import { User } from '../models/User';
import { ScanResult } from '../models/ScanResult';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Model priority list for robot speech - free models first
const ROBOT_MODEL_PRIORITY_LIST = [
    'mistralai/mistral-7b-instruct:free',
    'google/gemma-7b-it:free',
    'qwen/qwen-2.5-7b-instruct:free',
    'meta-llama/llama-3.2-3b-instruct:free',
];

const THROTTLE_MINUTES = 20;
const FREE_USER_MESSAGE_LIMIT = 1;

export class RobotService {
    /**
     * Get dynamic robot speech bubble message
     */
    static async getRobotSpeech(userId: string): Promise<string> {
        try {
            const user = await User.findById(userId);
            if (!user) return this.getTimeBasedGreeting();

            const isPro = user.subscriptionStatus === 'pro';
            const now = new Date();

            // Check cache
            const cache = await RobotChatCache.findOne({ userId });

            // 1. If cache exists and is valid (within 5 mins), return it
            if (cache && cache.timestamp) {
                const minutesSinceLastCall = (now.getTime() - new Date(cache.timestamp).getTime()) / (1000 * 60);
                if (minutesSinceLastCall < THROTTLE_MINUTES) {
                    console.log(`✅ Robot speech cache HIT for user ${userId} (${minutesSinceLastCall.toFixed(1)}min ago)`);
                    return cache.lastMessage;
                }
            }

            // 2. If NO cache exists (First load ever), return Time-Based Greeting (No AI)
            if (!cache) {
                console.log(`👋 First load for user ${userId} - returning time-based greeting`);
                const greeting = this.getTimeBasedGreeting();

                // Save to cache so it persists for 5 mins
                await RobotChatCache.create({
                    userId,
                    lastMessage: greeting,
                    timestamp: now,
                    isPro,
                    messageCount: 0,
                    lastResetAt: now
                });

                return greeting;
            }

            // 3. If cache exists but expired (Subsequent loads), generate AI Roast
            console.log(`🤖 Generating NEW robot speech for user ${userId} (isPro: ${isPro})`);

            // Get real scan data
            const scanResults = await ScanResult.find({ userId }).sort({ createdAt: -1 }).limit(10).catch(() => []);
            const leaks = scanResults.filter(r => r.status === 'zombie' || r.status === 'downgrade_possible' || r.status === 'unused');
            const healthyServices = scanResults.filter(r => r.status === 'active');
            const totalSavings = leaks.reduce((sum, leak) => sum + leak.potentialSavings, 0);
            const totalServices = scanResults.length;
            const hasLeaks = leaks.length > 0;
            const allHealthy = totalServices > 0 && healthyServices.length === totalServices && !hasLeaks;

            // Generate context-aware AI message
            let prompt: string;

            if (allHealthy && totalServices > 0) {
                prompt = `You are a cute, sassy robot assistant. User is a COST CHAMPION! All ${totalServices} services optimal.
Generate a SHORT (max 12 words) celebratory message. Use Indian slang (bro, yaar). Be proud.
Example: "Zero waste detected, you're literally perfect yaar!"`;
            } else if (hasLeaks) {
                prompt = `You are a cute, sassy robot assistant. User has ${leaks.length} leaks worth ₹${totalSavings.toLocaleString('en-IN')}.
Generate a SHORT (max 12 words) roast/nudge. Use Indian slang.
Example: "Found ${leaks.length} leaks worth ₹${totalSavings.toLocaleString('en-IN')} — let's kill them bro"`;
            } else {
                prompt = `You are a cute, sassy robot assistant.
Generate a SHORT (max 12 words) engaging message about saving money. Use Indian slang.
Example: "I'm your money-saving sidekick, click to chat!"`;
            }

            const message = await this.generateWithOpenRouter(prompt, {
                temperature: 0.9,
                max_tokens: 50,
                top_p: 0.95,
            }) || this.getTimeBasedGreeting(); // Fallback to greeting if AI fails

            // Update cache
            await RobotChatCache.findOneAndUpdate(
                { userId },
                {
                    lastMessage: message,
                    timestamp: now,
                    isPro,
                    messageCount: 0,
                    lastResetAt: now
                },
                { upsert: true, new: true }
            );

            return message;

        } catch (error) {
            console.error('❌ Robot speech generation failed:', error);
            return this.getTimeBasedGreeting();
        }
    }

    /**
     * Handle mini-chat message
     */
    static async handleChatMessage(userId: string, userMessage: string): Promise<{ message: string; shouldUpgrade: boolean }> {
        try {
            const user = await User.findById(userId);
            if (!user) return { message: "Login to chat with me!", shouldUpgrade: false };

            const isPro = user.subscriptionStatus === 'pro';
            const now = new Date();

            // Get or create cache
            let cache = await RobotChatCache.findOne({ userId });
            if (!cache) {
                cache = await RobotChatCache.create({
                    userId,
                    lastMessage: '',
                    timestamp: now,
                    isPro,
                    messageCount: 0,
                    lastResetAt: now
                });
            }

            // Reset window if needed
            const minutesSinceReset = (now.getTime() - new Date(cache.lastResetAt).getTime()) / (1000 * 60);
            if (minutesSinceReset >= THROTTLE_MINUTES) {
                cache.messageCount = 0;
                cache.lastResetAt = now;
            }

            // Check limits
            if (!isPro && cache.messageCount >= FREE_USER_MESSAGE_LIMIT) {
                return {
                    message: "Want unlimited AI help + weekly auto-scans? Upgrade to Pro — we need your support to keep building this ❤️",
                    shouldUpgrade: true
                };
            }

            // Generate response
            const scanResults = await ScanResult.find({ userId }).sort({ createdAt: -1 }).limit(5);
            const leaks = scanResults.filter(r => r.status === 'zombie' || r.status === 'downgrade_possible');
            const context = leaks.length > 0
                ? `User has ${leaks.length} leaks: ${leaks.map(l => `${l.resourceName} (₹${l.potentialSavings})`).join(', ')}`
                : 'User has no current leaks';

            const prompt = `You are SubTrack's AI assistant — a sassy, helpful robot for Indian indie hackers.
Context: ${context}
User tier: ${isPro ? 'Pro' : 'Free'}
User question: "${userMessage}"

Respond in 1-2 sentences. Be helpful, direct, slightly sassy. Use Indian slang (bro, yaar).
${!isPro ? 'Subtly hint they should upgrade (but don\'t be pushy).' : ''}`;

            const response = await this.generateWithOpenRouter(prompt, {
                temperature: 0.8,
                max_tokens: 150,
                top_p: 0.95,
            }) || "My AI brain is taking a coffee break ☕ Try again in a moment!";

            // Update usage
            cache.messageCount += 1;
            cache.timestamp = now;
            await cache.save();

            return { message: response, shouldUpgrade: false };

        } catch (error) {
            console.error('❌ Chat message handling failed:', error);
            return { message: "Oops! My circuits got tangled. Try again?", shouldUpgrade: false };
        }
    }

    /**
     * Generate text using OpenRouter with cleanup
     */
    private static async generateWithOpenRouter(
        prompt: string,
        options: { temperature: number; max_tokens: number; top_p: number }
    ): Promise<string | null> {
        if (!OPENROUTER_API_KEY) return null;

        for (const model of ROBOT_MODEL_PRIORITY_LIST) {
            try {
                const response = await fetch(OPENROUTER_API_URL, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                        'Content-Type': 'application/json',
                        'HTTP-Referer': 'https://saassaver.vercel.app',
                        'X-Title': 'SaaSSaver',
                    },
                    body: JSON.stringify({
                        model,
                        messages: [{ role: 'user', content: prompt }],
                        temperature: options.temperature,
                        max_tokens: options.max_tokens,
                        top_p: options.top_p,
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    const rawText = data.choices?.[0]?.message?.content?.trim();

                    if (rawText) {
                        const cleanedText = this.cleanResponse(rawText);
                        console.log(`✅ Raw: "${rawText.substring(0, 50)}..." -> Cleaned: "${cleanedText.substring(0, 50)}..."`);
                        return cleanedText;
                    }
                }
            } catch (error) {
                continue;
            }
        }
        return null;
    }

    /**
     * Clean up AI response tokens
     */
    private static cleanResponse(text: string): string {
        return text
            .replace(/<s>|<\/s>|\[OUT\]|\[INST\]|\[\/INST\]|<<SYS>>|<<\/SYS>>/g, '') // Remove special tokens
            .replace(/^["']|["']$/g, '') // Remove surrounding quotes
            .replace(/\n+/g, ' ') // Flatten newlines
            .trim();
    }

    /**
     * Get time-based greeting (Hard-coded, no AI)
     */
    private static getTimeBasedGreeting(): string {
        const hour = new Date().getHours();
        const day = new Date().getDay(); // 0 = Sunday, 6 = Saturday
        const isWeekend = day === 0 || day === 6;

        // Randomize slightly to avoid feeling static
        const random = Math.random();

        if (isWeekend && random > 0.5) {
            return "Weekend vibe! But your AWS bill doesn't sleep — let's kill it 🚀";
        }

        if (hour >= 5 && hour < 12) {
            return random > 0.5
                ? "Sup bro! Ready to save some money today? ☕"
                : "Morning! Let's find some leaks with your coffee ☕";
        } else if (hour >= 12 && hour < 17) {
            return random > 0.5
                ? "Yo! Found any leaks yet? Let's roast them 🔥"
                : "Afternoon grind! Don't let AWS grind your wallet 💸";
        } else if (hour >= 17 && hour < 21) {
            return random > 0.5
                ? "Evening beta! Time to cancel some zombies before dinner 🥘"
                : "Work's done? Not until we fix these subscriptions! 🛑";
        } else {
            return random > 0.5
                ? "Still up grinding? Let's find that wasted ₹47k while the world sleeps 😈"
                : "Late night coding? Don't let your servers burn money all night 🌙";
        }
    }
}
