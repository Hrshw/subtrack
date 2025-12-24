// backend/utils/ai.ts
// OpenRouter AI with multi-model fallback support

interface SmartRecommendationParams {
    serviceName: string;
    rawDataObject: any;
    monthlyCostInINR: number;
    issue: string; // e.g., "zombie" or "overprovisioned"
}

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// List of models in priority order - OpenRouter will try each until one works
// Free tier models first, then paid but cheap models
// Note: Some free models may not be available, so we try multiple
const MODEL_PRIORITY_LIST = [
    'mistralai/mistral-7b-instruct:free',         // Free tier (confirmed working)
    'google/gemma-7b-it:free',                    // Free tier
    'qwen/qwen-2.5-7b-instruct:free',             // Free tier
    'meta-llama/llama-3.2-3b-instruct:free',      // Free tier (alternative to 8b)
];

/**
 * Fallback recommendation templates when all AI models fail
 */
const getFallbackRecommendation = (
    serviceName: string,
    monthlyCostInINR: number,
    issue: string
): string => {
    const cost = monthlyCostInINR.toLocaleString('en-IN');

    const templates = {
        zombie: [
            `Bro, ${serviceName} is just sitting there unused. That's ₹${cost}/month going down the drain!`,
            `Yaar, you haven't touched ${serviceName} in ages. ₹${cost} every month for nothing!`,
            `Beta, ${serviceName} is a zombie service. Kill it and save ₹${cost}/month.`
        ],
        overprovisioned: [
            `${serviceName} is way too powerful for what you need. Downsize and save ₹${cost}/month!`,
            `Your ${serviceName} is overkill, bro. Right-size it and pocket ₹${cost}/month.`,
            `Overprovisioned alert! ${serviceName} can be smaller. Save ₹${cost}/month immediately.`
        ],
        default: [
            `Cancel ${serviceName} and save ₹${cost}/month right now.`,
            `You're wasting ₹${cost}/month on ${serviceName}. Time to cut it!`,
            `${serviceName} = ₹${cost}/month wasted. Cancel it, yaar!`
        ]
    };

    const options = templates[issue as keyof typeof templates] || templates.default;
    return options[Math.floor(Math.random() * options.length)];
};

/**
 * Try fallback models one by one if primary model fails
 */
async function tryFallbackModels(
    prompt: string,
    primaryModel: string
): Promise<string> {
    // Skip primary model (already tried) and try rest
    const fallbackModels = MODEL_PRIORITY_LIST.filter(m => m !== primaryModel);

    for (const model of fallbackModels) {
        try {
            console.log(`Trying fallback model: ${model}...`);

            const response = await fetch(OPENROUTER_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': process.env.OPENROUTER_REFERRER || 'https://saassaver.vercel.app',
                    'X-Title': 'SaaSSaver',
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        {
                            role: 'user',
                            content: prompt,
                        },
                    ],
                    temperature: 0.9,
                    max_tokens: 400,
                    top_p: 0.95,
                })
            });

            if (response.ok) {
                const data = await response.json();
                const text = data.choices?.[0]?.message?.content?.trim();

                if (text && text.length >= 5) {
                    console.log(`✅ Fallback model ${model} succeeded!`);
                    return text;
                }
            }

            // If this model failed, continue to next
            console.warn(`⚠️ Model ${model} failed, trying next...`);

        } catch (error: any) {
            console.warn(`⚠️ Model ${model} error:`, error.message);
            // Continue to next model
            continue;
        }
    }

    throw new Error('All models failed');
}

/**
 * Generates a smart, roast-y recommendation using OpenRouter with multi-model fallback
 * Automatically switches between free and paid models if one fails
 */
export async function getSmartRecommendation(
    params: SmartRecommendationParams,
    style: 'basic' | 'savage' = 'savage'
): Promise<string> {
    const { serviceName, rawDataObject, monthlyCostInINR, issue } = params;

    // If no API key, use fallback templates
    if (!OPENROUTER_API_KEY) {
        console.log('⚠️ No OpenRouter API key found, using fallback templates');
        return getFallbackRecommendation(serviceName, monthlyCostInINR, issue);
    }

    const prompt = style === 'savage'
        ? `You are a savage Indian indie hacker roasting a friend for wasting money.

Service: ${serviceName}
Cost: ₹${monthlyCostInINR.toLocaleString('en-IN')}/month
Issue: ${issue}
Raw data: ${JSON.stringify(rawDataObject)}

Roast them in 1-2 sentences. Use bro/yaar/beta, mention exact ₹ amount, be funny and brutal.`
        : `Give a short professional tip to save ₹${monthlyCostInINR.toLocaleString('en-IN')}/month on ${serviceName}.`;

    const primaryModel = MODEL_PRIORITY_LIST[0];

    try {
        console.log(`🚀 Calling OpenRouter with primary model: ${primaryModel}...`);

        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': process.env.OPENROUTER_REFERRER || 'https://saassaver.vercel.app',
                'X-Title': 'SaaSSaver',
            },
            body: JSON.stringify({
                model: primaryModel,
                messages: [
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: 0.9,
                max_tokens: 400,
                top_p: 0.95,
            })
        });

        if (!response.ok) {
            // If rate limited, model unavailable, or token limit reached, try fallback models
            if (response.status === 429 || response.status === 503 || response.status === 402) {
                const errorData = await response.json().catch(() => ({}));
                console.warn(`⚠️ Primary model failed (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
                console.log(`🔄 Attempting fallback models...`);
                return await tryFallbackModels(prompt, primaryModel);
            }

            const errorText = await response.text();
            throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content?.trim();
        const usedModel = data.model; // Which model actually processed the request

        if (!text || text.length < 5) {
            throw new Error("Empty or invalid response");
        }

        console.log(`✅ OpenRouter success (model: ${usedModel}):`, text.substring(0, 100) + '...');
        return text;

    } catch (error: any) {
        console.error('❌ OpenRouter primary model failed:', error.message || error);

        // Try fallback models if primary failed
        try {
            console.log(`🔄 Attempting fallback models...`);
            return await tryFallbackModels(prompt, primaryModel);
        } catch (fallbackError: any) {
            console.error('❌ All OpenRouter models failed:', fallbackError.message);
            // If all models fail, use template fallback
            return getFallbackRecommendation(serviceName, monthlyCostInINR, issue);
        }
    }
}

/**
 * Batch version - processes multiple recommendations sequentially
 * Includes delays to avoid rate limits
 */
export async function getSmartRecommendationsBatch(
    findings: SmartRecommendationParams[]
): Promise<Map<string, string>> {
    const recommendations = new Map<string, string>();

    // Process sequentially to avoid rate limits (free tier friendly)
    for (let i = 0; i < findings.length; i++) {
        const finding = findings[i];
        const key = `${finding.serviceName}-${finding.issue}`;

        try {
            const rec = await getSmartRecommendation(finding, 'savage');
            recommendations.set(key, rec);
        } catch (error) {
            console.error(`Failed to get recommendation for ${key}:`, error);
            // Use fallback for this specific finding
            recommendations.set(key, getFallbackRecommendation(
                finding.serviceName,
                finding.monthlyCostInINR,
                finding.issue
            ));
        }

        // Small delay between requests to avoid rate limits (only if multiple findings)
        if (i < findings.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    return recommendations;
}