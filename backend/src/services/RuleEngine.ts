import { ScanResult } from '../models/ScanResult';
import { getSmartRecommendation } from '../utils/gemini';
import { User } from '../models/User';
import { BillingSummary } from '../models/BillingSummary';
import { AnalyticsService } from './AnalyticsService';
import { ReferralService } from './ReferralService';

interface UsageData {
    // Plan information (CRITICAL: Never assume paid plan)
    plan?: string; // e.g., "free", "hobby", "pro", "team", "enterprise"

    // GitHub
    lastCommitDate?: Date;
    hasPrivateRepos?: boolean;
    repos?: any[];

    // OpenAI
    totalTokens?: number;
    usageByModel?: Record<string, number>;
    usageHistory?: any[];

    // Vercel
    bandwidthUsage?: number;
    bandwidthLimit?: number;
    projects?: any[];

    // AWS
    functionInvocations?: number;
    activeRegions?: string[];

    // Sentry
    eventCount?: number;
    planLimit?: number;

    // Linear
    issuesTouched?: number;
    userCount?: number;
    teamCount?: number;
    orgName?: string;

    // Resend
    emailsSent?: number;
    domainCount?: number;
    apiKeyCount?: number;
    domains?: string[];

    // Clerk
    orgCount?: number;

    // Stripe
    accountId?: string;
    businessName?: string;
    chargesVolume?: number;
    subscriptionCount?: number | string;
    country?: string;
    recentCharges?: any[];

    // Generic
    activeUsers?: number;

    // AWS Deep Scan (supports both legacy and new AWSScanner format)
    ec2Instances?: any[];
    elasticIPs?: any[];
    ebsVolumes?: any[];
    rdsInstances?: any[];
    dynamoDBTables?: any[];
    lambdaFunctions?: any[] | number;  // Array from AWSScanner or number from legacy
    s3Buckets?: any[] | number;         // Array from AWSScanner or number from legacy
    region?: string;
    costHistory?: any[]; // For AWS Cost Explorer data
    scanError?: string;

    // DigitalOcean
    droplets?: any[];
    monthToDateUsage?: number;
    accountBalance?: number;

    // Supabase
    projectCount?: number;

    // Notion
    botUser?: any;
    memberCount?: number;
    databaseCount?: number;
}

// USD to INR conversion (rough estimate)
const USD_TO_INR = 85;

// Plan pricing (monthly, in USD)
const PLAN_COSTS: Record<string, Record<string, number>> = {
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
    },
    clerk: {
        free: 0,
        hobby: 25,
        pro: 99,
        enterprise: 0 // Contact sales
    },
    resend: {
        free: 0,
        pro: 20,
        enterprise: 0 // Contact sales
    },
    stripe: {
        standard: 0, // Pay per transaction
        starter: 0,
        custom: 0
    },
    digitalocean: {
        'usage-based': 0
    },
    supabase: {
        free: 0,
        pro: 25
    },
    notion: {
        free: 0,
        plus: 10,
        business: 18,
        team: 10 // Legacy name or internal simplification
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
                            rawData: { daysSinceCommit, lastCommitDate: data.lastCommitDate, plan: data.plan, repos: data.repos },
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
                            rawData: { daysSinceCommit, lastCommitDate: data.lastCommitDate, plan: data.plan, repos: data.repos },
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
                        rawData: { plan: data.plan || 'free', repos: data.repos },
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
                // ===== EC2 INSTANCES =====
                if (data.ec2Instances && data.ec2Instances.length > 0) {
                    // Stopped instances
                    const stoppedInstances = data.ec2Instances.filter((i: any) => i.state === 'stopped');
                    if (stoppedInstances.length > 0) {
                        results.push({
                            resourceName: `${stoppedInstances.length} Stopped EC2 Instances`,
                            resourceType: 'compute',
                            status: 'zombie',
                            potentialSavings: stoppedInstances.length * 5.5 * USD_TO_INR,
                            currency: 'INR',
                            reason: `${stoppedInstances.length} EC2 instances are stopped but still incurring EBS storage costs`,
                            rawData: { count: stoppedInstances.length, instances: stoppedInstances },
                            issue: 'zombie'
                        });
                    }

                    // Large/expensive running instances
                    const expensiveInstances = data.ec2Instances.filter((i: any) =>
                        i.state === 'running' && (i.type.includes('large') || i.type.includes('xlarge'))
                    );
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

                    // HEALTHY: Optimized Running Instances
                    const healthyInstances = data.ec2Instances.filter((i: any) =>
                        i.state === 'running' && !i.type.includes('large') && !i.type.includes('xlarge')
                    );
                    if (healthyInstances.length > 0) {
                        results.push({
                            resourceName: `${healthyInstances.length} Optimized EC2 Instances`,
                            resourceType: 'compute',
                            status: 'active',
                            potentialSavings: 0,
                            currency: 'INR',
                            reason: `${healthyInstances.length} instances are running efficiently`,
                            rawData: { count: healthyInstances.length, instances: healthyInstances },
                            issue: 'none'
                        });
                    }
                }

                // ===== ELASTIC IPs =====
                if (data.elasticIPs && data.elasticIPs.length > 0) {
                    const unattachedIPs = data.elasticIPs.filter((ip: any) => !ip.isAttached);
                    if (unattachedIPs.length > 0) {
                        results.push({
                            resourceName: `${unattachedIPs.length} Unattached Elastic IPs`,
                            resourceType: 'networking',
                            status: 'zombie',
                            potentialSavings: unattachedIPs.length * 3.6 * USD_TO_INR,
                            currency: 'INR',
                            reason: `${unattachedIPs.length} Elastic IPs are not attached to instances. You're charged for unattached IPs!`,
                            rawData: { count: unattachedIPs.length, ips: unattachedIPs },
                            issue: 'zombie'
                        });
                    }

                    // HEALTHY: Attached IPs
                    const attachedIPs = data.elasticIPs.filter((ip: any) => ip.isAttached);
                    if (attachedIPs.length > 0) {
                        results.push({
                            resourceName: `${attachedIPs.length} Active Elastic IPs`,
                            resourceType: 'networking',
                            status: 'active',
                            potentialSavings: 0,
                            currency: 'INR',
                            reason: `${attachedIPs.length} Elastic IPs are correctly attached and in use`,
                            rawData: { count: attachedIPs.length, ips: attachedIPs },
                            issue: 'none'
                        });
                    }
                }

                // ===== EBS VOLUMES =====
                if (data.ebsVolumes && data.ebsVolumes.length > 0) {
                    const unattachedVolumes = data.ebsVolumes.filter((vol: any) => !vol.isAttached);
                    if (unattachedVolumes.length > 0) {
                        const totalSize = unattachedVolumes.reduce((sum: number, vol: any) => sum + vol.size, 0);
                        results.push({
                            resourceName: `${unattachedVolumes.length} Unattached EBS Volumes`,
                            resourceType: 'storage',
                            status: 'zombie',
                            potentialSavings: (totalSize * 0.10) * USD_TO_INR,
                            currency: 'INR',
                            reason: `${unattachedVolumes.length} EBS volumes (${totalSize}GB total) are not attached to any instance`,
                            rawData: { count: unattachedVolumes.length, totalSizeGB: totalSize, volumes: unattachedVolumes },
                            issue: 'zombie'
                        });
                    }

                    // HEALTHY: Attached Volumes
                    const attachedVolumes = data.ebsVolumes.filter((vol: any) => vol.isAttached);
                    if (attachedVolumes.length > 0) {
                        const totalSize = attachedVolumes.reduce((sum: number, vol: any) => sum + vol.size, 0);
                        results.push({
                            resourceName: `${attachedVolumes.length} Active EBS Volumes`,
                            resourceType: 'storage',
                            status: 'active',
                            potentialSavings: 0,
                            currency: 'INR',
                            reason: `${attachedVolumes.length} volumes (${totalSize}GB) are attached and in use`,
                            rawData: { count: attachedVolumes.length, totalSizeGB: totalSize, volumes: attachedVolumes },
                            issue: 'none'
                        });
                    }
                }

                // ===== LAMBDA FUNCTIONS =====
                const lambdaCount = Array.isArray(data.lambdaFunctions) ? data.lambdaFunctions.length : data.lambdaFunctions;
                if (Array.isArray(data.lambdaFunctions) && data.lambdaFunctions.length > 0) {
                    // Check for old/unused Lambda functions (not modified in 6+ months)
                    const sixMonthsAgo = new Date();
                    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

                    const oldFunctions = data.lambdaFunctions.filter((func: any) => {
                        const lastModified = new Date(func.lastModified);
                        return lastModified < sixMonthsAgo;
                    });

                    if (oldFunctions.length > 0) {
                        results.push({
                            resourceName: `${oldFunctions.length} Old Lambda Functions`,
                            resourceType: 'compute',
                            status: 'zombie',
                            potentialSavings: oldFunctions.length * 2 * USD_TO_INR,
                            currency: 'INR',
                            reason: `${oldFunctions.length} Lambda functions haven't been modified in 6+ months`,
                            rawData: { count: oldFunctions.length, functions: oldFunctions },
                            issue: 'zombie'
                        });
                    }

                    // HEALTHY: Active Functions
                    const activeFunctions = data.lambdaFunctions.filter((func: any) => {
                        const lastModified = new Date(func.lastModified);
                        return lastModified >= sixMonthsAgo;
                    });

                    if (activeFunctions.length > 0) {
                        results.push({
                            resourceName: `${activeFunctions.length} Active Lambda Functions`,
                            resourceType: 'compute',
                            status: 'active',
                            potentialSavings: 0,
                            currency: 'INR',
                            reason: `${activeFunctions.length} functions are actively maintained`,
                            rawData: { count: activeFunctions.length, functions: activeFunctions },
                            issue: 'none'
                        });
                    }
                } else if (lambdaCount && lambdaCount > 0) {
                    // Legacy number format
                    results.push({
                        resourceName: `${lambdaCount} Lambda Functions`,
                        resourceType: 'compute',
                        status: 'active',
                        potentialSavings: 0,
                        currency: 'INR',
                        reason: `Active Serverless Architecture (${lambdaCount} functions)`,
                        rawData: { count: lambdaCount },
                        issue: 'none'
                    });
                }

                // ===== DYNAMODB TABLES =====
                if (data.dynamoDBTables && data.dynamoDBTables.length > 0) {
                    const overprovisionedTables = data.dynamoDBTables.filter((table: any) =>
                        table.billingMode === 'PROVISIONED' && table.itemCount < 1000
                    );

                    if (overprovisionedTables.length > 0) {
                        results.push({
                            resourceName: `${overprovisionedTables.length} Overprovisioned DynamoDB Tables`,
                            resourceType: 'database',
                            status: 'downgrade_possible',
                            potentialSavings: overprovisionedTables.length * 10 * USD_TO_INR,
                            currency: 'INR',
                            reason: `${overprovisionedTables.length} DynamoDB tables use PROVISIONED billing with low item counts. Switch to ON_DEMAND!`,
                            rawData: { count: overprovisionedTables.length, tables: overprovisionedTables },
                            issue: 'overprovisioned'
                        });
                    }

                    // HEALTHY: Optimized Tables
                    const optimizedTables = data.dynamoDBTables.filter((table: any) =>
                        !(table.billingMode === 'PROVISIONED' && table.itemCount < 1000)
                    );

                    if (optimizedTables.length > 0) {
                        results.push({
                            resourceName: `${optimizedTables.length} Optimized DynamoDB Tables`,
                            resourceType: 'database',
                            status: 'active',
                            potentialSavings: 0,
                            currency: 'INR',
                            reason: `${optimizedTables.length} tables are using efficient billing modes`,
                            rawData: { count: optimizedTables.length, tables: optimizedTables },
                            issue: 'none'
                        });
                    }
                }

                // ===== S3 BUCKETS =====
                const s3Count = Array.isArray(data.s3Buckets) ? data.s3Buckets.length : data.s3Buckets;
                // ===== S3 BUCKETS =====

                if (Array.isArray(data.s3Buckets) && data.s3Buckets.length > 0) {
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                    const unusedBuckets = data.s3Buckets.filter((bucket: any) => {
                        if (!bucket.lastModified) return true; // Empty or no objects = Unused
                        return new Date(bucket.lastModified) < thirtyDaysAgo;
                    });

                    if (unusedBuckets.length > 0) {
                        results.push({
                            resourceName: `${unusedBuckets.length} Unused S3 Buckets`,
                            resourceType: 'storage',
                            status: 'zombie',
                            potentialSavings: unusedBuckets.length * 0.5 * USD_TO_INR, // Approx cost
                            currency: 'INR',
                            reason: `${unusedBuckets.length} buckets have no recent activity (>30 days)`,
                            rawData: { count: unusedBuckets.length, buckets: unusedBuckets },
                            issue: 'zombie',
                            pricingStatus: 'coming_soon'
                        });
                    }

                    const activeBuckets = data.s3Buckets.filter((bucket: any) => {
                        return bucket.lastModified && new Date(bucket.lastModified) >= thirtyDaysAgo;
                    });

                    if (activeBuckets.length > 0) {
                        results.push({
                            resourceName: `${activeBuckets.length} Active S3 Buckets`,
                            resourceType: 'storage',
                            status: 'active',
                            potentialSavings: 0,
                            currency: 'INR',
                            reason: `${activeBuckets.length} buckets are actively used`,
                            rawData: { count: activeBuckets.length, buckets: activeBuckets },
                            issue: 'none',
                            pricingStatus: 'coming_soon'
                        });
                    }
                } else if (s3Count && s3Count > 0) {
                    results.push({
                        resourceName: `${s3Count} S3 Buckets`,
                        resourceType: 'storage',
                        status: 'active',
                        potentialSavings: 0,
                        currency: 'INR',
                        reason: `${s3Count} S3 buckets active`,
                        rawData: { count: s3Count },
                        issue: 'none',
                        pricingStatus: 'coming_soon'
                    });
                }

                // ===== RDS INSTANCES =====
                if (data.rdsInstances && data.rdsInstances.length > 0) {
                    // Stopped RDS
                    const stoppedRDS = data.rdsInstances.filter((db: any) => db.status === 'stopped');
                    if (stoppedRDS.length > 0) {
                        results.push({
                            resourceName: `${stoppedRDS.length} Stopped RDS Instances`,
                            resourceType: 'database',
                            status: 'zombie',
                            potentialSavings: stoppedRDS.length * 15 * USD_TO_INR,
                            currency: 'INR',
                            reason: `${stoppedRDS.length} RDS instances are stopped but still incurring storage costs`,
                            rawData: { count: stoppedRDS.length, instances: stoppedRDS },
                            issue: 'zombie'
                        });
                    }

                    // Multi-AZ RDS
                    const multiAZInstances = data.rdsInstances.filter((db: any) =>
                        db.multiAZ && db.status === 'available'
                    );
                    if (multiAZInstances.length > 0) {
                        results.push({
                            resourceName: `${multiAZInstances.length} Multi-AZ RDS Instances`,
                            resourceType: 'database',
                            status: 'downgrade_possible',
                            potentialSavings: multiAZInstances.length * 30 * USD_TO_INR,
                            currency: 'INR',
                            reason: `${multiAZInstances.length} RDS instances use Multi-AZ (2x cost). Disable if not needed for HA.`,
                            rawData: { count: multiAZInstances.length, instances: multiAZInstances },
                            issue: 'overprovisioned'
                        });
                    }

                    // HEALTHY: Optimized RDS
                    const optimizedRDS = data.rdsInstances.filter((db: any) =>
                        db.status === 'available' && !db.multiAZ
                    );
                    if (optimizedRDS.length > 0) {
                        results.push({
                            resourceName: `${optimizedRDS.length} Optimized RDS Instances`,
                            resourceType: 'database',
                            status: 'active',
                            potentialSavings: 0,
                            currency: 'INR',
                            reason: `${optimizedRDS.length} RDS instances are running efficiently (Single-AZ)`,
                            rawData: { count: optimizedRDS.length, instances: optimizedRDS },
                            issue: 'none'
                        });
                    }
                }

                // Fallback
                if (!data.ec2Instances && !data.elasticIPs && !data.ebsVolumes &&
                    !lambdaCount && !data.dynamoDBTables && !s3Count && !data.rdsInstances) {
                    results.push({
                        resourceName: 'AWS Account',
                        resourceType: 'account',
                        status: 'active',
                        potentialSavings: 0,
                        currency: 'INR',
                        reason: 'No resources detected in scan',
                        rawData: { activeRegions: data.activeRegions || [], region: data.region },
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

            case 'openai':
                const usage = (data.usageByModel || {}) as Record<string, number>;
                let totalCost = 0;
                const pricing: Record<string, number> = {
                    'gpt-4o': 10,
                    'gpt-4o-mini': 0.3,
                    'gpt-4-turbo': 20,
                    'gpt-4': 45,
                    'gpt-3.5-turbo': 1
                };

                Object.entries(usage).forEach(([model, tokens]) => {
                    const costPer1M = pricing[model] || pricing['gpt-4o'];
                    const cost = (tokens / 1_000_000) * costPer1M;
                    totalCost += cost;

                    if ((model.includes('gpt-4') && !model.includes('4o')) && tokens > 100_000) {
                        results.push({
                            resourceName: model,
                            resourceType: 'OpenAI Model Usage',
                            status: 'downgrade_possible',
                            potentialSavings: Math.round(cost * 0.7 * USD_TO_INR),
                            currency: 'INR',
                            reason: `High usage of expensive model: ${model}`,
                            smartRecommendation: `Switch to gpt-4o-mini or gpt-4o. It's significantly cheaper for most tasks.`,
                            rawData: { tokens, model },
                            issue: 'high_cost_model'
                        });
                    }
                });

                if (results.length === 0) {
                    results.push({
                        resourceName: 'OpenAI API Usage',
                        resourceType: 'Account',
                        status: 'active',
                        potentialSavings: 0,
                        currency: 'INR',
                        reason: 'Usage within normal bounds.',
                        rawData: { totalTokens: data.totalTokens },
                        issue: 'none'
                    });
                }
                break;

            case 'digitalocean':
                const droplets = data.droplets || [];
                const monthToDateUsage = data.monthToDateUsage || 0;

                if (droplets.length === 0) {
                    results.push({
                        resourceName: 'DigitalOcean Account',
                        resourceType: 'account',
                        status: 'zombie',
                        potentialSavings: Math.round(monthToDateUsage * USD_TO_INR),
                        currency: 'INR',
                        reason: 'No active droplets found. Review if account is needed.',
                        rawData: { monthToDateUsage },
                        issue: 'no_resources'
                    });
                } else {
                    // Check for stopped droplets
                    const stoppedDroplets = droplets.filter((d: any) => d.status === 'off');
                    for (const droplet of stoppedDroplets) {
                        results.push({
                            resourceName: droplet.name || `Droplet ${droplet.id}`,
                            resourceType: 'droplet',
                            status: 'zombie',
                            potentialSavings: Math.round(5 * USD_TO_INR), // Estimate $5/month for small droplet
                            currency: 'INR',
                            reason: 'Droplet is powered off but still incurring storage costs.',
                            rawData: droplet,
                            issue: 'stopped_instance'
                        });
                    }

                    if (stoppedDroplets.length === 0) {
                        results.push({
                            resourceName: `DigitalOcean (${droplets.length} droplets)`,
                            resourceType: 'account',
                            status: 'active',
                            potentialSavings: 0,
                            currency: 'INR',
                            reason: 'All droplets are running.',
                            rawData: { dropletCount: droplets.length, monthToDateUsage },
                            issue: 'none'
                        });
                    }
                }
                break;

            case 'supabase':
                const projects = data.projects || [];
                const projectCount = projects.length;

                if (projectCount === 0) {
                    results.push({
                        resourceName: 'Supabase Account',
                        resourceType: 'account',
                        status: 'zombie',
                        potentialSavings: Math.round(25 * USD_TO_INR), // Pro plan cost
                        currency: 'INR',
                        reason: 'No active projects found.',
                        rawData: {},
                        issue: 'no_resources'
                    });
                } else {
                    // Check for paused projects
                    const pausedProjects = projects.filter((p: any) => p.status === 'INACTIVE_PAUSED');
                    for (const proj of pausedProjects) {
                        results.push({
                            resourceName: proj.name || `Project ${proj.id}`,
                            resourceType: 'project',
                            status: 'zombie',
                            potentialSavings: Math.round(25 * USD_TO_INR),
                            currency: 'INR',
                            reason: 'Project is paused. Consider deleting if unused.',
                            rawData: proj,
                            issue: 'paused_project'
                        });
                    }

                    if (pausedProjects.length === 0) {
                        results.push({
                            resourceName: `Supabase (${projectCount} projects)`,
                            resourceType: 'account',
                            status: 'active',
                            potentialSavings: 0,
                            currency: 'INR',
                            reason: 'All projects are active.',
                            rawData: { projectCount },
                            issue: 'none'
                        });
                    }
                }
                break;

            case 'notion':
                const memberCount = data.memberCount || 1;
                const databaseCount = data.databaseCount || 0;

                // Notion billing is per member
                if (memberCount > 10 && databaseCount < 5) {
                    results.push({
                        resourceName: 'Notion Workspace',
                        resourceType: 'workspace',
                        status: 'downgrade_possible',
                        potentialSavings: Math.round((memberCount - 5) * 10 * USD_TO_INR), // $10/member on Team plan
                        currency: 'INR',
                        reason: `${memberCount} members but only ${databaseCount} databases. Consider reviewing member access.`,
                        rawData: { memberCount, databaseCount },
                        issue: 'overprovisioned'
                    });
                } else {
                    results.push({
                        resourceName: `Notion (${memberCount} members)`,
                        resourceType: 'workspace',
                        status: 'active',
                        potentialSavings: 0,
                        currency: 'INR',
                        reason: 'Usage appears appropriate for member count.',
                        rawData: { memberCount, databaseCount },
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
                isEstimated: true, // Currently all costs are based on heuristics/public prices
                rawData: result.rawData
            });
        }

        // --- NEW: Save Monthly Spend to BillingSummary (Dynamic for all providers) ---
        const currentPeriod = new Date().toISOString().substring(0, 7); // "YYYY-MM"
        let currentTotalCost = 0;
        let costBreakdown: any = {};

        if (provider === 'openai') {
            // Calculate OpenAI cost from usage data
            const usage = (data.usageByModel || {}) as Record<string, number>;
            const pricing: Record<string, number> = {
                'gpt-4o': 10, 'gpt-4o-mini': 0.3, 'gpt-4-turbo': 20, 'gpt-4': 45, 'gpt-3.5-turbo': 1
            };
            Object.entries(usage).forEach(([model, tokens]) => {
                const costPer1M = pricing[model] || pricing['gpt-4o'];
                const cost = (tokens / 1_000_000) * costPer1M;
                currentTotalCost += cost;
                costBreakdown[model] = cost;
            });
        } else if (provider === 'aws' && data.costHistory && data.costHistory.length > 0) {
            // AWS already handles historical data below, so we'll skip the current month logic here
            // to avoid double updates, but we'll fulfill the historical sync.
        } else if (provider === 'digitalocean') {
            // Usage-based billing from DigitalOcean balance API
            currentTotalCost = data.monthToDateUsage || 0;
            costBreakdown['usage'] = currentTotalCost;
        } else if (PLAN_COSTS[provider] && data.plan) {
            // Plan-based costs (GitHub, Vercel, Linear, Supabase, Notion, etc.)
            let cost = PLAN_COSTS[provider][data.plan] || 0;

            // Handle per-user pricing where applicable
            if (['github', 'linear', 'notion'].includes(provider) && (data.userCount || data.memberCount || 0) > 1) {
                const count = data.userCount || data.memberCount || 1;
                cost = cost * count;
            }

            currentTotalCost = cost;
            costBreakdown[data.plan] = cost;
        }

        // Save current month spend for non-AWS (AWS has its own more complex logic below)
        if (provider !== 'aws' && currentTotalCost >= 0) {
            try {
                await BillingSummary.findOneAndUpdate(
                    { connectionId, billingPeriod: currentPeriod },
                    {
                        userId,
                        provider,
                        billingPeriod: currentPeriod,
                        totalCost: currentTotalCost,
                        currency: 'USD',
                        breakdown: costBreakdown,
                        fetchedAt: new Date()
                    },
                    { upsert: true, new: true }
                );
            } catch (err) {
                console.error(`Error saving BillingSummary for ${provider}:`, err);
            }
        }

        // --- AWS Historical Billing Logic ---
        if (provider === 'aws' && data.costHistory && data.costHistory.length > 0) {
            console.log(`📊 Saving ${data.costHistory.length} AWS billing periods to database...`);
            for (const monthData of data.costHistory) {
                const period = monthData.TimePeriod?.Start?.substring(0, 7); // "YYYY-MM"
                if (!period) continue;

                let total = 0;
                const breakdown: any = {};

                for (const group of monthData.Groups || []) {
                    const serviceName = group.Keys?.[0] || 'Unknown';
                    const amount = parseFloat(group.Metrics?.UnblendedCost?.Amount || '0');
                    total += amount;
                    breakdown[serviceName] = amount;
                }

                try {
                    await BillingSummary.findOneAndUpdate(
                        { connectionId, billingPeriod: period },
                        {
                            userId, provider,
                            billingPeriod: period,
                            totalCost: total,
                            currency: 'USD',
                            breakdown,
                            fetchedAt: new Date()
                        },
                        { upsert: true, new: true }
                    );
                } catch (err) {
                    console.error('Error saving AWS billing summary:', err);
                }
            }
        }

        // Snapshot savings for historical tracking
        await AnalyticsService.snapshotUserSavings(userId);

        // Check if user qualifies for referral reward
        await ReferralService.checkAndApplyReward(userId);

        // Update community stats periodically (every 10th scan)
        const scanCount = await ScanResult.countDocuments({ userId });
        if (scanCount % 10 === 0) {
            await AnalyticsService.updateCommunityStats();
        }

        return results;
    }
}
