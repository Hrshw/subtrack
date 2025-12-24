import { RuleEngine } from './RuleEngine';
import { User } from '../models/User';

export interface Integration {
    scan(connection: any): Promise<void>;
}

export class GitHubIntegration implements Integration {
    async scan(connection: any) {
        console.log('\n🔍 ==> GITHUB API CALL STARTING...');
        console.log('📍 Endpoint: https://api.github.com/user');

        try {
            // PRODUCTION MODE: Fetch real data from GitHub API
            const { decryptToken } = await import('../utils/encryption');
            const token = decryptToken(connection.encryptedToken);

            console.log('🔑 Token decrypted successfully (first 10 chars):', token.substring(0, 10) + '...');

            // API Call 1: Get user data
            console.log('📡 Calling GitHub API: /user...');
            const response = await fetch('https://api.github.com/user', {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`❌ GitHub API /user failed: ${response.status} ${response.statusText}`, errorBody);
                throw new Error(`GitHub API /user failed: ${response.status}`);
            }

            const userData = await response.json();

            if (!userData.login) {
                console.warn('⚠️ GitHub API /user response missing login field:', JSON.stringify(userData));
            }

            console.log('✅ GitHub API Response (/user):', JSON.stringify({
                login: userData.login,
                plan: userData.plan,
                total_private_repos: userData.total_private_repos,
                owned_private_repos: userData.owned_private_repos,
                public_repos: userData.public_repos,
                private_gists: userData.private_gists
            }, null, 2));

            const plan = userData.plan?.name || 'free';

            // Check for private repos - check multiple fields
            const hasPrivateRepos = (
                (userData.total_private_repos && userData.total_private_repos > 0) ||
                (userData.owned_private_repos && userData.owned_private_repos > 0) ||
                false
            );

            console.log('🔐 Private repos check:', {
                total_private_repos: userData.total_private_repos,
                owned_private_repos: userData.owned_private_repos,
                hasPrivateRepos
            });

            // API Call 2: Get repos (both public and private, sorted by most recent push)
            console.log('📡 Calling GitHub API: /user/repos (affiliation=owner,collaborator)...');
            const reposRes = await fetch(`https://api.github.com/user/repos?affiliation=owner,collaborator&sort=pushed&per_page=10`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!reposRes.ok) {
                const errorBody = await reposRes.text();
                console.error(`❌ GitHub API /user/repos failed: ${reposRes.status} ${reposRes.statusText}`, errorBody);
                throw new Error(`GitHub API /user/repos failed: ${reposRes.status}`);
            }

            const repos = await reposRes.json();

            if (!Array.isArray(repos)) {
                console.error('❌ GitHub API /user/repos response is not an array:', JSON.stringify(repos));
                throw new Error('GitHub API /user/repos response is not an array');
            }

            console.log('✅ GitHub API Response (/repos):', JSON.stringify({
                repo_count: repos.length,
                repos: repos.map(r => ({
                    name: r.name,
                    private: r.private,
                    pushed_at: r.pushed_at,
                    updated_at: r.updated_at
                }))
            }, null, 2));

            // Get most recent commit date from ANY repo
            let lastCommitDate: Date | undefined = undefined;

            if (repos.length > 0) {
                // repos are already sorted by pushed_at (most recent first)
                const mostRecentRepo = repos[0];

                if (mostRecentRepo.pushed_at) {
                    lastCommitDate = new Date(mostRecentRepo.pushed_at);
                    console.log('📅 Most recent push:', {
                        repo: mostRecentRepo.name,
                        pushed_at: mostRecentRepo.pushed_at,
                        date: lastCommitDate.toISOString()
                    });
                }
            }

            // Double-check private repos by scanning actual repos
            const actualPrivateRepos = repos.filter(r => r.private === true).length;
            const finalHasPrivateRepos = hasPrivateRepos || actualPrivateRepos > 0;

            if (actualPrivateRepos > 0 && !hasPrivateRepos) {
                console.log('⚠️ Found private repos in list but userData.total_private_repos was 0/undefined');
                console.log(`📊 Actual private repos found: ${actualPrivateRepos}`);
            }

            // Plan-based restriction: Free users only get public repos
            const user = await User.findById(connection.userId);
            const isPro = user?.subscriptionStatus === 'pro';

            if (!isPro) {
                console.log('🚫 Free plan detected: Restricting scan to public repos only');
            }

            // CRITICAL FIX: Use REAL data, not mock
            const realData: any = {
                plan: plan,
                lastCommitDate: lastCommitDate,
                hasPrivateRepos: isPro ? finalHasPrivateRepos : false,
                publicRepos: userData.public_repos || 0,
                totalRepos: isPro ? repos.length : repos.filter(r => !r.private).length,
                privateReposCount: isPro ? actualPrivateRepos : 0,
                repos: (isPro ? repos : repos.filter(r => !r.private)).map(r => ({
                    name: r.name,
                    private: r.private,
                    pushed_at: r.pushed_at,
                    language: r.language,
                    description: r.description,
                    html_url: r.html_url
                }))
            };

            console.log(`🎯 FINAL DATA FROM GITHUB API (${isPro ? 'PRO' : 'FREE'}):`, {
                plan,
                lastCommitDate: lastCommitDate?.toISOString() || 'undefined',
                hasPrivateRepos: realData.hasPrivateRepos,
                publicRepos: realData.publicRepos,
                totalRepos: realData.totalRepos,
                privateReposCount: realData.privateReposCount
            });
            console.log('✅ Using REAL API data (not mock)\n');

            await RuleEngine.analyze(connection.userId, connection._id, 'github', realData, isPro ? 'pro' : 'free');
        } catch (error) {
            console.error('❌ GitHub API error:', error);
            console.log('⚠️ FALLBACK: Using mock data due to API failure\n');

            // Fallback to safe mock data if API fails
            const mockData: any = {
                plan: 'free',
                lastCommitDate: undefined,
                hasPrivateRepos: false
            };
            await RuleEngine.analyze(connection.userId, connection._id, 'github', mockData);
        }
    }
}

export class VercelIntegration implements Integration {
    async scan(connection: any) {
        console.log('\n🔍 ==> VERCEL API CALL STARTING...');
        console.log('📍 Endpoint: https://api.vercel.com/v2/user');

        try {
            // PRODUCTION MODE: Fetch real data from Vercel API
            const { decryptToken } = await import('../utils/encryption');
            const token = decryptToken(connection.encryptedToken);

            console.log('🔑 Token decrypted successfully (first 10 chars):', token.substring(0, 10) + '...');

            // API Call 1: Get user data
            console.log('📡 Calling Vercel API: /v2/user...');
            const response = await fetch('https://api.vercel.com/v2/user', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const userData = await response.json();
            console.log('✅ Vercel API Response (/v2/user):', JSON.stringify({
                username: userData.username,
                tier: userData.tier,
                email: userData.email
            }, null, 2));

            const plan = userData.tier || 'hobby';

            // API Call 2: Get usage data
            console.log('📡 Calling Vercel API: /v1/integrations/account-usage...');
            const usageRes = await fetch('https://api.vercel.com/v1/integrations/account-usage', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const usage = await usageRes.json();
            console.log('✅ Vercel API Response (/account-usage):', JSON.stringify({
                bandwidth: usage.bandwidth,
                bandwidth_GB: usage.bandwidth ? (usage.bandwidth / (1024 * 1024 * 1024)).toFixed(2) : 0
            }, null, 2));

            // Vercel returns bytes, convert to GB
            const bandwidthUsage = usage.bandwidth ? usage.bandwidth / (1024 * 1024 * 1024) : 0;

            // Plan limits in GB
            const planLimits: { [key: string]: number } = {
                'hobby': 100,
                'pro': 1000,
                'enterprise': 10000
            };
            const bandwidthLimit = planLimits[plan] || 100;

            const realData = {
                plan: plan,
                bandwidthUsage: bandwidthUsage,
                bandwidthLimit: bandwidthLimit
            };

            console.log('🎯 REAL DATA FROM VERCEL API:', {
                plan,
                bandwidthUsage: bandwidthUsage.toFixed(2) + ' GB',
                bandwidthLimit: bandwidthLimit + ' GB'
            });
            console.log('✅ Using REAL API data (not mock)\n');

            const user = await User.findById(connection.userId);
            const userTier = (user?.subscriptionStatus as 'free' | 'pro') || 'free';
            await RuleEngine.analyze(connection.userId, connection._id, 'vercel', realData, userTier);
        } catch (error) {
            console.error('❌ Vercel API error:', error);
            console.log('⚠️ FALLBACK: Using mock data due to API failure\n');

            // Fallback to safe mock data
            const mockData = {
                plan: 'hobby',
                bandwidthUsage: 5,
                bandwidthLimit: 100
            };
            await RuleEngine.analyze(connection.userId, connection._id, 'vercel', mockData);
        }
    }
}

export class AWSIntegration implements Integration {
    async scan(connection: any) {
        console.log('\n🔍 ===> AWS REAL API SCAN STARTING...');
        console.log('📍 Using AWS SDK to scan real resources');

        try {
            const { decryptToken } = await import('../utils/encryption');
            const { AWSScanner } = await import('./AWSScanner');

            const credentialsJson = decryptToken(connection.encryptedToken);
            const credentials = JSON.parse(credentialsJson);

            console.log('🔑 AWS Credentials decrypted');
            console.log('📍 Region:', credentials.region || 'us-east-1');

            // Initialize AWS Scanner with real credentials
            const scanner = new AWSScanner({
                accessKeyId: credentials.accessKeyId,
                secretAccessKey: credentials.secretAccessKey,
                region: credentials.region || 'us-east-1'
            });

            // Plan-based restriction: Free users only get basic S3/Dynamo scan
            const user = await User.findById(connection.userId);
            const isPro = user?.subscriptionStatus === 'pro';

            let awsResources;
            if (isPro) {
                // Pro users get the full deep scan
                awsResources = await scanner.scanAll();
            } else {
                // Free users get a basic scan (S3 + DynamoDB only)
                console.log('🚫 Free plan detected: Restricting AWS scan to S3 and DynamoDB only');
                const [s3Buckets, dynamoDBTables] = await Promise.all([
                    scanner.scanS3Buckets(),
                    scanner.scanDynamoDBTables()
                ]);

                awsResources = {
                    ec2Instances: [],
                    elasticIPs: [],
                    ebsVolumes: [],
                    lambdaFunctions: [],
                    dynamoDBTables,
                    s3Buckets,
                    rdsInstances: [],
                    region: credentials.region || 'us-east-1'
                };
            }

            console.log(`✅ AWS ${isPro ? 'Deep' : 'Basic'} Scan Complete`);
            console.log('📊 Resources found:', {
                ec2Instances: awsResources.ec2Instances.length,
                elasticIPs: awsResources.elasticIPs.length,
                ebsVolumes: awsResources.ebsVolumes.length,
                lambdaFunctions: awsResources.lambdaFunctions.length,
                dynamoDBTables: awsResources.dynamoDBTables.length,
                s3Buckets: awsResources.s3Buckets.length,
                rdsInstances: awsResources.rdsInstances.length
            });

            // Pass real data to RuleEngine for analysis
            await RuleEngine.analyze(connection.userId, connection._id, 'aws', awsResources, isPro ? 'pro' : 'free');

        } catch (error: any) {
            console.error('❌ AWS Real Scan failed:', error);
            console.error('Error details:', error.message);

            // Fallback to empty data on error
            await RuleEngine.analyze(connection.userId, connection._id, 'aws', {
                ec2Instances: [],
                elasticIPs: [],
                ebsVolumes: [],
                lambdaFunctions: [],
                dynamoDBTables: [],
                s3Buckets: [],
                rdsInstances: [],
                region: 'us-east-1',
                scanError: error.message
            });
        }
    }
}

export class SentryIntegration implements Integration {
    async scan(connection: any) {
        console.log('\n🔍 ==> SENTRY API CALL STARTING...');
        console.log('📍 Endpoint: https://sentry.io/api/0/organizations/');

        try {
            // PRODUCTION MODE: Fetch real data from Sentry API
            const { decryptToken } = await import('../utils/encryption');
            const token = decryptToken(connection.encryptedToken);

            console.log('🔑 Token decrypted successfully (first 10 chars):', token.substring(0, 10) + '...');

            // API Call 1: Get organizations
            console.log('📡 Calling Sentry API: /organizations/...');
            const response = await fetch('https://sentry.io/api/0/organizations/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const orgs = await response.json();
            console.log('✅ Sentry API Response (/organizations):', JSON.stringify({
                org_count: orgs.length,
                first_org: orgs[0]?.name,
                plan: orgs[0]?.subscription?.plan
            }, null, 2));

            if (orgs.length === 0) {
                throw new Error('No Sentry organizations found');
            }

            const org = orgs[0];
            const plan = org.subscription?.plan || 'developer';

            // API Call 2: Get event stats
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            console.log('📡 Calling Sentry API: /stats/...');
            const statsRes = await fetch(
                `https://sentry.io/api/0/organizations/${org.slug}/stats/?stat=received&since=${startOfMonth}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const stats = await statsRes.json();
            const eventCount = stats.reduce((sum: number, s: any) => sum + s[1], 0);
            console.log('✅ Sentry API Response (/stats):', JSON.stringify({
                events_this_month: eventCount,
                quota: org.subscription?.quota
            }, null, 2));

            const realData = {
                plan: plan,
                eventCount: eventCount,
                planLimit: org.subscription?.quota || 5000
            };

            console.log('🎯 REAL DATA FROM SENTRY API:', {
                plan,
                eventCount,
                planLimit: realData.planLimit
            });
            console.log('✅ Using REAL API data (not mock)\n');

            const user = await User.findById(connection.userId);
            const userTier = (user?.subscriptionStatus as 'free' | 'pro') || 'free';
            await RuleEngine.analyze(connection.userId, connection._id, 'sentry', realData, userTier);
        } catch (error) {
            console.error('❌ Sentry API error:', error);
            console.log('⚠️ FALLBACK: Using mock data due to API failure\n');

            // Fallback to safe mock data
            const mockData = {
                plan: 'developer',
                eventCount: 0,
                planLimit: 5000
            };
            await RuleEngine.analyze(connection.userId, connection._id, 'sentry', mockData);
        }
    }
}

export class LinearIntegration implements Integration {
    async scan(connection: any) {
        console.log('\n📐 Starting Linear scan...');
        const { decryptToken } = await import('../utils/encryption');

        try {
            const token = decryptToken(connection.encryptedToken);

            // Linear uses GraphQL API
            const response = await fetch('https://api.linear.app/graphql', {
                method: 'POST',
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: `
                        query {
                            viewer {
                                id
                                name
                                email
                            }
                            organization {
                                id
                                name
                                subscription {
                                    type
                                }
                                users {
                                    nodes {
                                        id
                                        active
                                    }
                                }
                                teams {
                                    nodes {
                                        id
                                        name
                                    }
                                }
                            }
                        }
                    `
                })
            });

            if (!response.ok) {
                console.log('⚠️ Linear API failed, using mock data');
                await RuleEngine.analyze(connection.userId, connection._id, 'linear', { plan: 'standard' });
                return;
            }

            const data = await response.json();
            const org = data.data?.organization;
            const userCount = org?.users?.nodes?.filter((u: any) => u.active).length || 0;
            const teamCount = org?.teams?.nodes?.length || 0;
            const subscriptionType = org?.subscription?.type || 'free';

            console.log('✅ Linear: Found', userCount, 'users,', teamCount, 'teams, plan:', subscriptionType);

            const user = await User.findById(connection.userId);
            const userTier = (user?.subscriptionStatus as 'free' | 'pro') || 'free';
            await RuleEngine.analyze(connection.userId, connection._id, 'linear', {
                plan: subscriptionType,
                userCount,
                teamCount,
                orgName: org?.name
            }, userTier);
        } catch (error) {
            console.error('Linear scan error:', error);
            await RuleEngine.analyze(connection.userId, connection._id, 'linear', { plan: 'standard' });
        }
    }
}

export class ResendIntegration implements Integration {
    async scan(connection: any) {
        console.log('\n📧 Starting Resend scan...');
        const { decryptToken } = await import('../utils/encryption');

        try {
            const token = decryptToken(connection.encryptedToken);

            // Get domains
            const domainsRes = await fetch('https://api.resend.com/domains', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!domainsRes.ok) {
                console.log('⚠️ Resend API failed, using mock data');
                await RuleEngine.analyze(connection.userId, connection._id, 'resend', { plan: 'free' });
                return;
            }

            const domainsData = await domainsRes.json();
            const domains = domainsData.data || [];

            // Get API keys count
            const keysRes = await fetch('https://api.resend.com/api-keys', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const keysData = keysRes.ok ? await keysRes.json() : { data: [] };
            const apiKeys = keysData.data || [];

            console.log('✅ Resend: Found', domains.length, 'domains,', apiKeys.length, 'API keys');

            const user = await User.findById(connection.userId);
            const userTier = (user?.subscriptionStatus as 'free' | 'pro') || 'free';
            await RuleEngine.analyze(connection.userId, connection._id, 'resend', {
                plan: domains.length > 0 ? 'pro' : 'free',
                domainCount: domains.length,
                apiKeyCount: apiKeys.length,
                domains: domains.map((d: any) => d.name)
            }, userTier);
        } catch (error) {
            console.error('Resend scan error:', error);
            await RuleEngine.analyze(connection.userId, connection._id, 'resend', { plan: 'free' });
        }
    }
}

export class ClerkIntegration implements Integration {
    async scan(connection: any) {
        console.log('\n🔐 Starting Clerk scan...');
        const { decryptToken } = await import('../utils/encryption');

        try {
            const token = decryptToken(connection.encryptedToken);

            // Get users count
            const usersRes = await fetch('https://api.clerk.com/v1/users?limit=1', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!usersRes.ok) {
                console.log('⚠️ Clerk API failed, using mock data');
                await RuleEngine.analyze(connection.userId, connection._id, 'clerk', { plan: 'free' });
                return;
            }

            // Get total count from header
            const totalUsers = parseInt(usersRes.headers.get('x-total-count') || '0');

            // Get organization count
            const orgsRes = await fetch('https://api.clerk.com/v1/organizations?limit=1', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const totalOrgs = orgsRes.ok ? parseInt(orgsRes.headers.get('x-total-count') || '0') : 0;

            console.log('✅ Clerk: Found', totalUsers, 'users,', totalOrgs, 'organizations');

            // Determine plan based on user count
            let plan = 'free';
            if (totalUsers > 10000) plan = 'enterprise';
            else if (totalUsers > 1000) plan = 'pro';
            else if (totalUsers > 100) plan = 'hobby';

            const user = await User.findById(connection.userId);
            const userTier = (user?.subscriptionStatus as 'free' | 'pro') || 'free';
            await RuleEngine.analyze(connection.userId, connection._id, 'clerk', {
                plan,
                userCount: totalUsers,
                orgCount: totalOrgs
            }, userTier);
        } catch (error) {
            console.error('Clerk scan error:', error);
            await RuleEngine.analyze(connection.userId, connection._id, 'clerk', { plan: 'free' });
        }
    }
}

export class StripeIntegration implements Integration {
    async scan(connection: any) {
        console.log('\n💳 Starting Stripe scan...');
        const { decryptToken } = await import('../utils/encryption');

        try {
            const token = decryptToken(connection.encryptedToken);

            // Get account info
            const accountRes = await fetch('https://api.stripe.com/v1/account', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!accountRes.ok) {
                console.log('⚠️ Stripe API failed, using mock data');
                await RuleEngine.analyze(connection.userId, connection._id, 'stripe', { plan: 'starter' });
                return;
            }

            const account = await accountRes.json();

            // Get recent charges to estimate activity
            const chargesRes = await fetch('https://api.stripe.com/v1/charges?limit=10', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const chargesData = chargesRes.ok ? await chargesRes.json() : { data: [] };
            const charges = chargesData.data || [];

            // Get subscriptions count
            const subsRes = await fetch('https://api.stripe.com/v1/subscriptions?limit=1', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const totalSubs = subsRes.headers?.get('x-total-count') || charges.length;

            console.log('✅ Stripe: Account', account.id, ', recent charges:', charges.length);

            const user = await User.findById(connection.userId);
            const userTier = (user?.subscriptionStatus as 'free' | 'pro') || 'free';
            await RuleEngine.analyze(connection.userId, connection._id, 'stripe', {
                plan: account.type || 'standard',
                accountId: account.id,
                businessName: account.business_profile?.name,
                chargesVolume: charges.length,
                subscriptionCount: totalSubs,
                country: account.country
            }, userTier);
        } catch (error) {
            console.error('Stripe scan error:', error);
            await RuleEngine.analyze(connection.userId, connection._id, 'stripe', { plan: 'starter' });
        }
    }
}

// Factory to get integration instance
export const getIntegration = (provider: string): Integration | null => {
    switch (provider) {
        case 'github': return new GitHubIntegration();
        case 'vercel': return new VercelIntegration();
        case 'aws': return new AWSIntegration();
        case 'sentry': return new SentryIntegration();
        case 'linear': return new LinearIntegration();
        case 'resend': return new ResendIntegration();
        case 'clerk': return new ClerkIntegration();
        case 'stripe': return new StripeIntegration();
        default: return null;
    }
};
