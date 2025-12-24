import { RobotChatCache } from '../models/RobotChatCache';
import { User } from '../models/User';
import { ScanResult } from '../models/ScanResult';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Model priority list for robot chat - best free models for cost/finance analysis
// MiMo-V2-Flash is #1 in Finance, DeepSeek excellent at reasoning
const ROBOT_MODEL_PRIORITY_LIST = [
    'xiaomi/mimo-v2-flash:free',              // #1 in Finance, excellent reasoning
    'deepseek/deepseek-r1t2-chimera:free',    // Great for reasoning & financial analysis
    'allenai/olmo-3.1-32b-think:free',        // Deep reasoning, complex logic
    'openai/gpt-oss-120b:free',               // High-reasoning, general purpose
    'nvidia/nemotron-3-nano-30b-a3b:free',    // Efficient, good accuracy
    'mistralai/devstral-2-2512:free',         // Large context, general tasks
];

const THROTTLE_MINUTES = 60; // 1 hour before regenerating speech bubble
const FREE_USER_MESSAGE_LIMIT = 4; // 4 messages per day for free users
const FREE_USER_RESET_MINUTES = 1440; // 24 hours = 1 day

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

            // 1. If cache exists and is fresh (within THROTTLE time), return it
            if (cache && cache.timestamp) {
                const minutesSinceLastCall = (now.getTime() - new Date(cache.timestamp).getTime()) / (1000 * 60);
                if (minutesSinceLastCall < THROTTLE_MINUTES) {
                    console.log(`✅ Robot speech cache HIT for user ${userId} (${minutesSinceLastCall.toFixed(1)}min ago)`);
                    return cache.lastMessage;
                }
            }

            // 2. Cache expired or doesn't exist
            // For first load OR after 1+ hour idle: Show greeting first, then AI next time

            const shouldShowGreeting = !cache || (cache && cache.greetingShown === false);

            if (shouldShowGreeting) {
                // Show time-based greeting
                console.log(`👋 Showing greeting for user ${userId} (first load or after long idle)`);
                const greeting = this.getTimeBasedGreeting();

                // Save to cache with flag
                await RobotChatCache.findOneAndUpdate(
                    { userId },
                    {
                        userId,
                        lastMessage: greeting,
                        timestamp: now,
                        isPro,
                        messageCount: cache?.messageCount || 0,
                        lastResetAt: cache?.lastResetAt || now,
                        greetingShown: true // Mark that greeting was shown
                    },
                    { upsert: true, new: true }
                );

                return greeting;
            }

            // 3. Greeting already shown, now generate AI response
            console.log(`🤖 Generating AI robot speech for user ${userId} (isPro: ${isPro})`);

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
                prompt = `You are a friendly robot mascot for a subscription tracker app (NOT a financial service).
Your job: Create a fun, celebratory message for a user who has all ${totalServices} connected apps optimized.
Requirements: MAX 12 words. Use casual Indian-English (bro, yaar). Be excited and positive.
Output ONLY the message, nothing else.
Example output: "Zero waste detected, you're literally perfect yaar!"`;
            } else if (hasLeaks) {
                prompt = `You are a friendly robot mascot for a subscription tracker app (NOT a financial service).
Your job: Create a playful nudge about ${leaks.length} unused/zombie subscriptions totaling ₹${totalSavings.toLocaleString('en-IN')}.
Requirements: MAX 12 words. Use casual Indian-English (bro, yaar). Be cheeky but helpful.
Output ONLY the message, nothing else.
Example output: "Found ${leaks.length} sleeping apps — time to wake up bro!"`;
            } else {
                prompt = `You are a friendly robot mascot for a subscription tracker app (NOT a financial service).
Your job: Create a fun greeting encouraging the user to explore their connected apps.
Requirements: MAX 12 words. Use casual Indian-English (bro, yaar). Be friendly and curious.
Output ONLY the message, nothing else.
Example output: "I'm your app-tracking buddy, click to explore!"`;
            }

            let message = await this.generateWithOpenRouter(prompt, {
                temperature: 0.9,
                max_tokens: 50,
                top_p: 0.95,
            });

            // Check for AI refusal patterns and use fallback
            const refusalPatterns = ['cannot', 'can\'t', 'unable to', 'financial advice', 'as an ai', 'i apologize'];
            const hasRefusal = message && refusalPatterns.some(p => message!.toLowerCase().includes(p));

            if (!message || hasRefusal) {
                message = this.getTimeBasedGreeting();
            }

            // Update cache - reset greetingShown so next cycle starts with greeting again
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

            // Reset window if needed (24 hours for chat limits)
            const minutesSinceReset = (now.getTime() - new Date(cache.lastResetAt).getTime()) / (1000 * 60);
            if (minutesSinceReset >= FREE_USER_RESET_MINUTES) {
                cache.messageCount = 0;
                cache.lastResetAt = now;
            }

            // Check limits (4 messages per day for free users)
            const remainingMessages = FREE_USER_MESSAGE_LIMIT - cache.messageCount;
            if (!isPro && cache.messageCount >= FREE_USER_MESSAGE_LIMIT) {
                return {
                    message: `You've used all ${FREE_USER_MESSAGE_LIMIT} free messages today! Upgrade to Pro for unlimited AI help + weekly auto-scans ❤️`,
                    shouldUpgrade: true
                };
            }

            // Get REAL user data for context
            const userName = (user as any).name || user.email?.split('@')[0] || 'there';
            const scanResults = await ScanResult.find({ userId }).sort({ createdAt: -1 }).limit(20);
            const leaks = scanResults.filter(r => r.status === 'zombie' || r.status === 'downgrade_possible' || r.status === 'unused');
            const healthyServices = scanResults.filter(r => r.status === 'active');
            const totalSavings = leaks.reduce((sum, l) => sum + (l.potentialSavings || 0), 0);

            // Build detailed context from ACTUAL scan data
            const leakDetails = leaks.map(l => {
                const rawData = l.rawData || {};
                return `${l.resourceName} (${l.resourceType || 'service'}, ₹${l.potentialSavings}/mo, reason: ${l.reason || 'unused'})`;
            }).join('; ');

            const healthyDetails = healthyServices.slice(0, 5).map(s => s.resourceName).join(', ');

            // Get specific resource info if user asks about something
            const relevantResources = scanResults.filter(r =>
                userMessage.toLowerCase().includes(r.resourceName.toLowerCase()) ||
                (r.resourceType && userMessage.toLowerCase().includes(r.resourceType.toLowerCase()))
            );

            const specificContext = relevantResources.length > 0
                ? `\nRelevant resources found: ${relevantResources.map(r =>
                    `${r.resourceName} (type: ${r.resourceType}, status: ${r.status}, savings: ₹${r.potentialSavings}, raw: ${JSON.stringify(r.rawData || {}).substring(0, 200)})`
                ).join('; ')}`
                : '';

            const prompt = `You are SubTrack's AI assistant helping ${userName} manage their dev tool subscriptions.

=== USER'S ACTUAL DATA ===
User Name: ${userName}
User Tier: ${isPro ? 'Pro' : 'Free'}
Total Leaks Found: ${leaks.length} (potential savings: ₹${totalSavings.toLocaleString('en-IN')}/month)
Healthy Services: ${healthyServices.length} (${healthyDetails || 'none yet'})
Leak Details: ${leakDetails || 'No leaks detected'}
${specificContext}
=== END DATA ===

User Question: "${userMessage}"

IMPORTANT: 
- ONLY reference the data shown above. Do NOT make up instances, prices, or services.
- If user asks about something not in their data, say "I don't see that in your connected services."
- Be helpful, direct, and use casual Indian-English (bro, yaar).
- Keep response to 2-3 sentences max.
${!isPro ? `- User has ${remainingMessages - 1} messages left today.` : ''}`;

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
     * Generate text using OpenRouter with cleanup and TOON optimization
     */
    private static async generateWithOpenRouter(
        prompt: string,
        options: { temperature: number; max_tokens: number; top_p: number }
    ): Promise<string | null> {
        if (!OPENROUTER_API_KEY) return null;

        // TOON (Token-Oriented Object Notation) - Optimize prompt for token efficiency
        const toonPrompt = this.toTOON(prompt);

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
                        messages: [{ role: 'user', content: toonPrompt }],
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
     * Clean up AI response tokens - remove ALL unwanted prefixes and formatting
     */
    private static cleanResponse(text: string): string {
        return text
            // Remove common model output prefixes/markers
            .replace(/\[BOOK\]|\[BOT\]|\[INST\]|\[\/INST\]|\[OUT\]|\[SYS\]|\[\/SYS\]/gi, '')
            // Remove special tokens
            .replace(/<s>|<\/s>|<<SYS>>|<<\/SYS>>/g, '')
            // Remove markdown bold/italic markers at start
            .replace(/^\*\*|\*\*$|^\*|\*$|^_|_$/g, '')
            // Remove pipe separators at start
            .replace(/^\|+\s*/g, '')
            // Remove surrounding quotes
            .replace(/^["']|["']$/g, '')
            // Flatten multiple spaces and newlines
            .replace(/\n+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * TOON (Token-Oriented Object Notation) - Convert verbose prompts to compact format
     * Reduces token count by ~30-40% by using abbreviations and compact syntax
     */
    private static toTOON(prompt: string): string {
        // Extract key information and compress
        return prompt
            // Compress common phrases
            .replace(/You are a cute, sassy robot assistant\./gi, 'Role:SassyBot')
            .replace(/Generate a SHORT \(max (\d+) words\)/gi, 'Gen:max$1w')
            .replace(/Use Indian slang \(bro, yaar\)\./gi, 'Lang:IN-slang')
            .replace(/Be proud\./gi, 'Tone:proud')
            .replace(/Example:/gi, 'Ex:')
            .replace(/services optimal/gi, 'svcs✓')
            .replace(/leaks worth/gi, 'leaks:')
            .replace(/rupees/gi, '₹')
            // Compress structural elements
            .replace(/\s+/g, ' ')
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
