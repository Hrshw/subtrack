import { ScanResult } from '../models/ScanResult';
import { getSmartRecommendation } from '../utils/gemini';
import { User } from '../models/User';

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

    // AWS Deep Scan
    ec2Instances?: any[];
    rdsInstances?: any[];
    lambdaFunctions?: number;
    s3Buckets?: number;
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
    static async analyze(userId: string, connectionId: string, provider: string, data: UsageData, userTierArg?: 'free' | 'pro') {
        let userTier = userTierArg;
        if (!userTier) {
            try {
                const user = await User.findById(userId);
                userTier = (user?.subscriptionStatus as 'free' | 'pro') || 'free';
            } catch (e) {
                console.error("Error fetching user tier", e);
                userTier = 'free';
            }
        }
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
                // AWS Deep Scan Logic
                // Check for stopped EC2 instances (Zombie)
                if (data.ec2Instances && data.ec2Instances.length > 0) {
                    const stoppedInstances = data.ec2Instances.filter((i: any) => i.state === 'stopped');
                    if (stoppedInstances.length > 0) {
                        results.push({
                            resourceName: `${stoppedInstances.length} Stopped EC2 Instances`,
                            resourceType: 'compute',
                            status: 'zombie',
                            potentialSavings: stoppedInstances.length * 8 * USD_TO_INR, // EBS storage costs
                            currency: 'INR',
                            reason: `${stoppedInstances.length} instances are stopped but incurring EBS storage costs`,
                            rawData: { count: stoppedInstances.length, instances: stoppedInstances },
                            issue: 'zombie'
                        });
                    }

                    // Check for expensive running instances
                    const expensiveInstances = data.ec2Instances.filter((i: any) => i.state === 'running' && (i.type.includes('large') || i.type.includes('xlarge')));
                    if (expensiveInstances.length > 0) {
                        results.push({
                            resourceName: `${expensiveInstances.length} Large EC2 Instances`,
                            resourceType: 'compute',
                            status: 'downgrade_possible',
                            potentialSavings: expensiveInstances.length * 40 * USD_TO_INR,
                            currency: 'INR',
                            reason: `High cost instance types detected: ${expensiveInstances.map((i: any) => i.type).join(', ')}. Consider rightsizing.`,
                            rawData: { count: expensiveInstances.length, instances: expensiveInstances },
                            issue: 'overprovisioned'
                        });
                    }
                }

                // Lambda
                if (data.lambdaFunctions && data.lambdaFunctions > 0) {
                    results.push({
                        resourceName: `${data.lambdaFunctions} Lambda Functions`,
                        resourceType: 'compute',
                        status: 'active',
                        potentialSavings: 0,
                        currency: 'INR',
                        reason: `Active Serverless Architecture (${data.lambdaFunctions} functions)`,
                        rawData: { count: data.lambdaFunctions },
                        issue: 'none'
                    });
                }

                // S3 Buckets
                if (data.s3Buckets && data.s3Buckets > 0) {
                    results.push({
                        resourceName: `${data.s3Buckets} S3 Buckets`,
                        resourceType: 'storage',
                        status: 'active',
                        potentialSavings: 0,
                        currency: 'INR',
                        reason: `Storage active in ${data.s3Buckets} buckets`,
                        rawData: { count: data.s3Buckets },
                        issue: 'none'
                    });
                }

                if (!data.ec2Instances && !data.lambdaFunctions && !data.s3Buckets) {
                    results.push({
                        resourceName: 'AWS Account',
                        resourceType: 'account',
                        status: 'active',
                        potentialSavings: 0,
                        currency: 'INR',
                        reason: 'No resources detected in scan',
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

            case 'resend':
                results.push({
                    resourceName: `Resend ${data.plan ? data.plan.charAt(0).toUpperCase() + data.plan.slice(1) : 'Free'}`,
                    resourceType: 'account',
                    status: 'active',
                    potentialSavings: 0,
                    currency: 'INR',
                    reason: 'Active usage',
                    rawData: { plan: data.plan || 'free' },
                    issue: 'none'
                });
                break;

            case 'clerk':
                results.push({
                    resourceName: `Clerk ${data.plan ? data.plan.charAt(0).toUpperCase() + data.plan.slice(1) : 'Free'}`,
                    resourceType: 'account',
                    status: 'active',
                    potentialSavings: 0,
                    currency: 'INR',
                    reason: 'Active usage',
                    rawData: { plan: data.plan || 'free' },
                    issue: 'none'
                });
                break;

            case 'stripe':
                results.push({
                    resourceName: `Stripe ${data.plan ? data.plan.charAt(0).toUpperCase() + data.plan.slice(1) : 'Standard'}`,
                    resourceType: 'account',
                    status: 'active',
                    potentialSavings: 0,
                    currency: 'INR',
                    reason: 'Active usage',
                    rawData: { plan: data.plan || 'standard' },
                    issue: 'none'
                });
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
                    const style = userTier === 'pro' ? 'savage' : 'basic';
                    smartRecommendation = await getSmartRecommendation({
                        serviceName: result.resourceName,
                        rawDataObject: result.rawData,
                        monthlyCostInINR: result.potentialSavings,
                        issue: result.issue
                    }, style);
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
                usesFallback,
                rawData: result.rawData
            });
        }

        return results;
    }
}
