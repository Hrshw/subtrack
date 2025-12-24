"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuleEngine = void 0;
const ScanResult_1 = require("../models/ScanResult");
const gemini_1 = require("../utils/gemini");
const User_1 = require("../models/User");
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
    }
};
class RuleEngine {
    static analyze(userId, connectionId, provider, data, userTierArg) {
        return __awaiter(this, void 0, void 0, function* () {
            let userTier = userTierArg;
            if (!userTier) {
                try {
                    const user = yield User_1.User.findById(userId);
                    userTier = (user === null || user === void 0 ? void 0 : user.subscriptionStatus) || 'free';
                }
                catch (e) {
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
                            const planCost = PLAN_COSTS.github[data.plan] || 4;
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
                        }
                        else {
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
                    }
                    else {
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
                            const planCost = PLAN_COSTS.vercel[data.plan] || 20;
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
                        }
                        else {
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
                    }
                    else {
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
                        const planCost = PLAN_COSTS.sentry[data.plan] || 29;
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
                    }
                    else {
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
                        const stoppedInstances = data.ec2Instances.filter((i) => i.state === 'stopped');
                        if (stoppedInstances.length > 0) {
                            results.push({
                                resourceName: `${stoppedInstances.length} Stopped EC2 Instances`,
                                resourceType: 'compute',
                                status: 'zombie',
                                potentialSavings: stoppedInstances.length * 8 * USD_TO_INR,
                                currency: 'INR',
                                reason: `${stoppedInstances.length} EC2 instances are stopped but still incurring EBS storage costs`,
                                rawData: { count: stoppedInstances.length, instances: stoppedInstances },
                                issue: 'zombie'
                            });
                        }
                        // Large/expensive running instances
                        const expensiveInstances = data.ec2Instances.filter((i) => i.state === 'running' && (i.type.includes('large') || i.type.includes('xlarge')));
                        if (expensiveInstances.length > 0) {
                            results.push({
                                resourceName: `${expensiveInstances.length} Large EC2 Instances`,
                                resourceType: 'compute',
                                status: 'downgrade_possible',
                                potentialSavings: expensiveInstances.length * 40 * USD_TO_INR,
                                currency: 'INR',
                                reason: `High cost instance types detected: ${expensiveInstances.map((i) => i.type).join(', ')}. Consider rightsizing.`,
                                rawData: { count: expensiveInstances.length, instances: expensiveInstances },
                                issue: 'overprovisioned'
                            });
                        }
                        // HEALTHY: Optimized Running Instances
                        const healthyInstances = data.ec2Instances.filter((i) => i.state === 'running' && !i.type.includes('large') && !i.type.includes('xlarge'));
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
                        const unattachedIPs = data.elasticIPs.filter((ip) => !ip.isAttached);
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
                        const attachedIPs = data.elasticIPs.filter((ip) => ip.isAttached);
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
                        const unattachedVolumes = data.ebsVolumes.filter((vol) => !vol.isAttached);
                        if (unattachedVolumes.length > 0) {
                            const totalSize = unattachedVolumes.reduce((sum, vol) => sum + vol.size, 0);
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
                        const attachedVolumes = data.ebsVolumes.filter((vol) => vol.isAttached);
                        if (attachedVolumes.length > 0) {
                            const totalSize = attachedVolumes.reduce((sum, vol) => sum + vol.size, 0);
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
                        const oldFunctions = data.lambdaFunctions.filter((func) => {
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
                        const activeFunctions = data.lambdaFunctions.filter((func) => {
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
                    }
                    else if (lambdaCount && lambdaCount > 0) {
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
                        const overprovisionedTables = data.dynamoDBTables.filter((table) => table.billingMode === 'PROVISIONED' && table.itemCount < 1000);
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
                        const optimizedTables = data.dynamoDBTables.filter((table) => !(table.billingMode === 'PROVISIONED' && table.itemCount < 1000));
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
                        const unusedBuckets = data.s3Buckets.filter((bucket) => {
                            if (!bucket.lastModified)
                                return true; // Empty or no objects = Unused
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
                        const activeBuckets = data.s3Buckets.filter((bucket) => {
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
                    }
                    else if (s3Count && s3Count > 0) {
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
                        const stoppedRDS = data.rdsInstances.filter((db) => db.status === 'stopped');
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
                        const multiAZInstances = data.rdsInstances.filter((db) => db.multiAZ && db.status === 'available');
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
                        const optimizedRDS = data.rdsInstances.filter((db) => db.status === 'available' && !db.multiAZ);
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
                        const planCost = PLAN_COSTS.linear[data.plan] || 8;
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
                    }
                    else {
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
                        smartRecommendation = yield (0, gemini_1.getSmartRecommendation)({
                            serviceName: result.resourceName,
                            rawDataObject: result.rawData,
                            monthlyCostInINR: result.potentialSavings,
                            issue: result.issue
                        }, style);
                    }
                    catch (error) {
                        console.error(`Gemini failed for ${result.resourceName}:`, error);
                        // Fallback to reason field
                        smartRecommendation = result.reason;
                        usesFallback = true;
                    }
                }
                else {
                    // For active/healthy resources, just use the reason
                    smartRecommendation = result.reason;
                    usesFallback = true;
                }
                yield ScanResult_1.ScanResult.create({
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
        });
    }
}
exports.RuleEngine = RuleEngine;
