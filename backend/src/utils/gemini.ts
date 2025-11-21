import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface SmartRecommendationParams {
    serviceName: string;
    rawDataObject: any;
    monthlyCostInINR: number;
    issue: string; // e.g., "zombie" or "overprovisioned"
}

/**
 * Generates a smart, roast-y recommendation using Gemini AI
 * Returns a casual, confident line that feels like a rich Indian indie-hacker friend
 * 
 * @example
 * "Bro, you haven't touched GitHub in 90 days. That's ₹18k literally burning every year. Pocket this immediately."
 */
export async function getSmartRecommendation(params: SmartRecommendationParams): Promise<string> {
    const { serviceName, rawDataObject, monthlyCostInINR, issue } = params;

    // Rock-solid fallback
    const fallbackRecommendations = {
        zombie: `You haven't used ${serviceName} in months. That's ₹${monthlyCostInINR.toLocaleString('en-IN')} burning every month, yaar.`,
        overprovisioned: `${serviceName} is way overprovisioned. You're using like 10% of what you're paying for. Save ₹${monthlyCostInINR.toLocaleString('en-IN')}/month immediately.`,
        default: `Cancel ${serviceName} and pocket ₹${monthlyCostInINR.toLocaleString('en-IN')}/month. What are you even doing?`
    };

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `You are a rich, successful Indian indie hacker giving brutally honest advice to a friend about wasting money on SaaS subscriptions.

Service: ${serviceName}
Monthly Cost: ₹${monthlyCostInINR.toLocaleString('en-IN')}
Issue: ${issue}
Data: ${JSON.stringify(rawDataObject, null, 2)}

Write a SHORT (max 2 sentences), casual, slightly roasting recommendation that:
- Uses Indian English slang (bro, yaar, literally burning)
- Is direct and money-obsessed  
- Sounds like a friend calling out bad spending
- Mentions the exact INR amount
- Uses phrases like "pocket this immediately", "what are you even doing", "burning money"

Keep it punchy and conversion-focused. No fluff. Just raw truth.`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // Clean up the response (remove quotes, extra newlines)
        const cleaned = text
            .replace(/^["']|["']$/g, '')
            .replace(/\n+/g, ' ')
            .trim();

        // Validate length (max 200 chars for UI)
        if (cleaned.length > 200 || cleaned.length < 10) {
            throw new Error('Invalid response length');
        }

        return cleaned;
    } catch (error) {
        console.error('Gemini API error:', error);

        // Use fallback based on issue type
        if (issue === 'zombie') return fallbackRecommendations.zombie;
        if (issue === 'overprovisioned') return fallbackRecommendations.overprovisioned;
        return fallbackRecommendations.default;
    }
}

/**
 * Generate recommendations in batch (more efficient for multiple findings)
 */
export async function getSmartRecommendationsBatch(
    findings: SmartRecommendationParams[]
): Promise<Map<string, string>> {
    const recommendations = new Map<string, string>();

    // Process in parallel with a concurrency limit of 3
    const chunks = [];
    for (let i = 0; i < findings.length; i += 3) {
        chunks.push(findings.slice(i, i + 3));
    }

    for (const chunk of chunks) {
        const promises = chunk.map(async (finding) => {
            const key = `${finding.serviceName}-${finding.issue}`;
            const recommendation = await getSmartRecommendation(finding);
            recommendations.set(key, recommendation);
        });

        await Promise.all(promises);
    }

    return recommendations;
}
