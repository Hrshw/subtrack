// Cost estimation for cloud resources
// All costs are in INR per month (approximate)

const USD_TO_INR = 85; // TODO: Fetch from external API for production accuracy

// AWS Pricing (monthly estimates in USD)
const AWS_PRICING = {
    // EC2 Instances (per hour → monthly)
    ec2: {
        't2.micro': 0.0116 * 730,      // ~$8.47/month
        't2.small': 0.023 * 730,       // ~$16.79/month
        't2.medium': 0.0464 * 730,     // ~$33.87/month
        't3.micro': 0.0104 * 730,      // ~$7.59/month
        't3.small': 0.0208 * 730,      // ~$15.18/month
        't3.medium': 0.0416 * 730,     // ~$30.37/month
        'm5.large': 0.096 * 730,       // ~$70/month
        'm5.xlarge': 0.192 * 730,      // ~$140/month
        'c5.large': 0.085 * 730,       // ~$62/month
        '_default': 0.05 * 730,        // ~$36.50/month (fallback)
    },

    // EBS Volumes (per GB per month)
    ebs: {
        'gp2': 0.10,    // General Purpose SSD
        'gp3': 0.08,    // General Purpose SSD (newer)
        'io1': 0.125,   // Provisioned IOPS SSD
        'io2': 0.125,   // Provisioned IOPS SSD (newer)
        'st1': 0.045,   // Throughput Optimized HDD
        'sc1': 0.025,   // Cold HDD
        '_default': 0.10
    },

    // RDS Instances (per hour → monthly)
    rds: {
        'db.t2.micro': 0.017 * 730,    // ~$12.40/month
        'db.t2.small': 0.034 * 730,    // ~$24.82/month
        'db.t3.micro': 0.016 * 730,    // ~$11.68/month
        'db.t3.small': 0.032 * 730,    // ~$23.36/month
        'db.m5.large': 0.188 * 730,    // ~$137/month
        '_default': 0.05 * 730,        // ~$36.50/month
    },

    // Lambda (per million requests + per GB-second)
    lambda: {
        requestCost: 0.20 / 1000000,   // $0.20 per 1M requests
        computeCost: 0.0000166667,     // per GB-second
        freeRequestsPerMonth: 1000000,
        freeGBSecondsPerMonth: 400000
    },

    // DynamoDB
    dynamodb: {
        onDemand: {
            writeRequestUnit: 1.25 / 1000000,  // per million WRUs
            readRequestUnit: 0.25 / 1000000    // per million RRUs
        },
        provisioned: {
            writeCapacityUnit: 0.00065 * 730,  // per WCU per month
            readCapacityUnit: 0.00013 * 730    // per RCU per month
        },
        storageCost: 0.25  // per GB per month
    },

    // S3 Storage
    s3: {
        standard: 0.023,           // per GB per month
        standardIA: 0.0125,        // Infrequent Access
        oneZoneIA: 0.01,          // One Zone IA
        glacier: 0.004,           // Glacier
        deepArchive: 0.00099,     // Deep Archive
        '_default': 0.023
    },

    // Elastic IP (unattached)
    elasticIP: {
        unattached: 3.65  // $3.65 per month for unattached IPs
    }
};

// GitHub Pricing (monthly in USD)
const GITHUB_PRICING = {
    free: 0,
    pro: 4,
    team: 4,     // per user
    enterprise: 21  // per user
};

// Vercel Pricing (monthly in USD)
const VERCEL_PRICING = {
    hobby: 0,
    pro: 20,
    enterprise: 0  // Custom
};

export interface ResourceCostInfo {
    resourceName: string;
    resourceType: string;
    monthlyCost: number;  // in INR
    details?: string;
}

/**
 * Calculate the estimated monthly cost for AWS resources
 */
export function calculateAWSResourceCost(resource: any, resourceType: string): number {
    let costUSD = 0;

    switch (resourceType.toLowerCase()) {
        case 'ec2instances':
        case 'ec2 instances':
            const instanceType = resource.type || resource.instanceType || 't2.micro';
            costUSD = AWS_PRICING.ec2[instanceType.toLowerCase() as keyof typeof AWS_PRICING.ec2] || AWS_PRICING.ec2._default;
            // Add storage cost if available
            if (resource.storage || resource.volumeSize) {
                const sizeGB = resource.storage || resource.volumeSize || 8;
                costUSD += sizeGB * AWS_PRICING.ebs.gp2;
            }
            break;

        case 'ebsvolumes':
        case 'ebs volumes':
        case 'volumes':
            const volumeType = resource.volumeType || 'gp2';
            const volumeSize = resource.size || 8;
            costUSD = volumeSize * (AWS_PRICING.ebs[volumeType.toLowerCase() as keyof typeof AWS_PRICING.ebs] || AWS_PRICING.ebs._default);
            break;

        case 'rdsinstances':
        case 'rds instances':
            const rdsClass = resource.instanceClass || resource.class || 'db.t3.micro';
            costUSD = AWS_PRICING.rds[rdsClass.toLowerCase() as keyof typeof AWS_PRICING.rds] || AWS_PRICING.rds._default;
            // Add storage cost
            const storageGB = resource.allocatedStorage || 20;
            costUSD += storageGB * AWS_PRICING.ebs.gp2;
            // Double if Multi-AZ
            if (resource.multiAZ) {
                costUSD *= 2;
            }
            break;

        case 'lambdafunctions':
        case 'lambda functions':
        case 'functions':
            // Estimate: assume 100k requests/month and 128MB memory for 200ms avg
            const requests = 100000;
            const memoryGB = (resource.memorySize || 128) / 1024;
            const avgDurationSeconds = 0.2;
            const gbSeconds = requests * memoryGB * avgDurationSeconds;

            // Subtract free tier
            const billableRequests = Math.max(0, requests - AWS_PRICING.lambda.freeRequestsPerMonth);
            const billableGBSeconds = Math.max(0, gbSeconds - AWS_PRICING.lambda.freeGBSecondsPerMonth);

            costUSD = (billableRequests * AWS_PRICING.lambda.requestCost) +
                (billableGBSeconds * AWS_PRICING.lambda.computeCost);
            break;

        case 'dynamodbtables':
        case 'dynamo db tables':
        case 'tables':
            const billingMode = resource.billingMode || 'PAY_PER_REQUEST';
            if (billingMode === 'PAY_PER_REQUEST' || billingMode === 'ON_DEMAND') {
                // Estimate: 1M reads, 100k writes per month
                costUSD = (1000000 * AWS_PRICING.dynamodb.onDemand.readRequestUnit) +
                    (100000 * AWS_PRICING.dynamodb.onDemand.writeRequestUnit);
            } else {
                // Provisioned mode
                const rcu = resource.provisionedReadCapacity || 5;
                const wcu = resource.provisionedWriteCapacity || 5;
                costUSD = (rcu * AWS_PRICING.dynamodb.provisioned.readCapacityUnit) +
                    (wcu * AWS_PRICING.dynamodb.provisioned.writeCapacityUnit);
            }
            // Add storage cost (convert bytes to GB)
            const sizeGB = (resource.tableSizeBytes || 0) / (1024 * 1024 * 1024);
            costUSD += sizeGB * AWS_PRICING.dynamodb.storageCost;
            break;

        case 's3buckets':
        case 's3 buckets':
        case 'buckets':
            // Estimate: assume 10GB per bucket (since we don't have size data)
            const estimatedSizeGB = 10;
            costUSD = estimatedSizeGB * AWS_PRICING.s3.standard;
            break;

        case 'elasticips':
        case 'elastic ips':
        case 'ips':
            // Only cost if unattached
            if (!resource.isAttached && !resource.instanceId) {
                costUSD = AWS_PRICING.elasticIP.unattached;
            }
            break;

        default:
            // Unknown resource type, use minimal cost
            costUSD = 1;
    }

    return costUSD * USD_TO_INR;
}

/**
 * Calculate the estimated monthly cost for GitHub
 */
export function calculateGitHubCost(plan: string): number {
    const planLower = plan?.toLowerCase() || 'free';
    const costUSD = GITHUB_PRICING[planLower as keyof typeof GITHUB_PRICING] || 0;
    return costUSD * USD_TO_INR;
}

/**
 * Calculate the estimated monthly cost for Vercel
 */
export function calculateVercelCost(plan: string): number {
    const planLower = plan?.toLowerCase() || 'hobby';
    const costUSD = VERCEL_PRICING[planLower as keyof typeof VERCEL_PRICING] || 0;
    return costUSD * USD_TO_INR;
}

/**
 * Calculate total monthly cost from scan results
 */
export function calculateTotalMonthlyCost(scanResults: any[], provider: string): number {
    let totalCost = 0;

    scanResults.forEach(result => {
        if (!result.rawData) return;

        // GitHub/Vercel cost
        if (provider.toLowerCase() === 'github') {
            totalCost += calculateGitHubCost(result.rawData.plan || 'free');
            return;
        }

        if (provider.toLowerCase() === 'vercel') {
            totalCost += calculateVercelCost(result.rawData.plan || 'hobby');
            return;
        }

        // AWS costs - iterate through rawData
        if (typeof result.rawData === 'object' && !Array.isArray(result.rawData)) {
            Object.entries(result.rawData).forEach(([key, resources]) => {
                if (Array.isArray(resources)) {
                    resources.forEach((resource: any) => {
                        const cost = calculateAWSResourceCost(resource, key);
                        totalCost += cost;
                    });
                }
            });
        } else if (Array.isArray(result.rawData)) {
            // If rawData is an array
            result.rawData.forEach((resource: any) => {
                const cost = calculateAWSResourceCost(resource, result.resourceType);
                totalCost += cost;
            });
        }
    });

    return Math.round(totalCost);
}
