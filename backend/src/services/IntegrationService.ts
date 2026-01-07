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
            const { Connection } = await import('../models/Connection');
            await Connection.findByIdAndUpdate(connection._id, {
                status: 'active',
                errorMessage: null
            });

            await RuleEngine.analyze(connection.userId, connection._id, 'github', realData, isPro ? 'pro' : 'free');
        } catch (error: any) {
            console.error('❌ GitHub API error:', error);
            // Mark connection as error
            const { Connection } = await import('../models/Connection');
            await Connection.findByIdAndUpdate(connection._id, {
                status: 'error',
                errorMessage: error.message || 'Failed to connect to GitHub'
            });

            // Still analyze with empty data to clear any old mock findings
            await RuleEngine.analyze(connection.userId, connection._id, 'github', {
                plan: 'free',
                lastCommitDate: undefined,
                hasPrivateRepos: false,
                repos: []
            });
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

            // API Call 3: Get projects
            console.log('📡 Calling Vercel API: /v9/projects...');
            const projectsRes = await fetch('https://api.vercel.com/v9/projects', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const projectsData = await projectsRes.json();
            const projects = projectsData.projects || [];

            const realData = {
                plan: plan,
                bandwidthUsage: bandwidthUsage,
                bandwidthLimit: bandwidthLimit,
                projects: projects.map((p: any) => ({
                    name: p.name,
                    id: p.id,
                    framework: p.framework,
                    lastModified: p.updatedAt ? new Date(p.updatedAt).toISOString() : new Date().toISOString(),
                    region: 'Global'
                }))
            };

            console.log('🎯 REAL DATA FROM VERCEL API:', {
                plan,
                bandwidthUsage: bandwidthUsage.toFixed(2) + ' GB',
                bandwidthLimit: bandwidthLimit + ' GB'
            });
            console.log('✅ Using REAL API data (not mock)\n');

            const user = await User.findById(connection.userId);
            const userTier = (user?.subscriptionStatus as 'free' | 'pro') || 'free';

            const { Connection } = await import('../models/Connection');
            await Connection.findByIdAndUpdate(connection._id, {
                status: 'active',
                errorMessage: null
            });

            await RuleEngine.analyze(connection.userId, connection._id, 'vercel', realData, userTier);
        } catch (error: any) {
            console.error('❌ Vercel API error:', error);
            const { Connection } = await import('../models/Connection');
            await Connection.findByIdAndUpdate(connection._id, {
                status: 'error',
                errorMessage: error.message || 'Failed to connect to Vercel'
            });

            await RuleEngine.analyze(connection.userId, connection._id, 'vercel', {
                plan: 'hobby',
                bandwidthUsage: 0,
                bandwidthLimit: 100,
                projects: []
            });
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
            const { Connection } = await import('../models/Connection');
            await Connection.findByIdAndUpdate(connection._id, {
                status: 'active',
                errorMessage: null
            });
            await RuleEngine.analyze(connection.userId, connection._id, 'aws', awsResources, isPro ? 'pro' : 'free');

        } catch (error: any) {
            console.error('❌ AWS Real Scan failed:', error);
            console.error('Error details:', error.message);

            const { Connection } = await import('../models/Connection');
            await Connection.findByIdAndUpdate(connection._id, {
                status: 'error',
                errorMessage: error.message || 'AWS SDK error. Check credentials and region.'
            });

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
            }, 'free');
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

            // API Call 3: Get projects
            console.log('📡 Calling Sentry API: /projects/...');
            const projectsRes = await fetch(`https://sentry.io/api/0/organizations/${org.slug}/projects/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const projects = await projectsRes.json();

            const realData = {
                plan: plan,
                eventCount: eventCount,
                planLimit: org.subscription?.quota || 5000,
                projects: Array.isArray(projects) ? projects.map((p: any) => ({
                    name: p.name,
                    slug: p.slug,
                    platform: p.platform,
                    lastModified: p.dateCreated,
                    region: 'Cloud'
                })) : []
            };

            console.log('🎯 REAL DATA FROM SENTRY API:', {
                plan,
                eventCount,
                planLimit: realData.planLimit
            });
            console.log('✅ Using REAL API data (not mock)\n');

            const user = await User.findById(connection.userId);
            const userTier = (user?.subscriptionStatus as 'free' | 'pro') || 'free';

            const { Connection } = await import('../models/Connection');
            await Connection.findByIdAndUpdate(connection._id, {
                status: 'active',
                errorMessage: null
            });

            await RuleEngine.analyze(connection.userId, connection._id, 'sentry', realData, userTier);
        } catch (error: any) {
            console.error('❌ Sentry API error:', error);
            const { Connection } = await import('../models/Connection');
            await Connection.findByIdAndUpdate(connection._id, {
                status: 'error',
                errorMessage: error.message || 'Failed to connect to Sentry'
            });

            await RuleEngine.analyze(connection.userId, connection._id, 'sentry', {
                plan: 'developer',
                eventCount: 0,
                planLimit: 5000,
                projects: []
            });
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
                const errorBody = await response.json().catch(() => ({}));
                const detailedError = errorBody.message || errorBody.error || `Linear API Error (${response.status})`;

                const { Connection } = await import('../models/Connection');
                await Connection.findByIdAndUpdate(connection._id, {
                    status: 'error',
                    errorMessage: detailedError
                });
                return;
            }

            const data = await response.json();

            if (data.errors && data.errors.length > 0) {
                const detailedError = data.errors[0].message || 'Linear GraphQL Error';
                const { Connection } = await import('../models/Connection');
                await Connection.findByIdAndUpdate(connection._id, {
                    status: 'error',
                    errorMessage: detailedError
                });
                return;
            }

            const org = data.data?.organization;
            const userCount = org?.users?.nodes?.filter((u: any) => u.active).length || 0;
            const teamCount = org?.teams?.nodes?.length || 0;
            const subscriptionType = org?.subscription?.type || 'free';

            console.log('✅ Linear: Found', userCount, 'users,', teamCount, 'teams, plan:', subscriptionType);

            const user = await User.findById(connection.userId);
            const userTier = (user?.subscriptionStatus as 'free' | 'pro') || 'free';
            const { Connection } = await import('../models/Connection');
            await Connection.findByIdAndUpdate(connection._id, {
                status: 'active',
                errorMessage: null
            });

            await RuleEngine.analyze(connection.userId, connection._id, 'linear', {
                plan: subscriptionType,
                userCount,
                teamCount,
                orgName: org?.name
            }, userTier);
        } catch (error: any) {
            console.error('Linear scan error:', error);
            const { Connection } = await import('../models/Connection');
            await Connection.findByIdAndUpdate(connection._id, {
                status: 'error',
                errorMessage: error.message || 'Failed to connect to Linear'
            });
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
                const errorBody = await domainsRes.json().catch(() => ({}));
                const detailedError = errorBody.message || errorBody.error || `Resend API Error (${domainsRes.status})`;

                const { Connection } = await import('../models/Connection');
                await Connection.findByIdAndUpdate(connection._id, {
                    status: 'error',
                    errorMessage: detailedError
                });
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
            const { Connection } = await import('../models/Connection');
            await Connection.findByIdAndUpdate(connection._id, {
                status: 'active',
                errorMessage: null
            });

            await RuleEngine.analyze(connection.userId, connection._id, 'resend', {
                plan: domains.length > 0 ? 'pro' : 'free',
                domainCount: domains.length,
                apiKeyCount: apiKeys.length,
                domains: domains.map((d: any) => ({
                    name: d.domain,
                    id: d.id,
                    region: d.region,
                    lastModified: d.created_at,
                    status: d.status
                }))
            }, userTier);
        } catch (error: any) {
            console.error('Resend scan error:', error);
            const { Connection } = await import('../models/Connection');
            await Connection.findByIdAndUpdate(connection._id, {
                status: 'error',
                errorMessage: error.message || 'Failed to connect to Resend'
            });
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
                const errorBody = await usersRes.json().catch(() => ({}));
                const detailedError = errorBody.errors?.[0]?.message || errorBody.message || `Clerk API Error (${usersRes.status})`;

                const { Connection } = await import('../models/Connection');
                await Connection.findByIdAndUpdate(connection._id, {
                    status: 'error',
                    errorMessage: detailedError
                });
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
            const { Connection } = await import('../models/Connection');
            await Connection.findByIdAndUpdate(connection._id, {
                status: 'active',
                errorMessage: null
            });

            await RuleEngine.analyze(connection.userId, connection._id, 'clerk', {
                plan,
                userCount: totalUsers,
                orgCount: totalOrgs
            }, userTier);
        } catch (error: any) {
            console.error('Clerk scan error:', error);
            const { Connection } = await import('../models/Connection');
            await Connection.findByIdAndUpdate(connection._id, {
                status: 'error',
                errorMessage: error.message || 'Failed to connect to Clerk'
            });
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
                const errorBody = await accountRes.json().catch(() => ({}));
                const detailedError = errorBody.error?.message || errorBody.message || `Stripe API Error (${accountRes.status})`;

                const { Connection } = await import('../models/Connection');
                await Connection.findByIdAndUpdate(connection._id, {
                    status: 'error',
                    errorMessage: detailedError
                });
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
            const { Connection } = await import('../models/Connection');
            await Connection.findByIdAndUpdate(connection._id, {
                status: 'active',
                errorMessage: null
            });

            await RuleEngine.analyze(connection.userId, connection._id, 'stripe', {
                plan: account.type || 'standard',
                accountId: account.id,
                businessName: account.business_profile?.name,
                chargesVolume: charges.length,
                subscriptionCount: totalSubs,
                country: account.country,
                recentCharges: charges.map((c: any) => ({
                    name: `Charge ${c.id.substring(3, 10)}`,
                    amount: (c.amount / 100).toFixed(2),
                    currency: c.currency.toUpperCase(),
                    lastModified: new Date(c.created * 1000).toISOString(),
                    region: c.billing_details?.address?.country || account.country
                }))
            }, userTier);
        } catch (error: any) {
            console.error('Stripe scan error:', error);
            const { Connection } = await import('../models/Connection');
            await Connection.findByIdAndUpdate(connection._id, {
                status: 'error',
                errorMessage: error.message || 'Failed to connect to Stripe'
            });
        }
    }
}

export class OpenAIIntegration implements Integration {
    async scan(connection: any) {
        console.log('\n🤖 Starting OpenAI scan...');
        const { decryptToken } = await import('../utils/encryption');

        try {
            const apiKey = decryptToken(connection.encryptedToken);

            // Get all days of current month so far
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth();
            const daysToScan = now.getDate();

            let totalTokens = 0;
            const usageByModel: Record<string, number> = {};
            const usageHistory: any[] = [];

            console.log(`📡 Fetching OpenAI usage for ${daysToScan} days of current month...`);

            // Fetch each day's usage (OpenAI API restriction: only 1 day per request)
            const fetchPromises = [];
            for (let i = 1; i <= daysToScan; i++) {
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                fetchPromises.push(
                    fetch(`https://api.openai.com/v1/usage?date=${dateStr}`, {
                        headers: { 'Authorization': `Bearer ${apiKey}` }
                    }).then(res => {
                        if (!res.ok) {
                            // If any day's fetch fails, we should still try to process others
                            // but log the error for that specific day.
                            console.error(`❌ OpenAI API Error for date ${dateStr}: ${res.status}`);
                            return { data: [], errorStatus: res.status }; // Return empty data but mark error
                        }
                        return res.json();
                    })
                );
            }

            const allUsageResults = await Promise.all(fetchPromises);

            let hasApiError = false;
            for (const usageData of allUsageResults) {
                if (usageData.errorStatus) {
                    hasApiError = true;
                    // Optionally, you could collect detailed error messages here
                    continue; // Skip processing this failed day's data
                }

                if (usageData.data && Array.isArray(usageData.data)) {
                    usageData.data.forEach((item: any) => {
                        const tokens = (item.n_context_tokens_total || 0) + (item.n_generated_tokens_total || 0);
                        totalTokens += tokens;
                        const model = item.snapshot_id || 'unknown';
                        usageByModel[model] = (usageByModel[model] || 0) + tokens;
                    });
                }
            }

            console.log(`✅ OpenAI Scan Complete. Total Tokens: ${totalTokens.toLocaleString()}`);

            const realData = {
                totalTokens,
                usageByModel,
                plan: 'usage-based',
                projects: []
            };

            const user = await User.findById(connection.userId);
            const userTier = (user?.subscriptionStatus as 'free' | 'pro') || 'free';
            const { Connection } = await import('../models/Connection');
            await Connection.findByIdAndUpdate(connection._id, {
                status: 'active',
                errorMessage: null
            });

            await RuleEngine.analyze(connection.userId, connection._id, 'openai', realData, userTier);

        } catch (error: any) {
            console.error('OpenAI scan error:', error);
            const { Connection } = await import('../models/Connection');
            await Connection.findByIdAndUpdate(connection._id, {
                status: 'error',
                errorMessage: error.message || 'Failed to connect to OpenAI'
            });
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
        case 'openai': return new OpenAIIntegration();
        case 'digitalocean': return new DigitalOceanIntegration();
        case 'supabase': return new SupabaseIntegration();
        case 'notion': return new NotionIntegration();
        default: return null;
    }
};

// DigitalOcean Integration - Tracks droplets and billing
export class DigitalOceanIntegration implements Integration {
    async scan(connection: any) {
        console.log('\n🌊 Starting DigitalOcean scan...');
        const { decryptToken } = await import('../utils/encryption');

        try {
            const apiKey = decryptToken(connection.encryptedToken);

            // Get droplets list
            console.log('📡 Calling DigitalOcean API: /v2/droplets...');
            const dropletsRes = await fetch('https://api.digitalocean.com/v2/droplets?per_page=100', {
                headers: { 'Authorization': `Bearer ${apiKey}` }
            });

            if (!dropletsRes.ok) {
                throw new Error(`DigitalOcean API failed: ${dropletsRes.status}`);
            }

            const dropletsData = await dropletsRes.json();
            const droplets = dropletsData.droplets || [];

            // Get account balance
            console.log('📡 Calling DigitalOcean API: /v2/customers/my/balance...');
            const balanceRes = await fetch('https://api.digitalocean.com/v2/customers/my/balance', {
                headers: { 'Authorization': `Bearer ${apiKey}` }
            });

            let balance = { month_to_date_usage: '0', account_balance: '0' };
            if (balanceRes.ok) {
                balance = await balanceRes.json();
            }

            console.log(`✅ DigitalOcean Scan Complete. ${droplets.length} droplets found.`);

            const realData = {
                droplets: droplets.map((d: any) => ({
                    id: d.id,
                    name: d.name,
                    status: d.status,
                    size: d.size_slug,
                    region: d.region?.slug,
                    memory: d.memory,
                    vcpus: d.vcpus,
                    disk: d.disk,
                    createdAt: d.created_at
                })),
                monthToDateUsage: parseFloat(balance.month_to_date_usage || '0'),
                accountBalance: parseFloat(balance.account_balance || '0'),
                plan: 'usage-based'
            };

            const user = await User.findById(connection.userId);
            const userTier = (user?.subscriptionStatus as 'free' | 'pro') || 'free';
            const { Connection } = await import('../models/Connection');
            await Connection.findByIdAndUpdate(connection._id, {
                status: 'active',
                errorMessage: null
            });

            await RuleEngine.analyze(connection.userId, connection._id, 'digitalocean', realData, userTier);

        } catch (error: any) {
            console.error('DigitalOcean scan error:', error);
            const { Connection } = await import('../models/Connection');
            await Connection.findByIdAndUpdate(connection._id, {
                status: 'error',
                errorMessage: error.message || 'Failed to connect to DigitalOcean'
            });
        }
    }
}

// Supabase Integration - Tracks projects and usage
export class SupabaseIntegration implements Integration {
    async scan(connection: any) {
        console.log('\n⚡ Starting Supabase scan...');
        const { decryptToken } = await import('../utils/encryption');

        try {
            const apiKey = decryptToken(connection.encryptedToken);

            // Get projects list
            console.log('📡 Calling Supabase Management API: /v1/projects...');
            const projectsRes = await fetch('https://api.supabase.com/v1/projects', {
                headers: { 'Authorization': `Bearer ${apiKey}` }
            });

            if (!projectsRes.ok) {
                throw new Error(`Supabase API failed: ${projectsRes.status}`);
            }

            const projects = await projectsRes.json();

            console.log(`✅ Supabase Scan Complete. ${projects.length} projects found.`);

            const realData = {
                projects: projects.map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    region: p.region,
                    status: p.status,
                    createdAt: p.created_at,
                    organization: p.organization_id
                })),
                projectCount: projects.length,
                plan: projects.length > 2 ? 'pro' : 'free' // Infer plan from project count
            };

            const user = await User.findById(connection.userId);
            const userTier = (user?.subscriptionStatus as 'free' | 'pro') || 'free';
            const { Connection } = await import('../models/Connection');
            await Connection.findByIdAndUpdate(connection._id, {
                status: 'active',
                errorMessage: null
            });

            await RuleEngine.analyze(connection.userId, connection._id, 'supabase', realData, userTier);

        } catch (error: any) {
            console.error('Supabase scan error:', error);
            const { Connection } = await import('../models/Connection');
            await Connection.findByIdAndUpdate(connection._id, {
                status: 'error',
                errorMessage: error.message || 'Failed to connect to Supabase'
            });
        }
    }
}

// Notion Integration - Tracks workspaces and usage
export class NotionIntegration implements Integration {
    async scan(connection: any) {
        console.log('\n📝 Starting Notion scan...');
        const { decryptToken } = await import('../utils/encryption');

        try {
            const apiKey = decryptToken(connection.encryptedToken);

            // Get user info (workspace info)
            console.log('📡 Calling Notion API: /v1/users/me...');
            const userRes = await fetch('https://api.notion.com/v1/users/me', {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Notion-Version': '2022-06-28'
                }
            });

            if (!userRes.ok) {
                throw new Error(`Notion API failed: ${userRes.status}`);
            }

            const userData = await userRes.json();

            // List users to get workspace member count
            console.log('📡 Calling Notion API: /v1/users...');
            const usersRes = await fetch('https://api.notion.com/v1/users?page_size=100', {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Notion-Version': '2022-06-28'
                }
            });

            let memberCount = 1;
            if (usersRes.ok) {
                const usersData = await usersRes.json();
                memberCount = usersData.results?.length || 1;
            }

            // Search for databases to estimate usage
            console.log('📡 Calling Notion API: /v1/search (databases)...');
            const searchRes = await fetch('https://api.notion.com/v1/search', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Notion-Version': '2022-06-28',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ filter: { property: 'object', value: 'database' }, page_size: 100 })
            });

            let databaseCount = 0;
            if (searchRes.ok) {
                const searchData = await searchRes.json();
                databaseCount = searchData.results?.length || 0;
            }

            console.log(`✅ Notion Scan Complete. ${memberCount} members, ${databaseCount} databases.`);

            const realData = {
                botUser: userData,
                memberCount,
                databaseCount,
                plan: memberCount > 5 ? 'team' : 'free' // Infer plan from member count
            };

            const user = await User.findById(connection.userId);
            const userTier = (user?.subscriptionStatus as 'free' | 'pro') || 'free';
            const { Connection } = await import('../models/Connection');
            await Connection.findByIdAndUpdate(connection._id, {
                status: 'active',
                errorMessage: null
            });

            await RuleEngine.analyze(connection.userId, connection._id, 'notion', realData, userTier);

        } catch (error: any) {
            console.error('Notion scan error:', error);
            const { Connection } = await import('../models/Connection');
            await Connection.findByIdAndUpdate(connection._id, {
                status: 'error',
                errorMessage: error.message || 'Failed to connect to Notion'
            });
        }
    }
}
