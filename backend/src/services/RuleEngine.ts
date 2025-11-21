import { ScanResult } from '../models/ScanResult';
import { getSmartRecommendation } from '../utils/gemini';

interface UsageData {
    // Plan information (CRITICAL: Never assume paid plan)
    plan?: string; // e.g., "free", "hobby", "pro", "team", "enterprise"

    // GitHub
    lastCommitDate?: Date;
    hasPrivateRepos?: boolean;

    // Vercel
    bandwidthUsage?: number;
    bandwidthLimit?: number;

    // AWS
    functionInvocations?: number;
    activeRegions?: string[];

    // Sentry
    eventCount?: number;
    planLimit?: number;

    // Linear
    issuesTouched?: number;

    // Resend
    emailsSent?: number;

    // Generic
    activeUsers?: number;
}

// USD to INR conversion (rough estimate)
const USD_TO_INR = 85;

// Plan pricing (monthly, in USD)
const PLAN_COSTS = {
    github: {
        free: 0,
        pro: 4,
        team: 4 // per user
    },
    vercel: {
        hobby: 0,
        pro: 20,
        enterprise: 0 // Contact sales
    },
    sentry: {
        developer: 0,
        team: 29,
        business: 99
    },
    linear: {
        free: 0,
        standard: 8, // per user
        plus: 14 // per user
    }
};

export class RuleEngine {
    static async analyze(userId: string, connectionId: string, provider: string, data: UsageData) {
        const results = [];

        switch (provider) {
            case 'github':
                // CRITICAL FIX: Only flag if user is on a PAID plan
                if (data.plan && data.plan !== 'free' && data.lastCommitDate) {
                    const daysSinceCommit = Math.floor((Date.now() - new Date(data.lastCommitDate).getTime()) / (1000 * 60 * 60 * 24));
                    if (daysSinceCommit > 60) {
                        const planCost = PLAN_COSTS.github[data.plan as keyof typeof PLAN_COSTS.github] || 4;
                        results.push({
                            resourceName: `GitHub ${data.plan.charAt(0).toUpperCase() + data.plan.slice(1)}`,
                            resourceType: 'account',
                            status: 'zombie',
                            potentialSavings: planCost * USD_TO_INR,
                            currency: 'INR',
                            reason: `No commits in ${daysSinceCommit} days on paid plan`,
                            rawData: { daysSinceCommit, lastCommitDate: data.lastCommitDate, plan: data.plan },
                            issue: 'zombie'
                        });
                    } else {
                        results.push({
                            resourceName: `GitHub ${data.plan.charAt(0).toUpperCase() + data.plan.slice(1)}`,
                            resourceType: 'account',
                            status: 'active',
                            potentialSavings: 0,
                            currency: 'INR',
                            reason: `Active: Last commit ${daysSinceCommit} days ago`,
                            rawData: { daysSinceCommit, lastCommitDate: data.lastCommitDate, plan: data.plan },
                            issue: 'none'
                        });
                    }
                } else {
                    // Free plan or active
                    results.push({
                        resourceName: `GitHub ${data.plan ? data.plan.charAt(0).toUpperCase() + data.plan.slice(1) : 'Free'}`,
                        resourceType: 'account',
                        status: 'active',
                        potentialSavings: 0,
                        currency: 'INR',
                        reason: 'Active usage on Free plan',
                        rawData: { plan: data.plan || 'free' },
                        issue: 'none'
                    });
                }
                break;

            case 'vercel':
                // CRITICAL FIX: Only flag downgrade if user is on Pro or Enterprise
                if (data.plan && data.plan !== 'hobby' && data.bandwidthUsage !== undefined && data.bandwidthLimit) {
                    const usagePercent = (data.bandwidthUsage / data.bandwidthLimit) * 100;

                    // Only recommend downgrade if significantly underutilizing
                    if (usagePercent < 20) {
                        const planCost = PLAN_COSTS.vercel[data.plan as keyof typeof PLAN_COSTS.vercel] || 20;
                        results.push({
                            resourceName: `Vercel ${data.plan.charAt(0).toUpperCase() + data.plan.slice(1)}`,
                            resourceType: 'account',
                            status: 'downgrade_possible',
                            potentialSavings: planCost * USD_TO_INR,
                            currency: 'INR',
                            reason: `Using only ${usagePercent.toFixed(1)}% of ${data.plan} plan limits`,
                            rawData: { usagePercent, bandwidthUsage: data.bandwidthUsage, bandwidthLimit: data.bandwidthLimit, plan: data.plan },
                            issue: 'overprovisioned'
                        });
                    } else {
                        results.push({
                            resourceName: `Vercel ${data.plan.charAt(0).toUpperCase() + data.plan.slice(1)}`,
                            resourceType: 'account',
                            status: 'active',
                            potentialSavings: 0,
                            currency: 'INR',
                            reason: `Healthy usage: ${usagePercent.toFixed(1)}% of limit`,
                            rawData: { usagePercent, bandwidthUsage: data.bandwidthUsage, bandwidthLimit: data.bandwidthLimit, plan: data.plan },
                            issue: 'none'
                        });
                    }
                } else {
                    results.push({
                        resourceName: `Vercel ${data.plan ? data.plan.charAt(0).toUpperCase() + data.plan.slice(1) : 'Hobby'}`,
                        resourceType: 'account',
                        status: 'active',
                        potentialSavings: 0,
                        currency: 'INR',
                        reason: 'Active usage on Hobby plan',
                        rawData: { plan: data.plan || 'hobby' },
                        issue: 'none'
                    });
                }
                break;

            case 'sentry':
                // CRITICAL FIX: Only flag if on paid plan with zero usage
                if (data.plan && data.plan !== 'developer' && data.eventCount === 0) {
                    const planCost = PLAN_COSTS.sentry[data.plan as keyof typeof PLAN_COSTS.sentry] || 29;
                    results.push({
                        resourceName: `Sentry ${data.plan.charAt(0).toUpperCase() + data.plan.slice(1)}`,
                        resourceType: 'project',
                        status: 'zombie',
                        potentialSavings: planCost * USD_TO_INR,
                        currency: 'INR',
                        reason: '0 events this month on paid plan',
                        rawData: { eventCount: 0, plan: data.plan },
                        issue: 'zombie'
                    });
                } else {
                    results.push({
                        resourceName: `Sentry ${data.plan ? data.plan.charAt(0).toUpperCase() + data.plan.slice(1) : 'Developer'}`,
                        resourceType: 'project',
                        status: 'active',
                        potentialSavings: 0,
                        currency: 'INR',
                        reason: `Active: ${data.eventCount || 0} events this month`,
                        rawData: { eventCount: data.eventCount || 0, plan: data.plan || 'developer' },
                        issue: 'none'
                    });
                }
                break;

            case 'aws':
                // AWS is pay-as-you-go, so zero usage = zero cost (mostly)
                // Only flag if there are forgotten resources
                if (data.activeRegions && data.activeRegions.length === 0) {
                    // This would need actual billing data to be accurate
                    // For now, skip unless we can confirm actual charges
                    // results.push({...}); // Commented out - needs real billing data
                    results.push({
                        resourceName: 'AWS Account',
                        resourceType: 'account',
                        status: 'active',
                        potentialSavings: 0,
                        currency: 'INR',
                        reason: 'No obvious waste detected (Mock)',
                        rawData: { activeRegions: [] },
                        issue: 'none'
                    });
                } else {
                    results.push({
                        resourceName: 'AWS Account',
                        resourceType: 'account',
                        status: 'active',
                        potentialSavings: 0,
                        currency: 'INR',
                        reason: 'Active usage detected',
                        rawData: { activeRegions: data.activeRegions || [] },
                        issue: 'none'
                    });
                }
                break;

            case 'linear':
                // Only flag if on paid plan with minimal usage
                if (data.plan && data.plan !== 'free' && data.issuesTouched !== undefined && data.issuesTouched < 5) {
                    const planCost = PLAN_COSTS.linear[data.plan as keyof typeof PLAN_COSTS.linear] || 8;
                    results.push({
                        resourceName: `Linear ${data.plan.charAt(0).toUpperCase() + data.plan.slice(1)}`,
                        resourceType: 'account',
                        status: 'zombie',
                        potentialSavings: planCost * USD_TO_INR,
                        currency: 'INR',
                        reason: `Only ${data.issuesTouched} issues touched this month`,
                        rawData: { issuesTouched: data.issuesTouched, plan: data.plan },
                        issue: 'zombie'
                    });
                } else {
                    results.push({
                        resourceName: `Linear ${data.plan ? data.plan.charAt(0).toUpperCase() + data.plan.slice(1) : 'Free'}`,
                        resourceType: 'account',
                        status: 'active',
                        potentialSavings: 0,
                        currency: 'INR',
                        reason: `Active: ${data.issuesTouched || 0} issues touched`,
                        rawData: { issuesTouched: data.issuesTouched || 0, plan: data.plan || 'free' },
                        issue: 'none'
                    });
                }
                break;
        }

        // Save results to DB with AI-generated recommendations
        // CRITICAL: Only save if there are actual findings
        for (const result of results) {
            let smartRecommendation = '';
            let usesFallback = false;

            // Only generate AI recommendations for actual issues (not active/healthy resources)
            if (result.status !== 'active' && result.potentialSavings > 0) {
                try {
                    // Generate AI recommendation
                    smartRecommendation = await getSmartRecommendation({
                        serviceName: result.resourceName,
                        rawDataObject: result.rawData,
                        monthlyCostInINR: result.potentialSavings,
                        issue: result.issue
                    });
                } catch (error) {
                    console.error(`Gemini failed for ${result.resourceName}:`, error);
                    // Fallback to reason field
                    smartRecommendation = result.reason;
                    usesFallback = true;
                }
            } else {
                // For active/healthy resources, just use the reason
                smartRecommendation = result.reason;
                usesFallback = true;
            }

            await ScanResult.create({
                userId,
                connectionId,
                resourceName: result.resourceName,
                resourceType: result.resourceType,
                status: result.status,
                potentialSavings: result.potentialSavings,
                currency: result.currency,
                reason: result.reason,
                smartRecommendation,
                usesFallback
            });
        }

        return results;
    }
}
