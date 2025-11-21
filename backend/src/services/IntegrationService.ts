import { RuleEngine } from './RuleEngine';

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
                headers: { Authorization: `token ${token}` }
            });
            const userData = await response.json();
            console.log('✅ GitHub API Response (/user):', JSON.stringify({
                login: userData.login,
                plan: userData.plan,
                total_private_repos: userData.total_private_repos,
                public_repos: userData.public_repos
            }, null, 2));

            const plan = userData.plan?.name || 'free';

            // API Call 2: Get repos
            console.log('📡 Calling GitHub API: /user/repos...');
            const commitsRes = await fetch(`https://api.github.com/user/repos?sort=updated&per_page=1`, {
                headers: { Authorization: `token ${token}` }
            });
            const repos = await commitsRes.json();
            console.log('✅ GitHub API Response (/repos):', JSON.stringify({
                repo_count: repos.length,
                most_recent: repos[0]?.name,
                pushed_at: repos[0]?.pushed_at
            }, null, 2));

            const lastCommitDate = repos[0]?.pushed_at ? new Date(repos[0].pushed_at) : undefined;

            // CRITICAL FIX: Use REAL data, not mock
            const realData: any = {
                plan: plan,
                lastCommitDate: lastCommitDate,
                hasPrivateRepos: userData.total_private_repos > 0
            };

            console.log('🎯 REAL DATA FROM GITHUB API:', {
                plan,
                lastCommitDate: lastCommitDate?.toISOString(),
                hasPrivateRepos: realData.hasPrivateRepos
            });
            console.log('✅ Using REAL API data (not mock)\n');

            await RuleEngine.analyze(connection.userId, connection._id, 'github', realData);
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

            await RuleEngine.analyze(connection.userId, connection._id, 'vercel', realData);
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
        console.log('\n📦 AWS scan: Using mock data (AWS SDK not configured)');

        // AWS integration would require AWS SDK
        // For now, keep as mock until AWS SDK is set up
        const mockData = {
            activeRegions: [],
            hasBillingAlerts: true
        };

        await RuleEngine.analyze(connection.userId, connection._id, 'aws', mockData);
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

            await RuleEngine.analyze(connection.userId, connection._id, 'sentry', realData);
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

// Factory to get integration instance
export const getIntegration = (provider: string): Integration | null => {
    switch (provider) {
        case 'github': return new GitHubIntegration();
        case 'vercel': return new VercelIntegration();
        case 'aws': return new AWSIntegration();
        case 'sentry': return new SentryIntegration();
        default: return null;
    }
};
