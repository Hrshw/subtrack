"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.getIntegration = exports.StripeIntegration = exports.ClerkIntegration = exports.ResendIntegration = exports.LinearIntegration = exports.SentryIntegration = exports.AWSIntegration = exports.VercelIntegration = exports.GitHubIntegration = void 0;
const RuleEngine_1 = require("./RuleEngine");
const User_1 = require("../models/User");
class GitHubIntegration {
    scan(connection) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            console.log('\n🔍 ==> GITHUB API CALL STARTING...');
            console.log('📍 Endpoint: https://api.github.com/user');
            try {
                // PRODUCTION MODE: Fetch real data from GitHub API
                const { decryptToken } = yield Promise.resolve().then(() => __importStar(require('../utils/encryption')));
                const token = decryptToken(connection.encryptedToken);
                console.log('🔑 Token decrypted successfully (first 10 chars):', token.substring(0, 10) + '...');
                // API Call 1: Get user data
                console.log('📡 Calling GitHub API: /user...');
                const response = yield fetch('https://api.github.com/user', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
                if (!response.ok) {
                    const errorBody = yield response.text();
                    console.error(`❌ GitHub API /user failed: ${response.status} ${response.statusText}`, errorBody);
                    throw new Error(`GitHub API /user failed: ${response.status}`);
                }
                const userData = yield response.json();
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
                const plan = ((_a = userData.plan) === null || _a === void 0 ? void 0 : _a.name) || 'free';
                // Check for private repos - check multiple fields
                const hasPrivateRepos = ((userData.total_private_repos && userData.total_private_repos > 0) ||
                    (userData.owned_private_repos && userData.owned_private_repos > 0) ||
                    false);
                console.log('🔐 Private repos check:', {
                    total_private_repos: userData.total_private_repos,
                    owned_private_repos: userData.owned_private_repos,
                    hasPrivateRepos
                });
                // API Call 2: Get repos (both public and private, sorted by most recent push)
                console.log('📡 Calling GitHub API: /user/repos (affiliation=owner,collaborator)...');
                const reposRes = yield fetch(`https://api.github.com/user/repos?affiliation=owner,collaborator&sort=pushed&per_page=10`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
                if (!reposRes.ok) {
                    const errorBody = yield reposRes.text();
                    console.error(`❌ GitHub API /user/repos failed: ${reposRes.status} ${reposRes.statusText}`, errorBody);
                    throw new Error(`GitHub API /user/repos failed: ${reposRes.status}`);
                }
                const repos = yield reposRes.json();
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
                let lastCommitDate = undefined;
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
                const user = yield User_1.User.findById(connection.userId);
                const isPro = (user === null || user === void 0 ? void 0 : user.subscriptionStatus) === 'pro';
                if (!isPro) {
                    console.log('🚫 Free plan detected: Restricting scan to public repos only');
                }
                // CRITICAL FIX: Use REAL data, not mock
                const realData = {
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
                    lastCommitDate: (lastCommitDate === null || lastCommitDate === void 0 ? void 0 : lastCommitDate.toISOString()) || 'undefined',
                    hasPrivateRepos: realData.hasPrivateRepos,
                    publicRepos: realData.publicRepos,
                    totalRepos: realData.totalRepos,
                    privateReposCount: realData.privateReposCount
                });
                console.log('✅ Using REAL API data (not mock)\n');
                yield RuleEngine_1.RuleEngine.analyze(connection.userId, connection._id, 'github', realData, isPro ? 'pro' : 'free');
            }
            catch (error) {
                console.error('❌ GitHub API error:', error);
                console.log('⚠️ FALLBACK: Using mock data due to API failure\n');
                // Fallback to safe mock data if API fails
                const mockData = {
                    plan: 'free',
                    lastCommitDate: undefined,
                    hasPrivateRepos: false
                };
                yield RuleEngine_1.RuleEngine.analyze(connection.userId, connection._id, 'github', mockData);
            }
        });
    }
}
exports.GitHubIntegration = GitHubIntegration;
class VercelIntegration {
    scan(connection) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('\n🔍 ==> VERCEL API CALL STARTING...');
            console.log('📍 Endpoint: https://api.vercel.com/v2/user');
            try {
                // PRODUCTION MODE: Fetch real data from Vercel API
                const { decryptToken } = yield Promise.resolve().then(() => __importStar(require('../utils/encryption')));
                const token = decryptToken(connection.encryptedToken);
                console.log('🔑 Token decrypted successfully (first 10 chars):', token.substring(0, 10) + '...');
                // API Call 1: Get user data
                console.log('📡 Calling Vercel API: /v2/user...');
                const response = yield fetch('https://api.vercel.com/v2/user', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const userData = yield response.json();
                console.log('✅ Vercel API Response (/v2/user):', JSON.stringify({
                    username: userData.username,
                    tier: userData.tier,
                    email: userData.email
                }, null, 2));
                const plan = userData.tier || 'hobby';
                // API Call 2: Get usage data
                console.log('📡 Calling Vercel API: /v1/integrations/account-usage...');
                const usageRes = yield fetch('https://api.vercel.com/v1/integrations/account-usage', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const usage = yield usageRes.json();
                console.log('✅ Vercel API Response (/account-usage):', JSON.stringify({
                    bandwidth: usage.bandwidth,
                    bandwidth_GB: usage.bandwidth ? (usage.bandwidth / (1024 * 1024 * 1024)).toFixed(2) : 0
                }, null, 2));
                // Vercel returns bytes, convert to GB
                const bandwidthUsage = usage.bandwidth ? usage.bandwidth / (1024 * 1024 * 1024) : 0;
                // Plan limits in GB
                const planLimits = {
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
                const user = yield User_1.User.findById(connection.userId);
                const userTier = (user === null || user === void 0 ? void 0 : user.subscriptionStatus) || 'free';
                yield RuleEngine_1.RuleEngine.analyze(connection.userId, connection._id, 'vercel', realData, userTier);
            }
            catch (error) {
                console.error('❌ Vercel API error:', error);
                console.log('⚠️ FALLBACK: Using mock data due to API failure\n');
                // Fallback to safe mock data
                const mockData = {
                    plan: 'hobby',
                    bandwidthUsage: 5,
                    bandwidthLimit: 100
                };
                yield RuleEngine_1.RuleEngine.analyze(connection.userId, connection._id, 'vercel', mockData);
            }
        });
    }
}
exports.VercelIntegration = VercelIntegration;
class AWSIntegration {
    scan(connection) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('\n🔍 ===> AWS REAL API SCAN STARTING...');
            console.log('📍 Using AWS SDK to scan real resources');
            try {
                const { decryptToken } = yield Promise.resolve().then(() => __importStar(require('../utils/encryption')));
                const { AWSScanner } = yield Promise.resolve().then(() => __importStar(require('./AWSScanner')));
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
                const user = yield User_1.User.findById(connection.userId);
                const isPro = (user === null || user === void 0 ? void 0 : user.subscriptionStatus) === 'pro';
                let awsResources;
                if (isPro) {
                    // Pro users get the full deep scan
                    awsResources = yield scanner.scanAll();
                }
                else {
                    // Free users get a basic scan (S3 + DynamoDB only)
                    console.log('🚫 Free plan detected: Restricting AWS scan to S3 and DynamoDB only');
                    const [s3Buckets, dynamoDBTables] = yield Promise.all([
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
                yield RuleEngine_1.RuleEngine.analyze(connection.userId, connection._id, 'aws', awsResources, isPro ? 'pro' : 'free');
            }
            catch (error) {
                console.error('❌ AWS Real Scan failed:', error);
                console.error('Error details:', error.message);
                // Fallback to empty data on error
                yield RuleEngine_1.RuleEngine.analyze(connection.userId, connection._id, 'aws', {
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
        });
    }
}
exports.AWSIntegration = AWSIntegration;
class SentryIntegration {
    scan(connection) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f;
            console.log('\n🔍 ==> SENTRY API CALL STARTING...');
            console.log('📍 Endpoint: https://sentry.io/api/0/organizations/');
            try {
                // PRODUCTION MODE: Fetch real data from Sentry API
                const { decryptToken } = yield Promise.resolve().then(() => __importStar(require('../utils/encryption')));
                const token = decryptToken(connection.encryptedToken);
                console.log('🔑 Token decrypted successfully (first 10 chars):', token.substring(0, 10) + '...');
                // API Call 1: Get organizations
                console.log('📡 Calling Sentry API: /organizations/...');
                const response = yield fetch('https://sentry.io/api/0/organizations/', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const orgs = yield response.json();
                console.log('✅ Sentry API Response (/organizations):', JSON.stringify({
                    org_count: orgs.length,
                    first_org: (_a = orgs[0]) === null || _a === void 0 ? void 0 : _a.name,
                    plan: (_c = (_b = orgs[0]) === null || _b === void 0 ? void 0 : _b.subscription) === null || _c === void 0 ? void 0 : _c.plan
                }, null, 2));
                if (orgs.length === 0) {
                    throw new Error('No Sentry organizations found');
                }
                const org = orgs[0];
                const plan = ((_d = org.subscription) === null || _d === void 0 ? void 0 : _d.plan) || 'developer';
                // API Call 2: Get event stats
                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
                console.log('📡 Calling Sentry API: /stats/...');
                const statsRes = yield fetch(`https://sentry.io/api/0/organizations/${org.slug}/stats/?stat=received&since=${startOfMonth}`, { headers: { Authorization: `Bearer ${token}` } });
                const stats = yield statsRes.json();
                const eventCount = stats.reduce((sum, s) => sum + s[1], 0);
                console.log('✅ Sentry API Response (/stats):', JSON.stringify({
                    events_this_month: eventCount,
                    quota: (_e = org.subscription) === null || _e === void 0 ? void 0 : _e.quota
                }, null, 2));
                const realData = {
                    plan: plan,
                    eventCount: eventCount,
                    planLimit: ((_f = org.subscription) === null || _f === void 0 ? void 0 : _f.quota) || 5000
                };
                console.log('🎯 REAL DATA FROM SENTRY API:', {
                    plan,
                    eventCount,
                    planLimit: realData.planLimit
                });
                console.log('✅ Using REAL API data (not mock)\n');
                const user = yield User_1.User.findById(connection.userId);
                const userTier = (user === null || user === void 0 ? void 0 : user.subscriptionStatus) || 'free';
                yield RuleEngine_1.RuleEngine.analyze(connection.userId, connection._id, 'sentry', realData, userTier);
            }
            catch (error) {
                console.error('❌ Sentry API error:', error);
                console.log('⚠️ FALLBACK: Using mock data due to API failure\n');
                // Fallback to safe mock data
                const mockData = {
                    plan: 'developer',
                    eventCount: 0,
                    planLimit: 5000
                };
                yield RuleEngine_1.RuleEngine.analyze(connection.userId, connection._id, 'sentry', mockData);
            }
        });
    }
}
exports.SentryIntegration = SentryIntegration;
class LinearIntegration {
    scan(connection) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f;
            console.log('\n📐 Starting Linear scan...');
            const { decryptToken } = yield Promise.resolve().then(() => __importStar(require('../utils/encryption')));
            try {
                const token = decryptToken(connection.encryptedToken);
                // Linear uses GraphQL API
                const response = yield fetch('https://api.linear.app/graphql', {
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
                    yield RuleEngine_1.RuleEngine.analyze(connection.userId, connection._id, 'linear', { plan: 'standard' });
                    return;
                }
                const data = yield response.json();
                const org = (_a = data.data) === null || _a === void 0 ? void 0 : _a.organization;
                const userCount = ((_c = (_b = org === null || org === void 0 ? void 0 : org.users) === null || _b === void 0 ? void 0 : _b.nodes) === null || _c === void 0 ? void 0 : _c.filter((u) => u.active).length) || 0;
                const teamCount = ((_e = (_d = org === null || org === void 0 ? void 0 : org.teams) === null || _d === void 0 ? void 0 : _d.nodes) === null || _e === void 0 ? void 0 : _e.length) || 0;
                const subscriptionType = ((_f = org === null || org === void 0 ? void 0 : org.subscription) === null || _f === void 0 ? void 0 : _f.type) || 'free';
                console.log('✅ Linear: Found', userCount, 'users,', teamCount, 'teams, plan:', subscriptionType);
                const user = yield User_1.User.findById(connection.userId);
                const userTier = (user === null || user === void 0 ? void 0 : user.subscriptionStatus) || 'free';
                yield RuleEngine_1.RuleEngine.analyze(connection.userId, connection._id, 'linear', {
                    plan: subscriptionType,
                    userCount,
                    teamCount,
                    orgName: org === null || org === void 0 ? void 0 : org.name
                }, userTier);
            }
            catch (error) {
                console.error('Linear scan error:', error);
                yield RuleEngine_1.RuleEngine.analyze(connection.userId, connection._id, 'linear', { plan: 'standard' });
            }
        });
    }
}
exports.LinearIntegration = LinearIntegration;
class ResendIntegration {
    scan(connection) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('\n📧 Starting Resend scan...');
            const { decryptToken } = yield Promise.resolve().then(() => __importStar(require('../utils/encryption')));
            try {
                const token = decryptToken(connection.encryptedToken);
                // Get domains
                const domainsRes = yield fetch('https://api.resend.com/domains', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!domainsRes.ok) {
                    console.log('⚠️ Resend API failed, using mock data');
                    yield RuleEngine_1.RuleEngine.analyze(connection.userId, connection._id, 'resend', { plan: 'free' });
                    return;
                }
                const domainsData = yield domainsRes.json();
                const domains = domainsData.data || [];
                // Get API keys count
                const keysRes = yield fetch('https://api.resend.com/api-keys', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const keysData = keysRes.ok ? yield keysRes.json() : { data: [] };
                const apiKeys = keysData.data || [];
                console.log('✅ Resend: Found', domains.length, 'domains,', apiKeys.length, 'API keys');
                const user = yield User_1.User.findById(connection.userId);
                const userTier = (user === null || user === void 0 ? void 0 : user.subscriptionStatus) || 'free';
                yield RuleEngine_1.RuleEngine.analyze(connection.userId, connection._id, 'resend', {
                    plan: domains.length > 0 ? 'pro' : 'free',
                    domainCount: domains.length,
                    apiKeyCount: apiKeys.length,
                    domains: domains.map((d) => d.name)
                }, userTier);
            }
            catch (error) {
                console.error('Resend scan error:', error);
                yield RuleEngine_1.RuleEngine.analyze(connection.userId, connection._id, 'resend', { plan: 'free' });
            }
        });
    }
}
exports.ResendIntegration = ResendIntegration;
class ClerkIntegration {
    scan(connection) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('\n🔐 Starting Clerk scan...');
            const { decryptToken } = yield Promise.resolve().then(() => __importStar(require('../utils/encryption')));
            try {
                const token = decryptToken(connection.encryptedToken);
                // Get users count
                const usersRes = yield fetch('https://api.clerk.com/v1/users?limit=1', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!usersRes.ok) {
                    console.log('⚠️ Clerk API failed, using mock data');
                    yield RuleEngine_1.RuleEngine.analyze(connection.userId, connection._id, 'clerk', { plan: 'free' });
                    return;
                }
                // Get total count from header
                const totalUsers = parseInt(usersRes.headers.get('x-total-count') || '0');
                // Get organization count
                const orgsRes = yield fetch('https://api.clerk.com/v1/organizations?limit=1', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const totalOrgs = orgsRes.ok ? parseInt(orgsRes.headers.get('x-total-count') || '0') : 0;
                console.log('✅ Clerk: Found', totalUsers, 'users,', totalOrgs, 'organizations');
                // Determine plan based on user count
                let plan = 'free';
                if (totalUsers > 10000)
                    plan = 'enterprise';
                else if (totalUsers > 1000)
                    plan = 'pro';
                else if (totalUsers > 100)
                    plan = 'hobby';
                const user = yield User_1.User.findById(connection.userId);
                const userTier = (user === null || user === void 0 ? void 0 : user.subscriptionStatus) || 'free';
                yield RuleEngine_1.RuleEngine.analyze(connection.userId, connection._id, 'clerk', {
                    plan,
                    userCount: totalUsers,
                    orgCount: totalOrgs
                }, userTier);
            }
            catch (error) {
                console.error('Clerk scan error:', error);
                yield RuleEngine_1.RuleEngine.analyze(connection.userId, connection._id, 'clerk', { plan: 'free' });
            }
        });
    }
}
exports.ClerkIntegration = ClerkIntegration;
class StripeIntegration {
    scan(connection) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            console.log('\n💳 Starting Stripe scan...');
            const { decryptToken } = yield Promise.resolve().then(() => __importStar(require('../utils/encryption')));
            try {
                const token = decryptToken(connection.encryptedToken);
                // Get account info
                const accountRes = yield fetch('https://api.stripe.com/v1/account', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!accountRes.ok) {
                    console.log('⚠️ Stripe API failed, using mock data');
                    yield RuleEngine_1.RuleEngine.analyze(connection.userId, connection._id, 'stripe', { plan: 'starter' });
                    return;
                }
                const account = yield accountRes.json();
                // Get recent charges to estimate activity
                const chargesRes = yield fetch('https://api.stripe.com/v1/charges?limit=10', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const chargesData = chargesRes.ok ? yield chargesRes.json() : { data: [] };
                const charges = chargesData.data || [];
                // Get subscriptions count
                const subsRes = yield fetch('https://api.stripe.com/v1/subscriptions?limit=1', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const totalSubs = ((_a = subsRes.headers) === null || _a === void 0 ? void 0 : _a.get('x-total-count')) || charges.length;
                console.log('✅ Stripe: Account', account.id, ', recent charges:', charges.length);
                const user = yield User_1.User.findById(connection.userId);
                const userTier = (user === null || user === void 0 ? void 0 : user.subscriptionStatus) || 'free';
                yield RuleEngine_1.RuleEngine.analyze(connection.userId, connection._id, 'stripe', {
                    plan: account.type || 'standard',
                    accountId: account.id,
                    businessName: (_b = account.business_profile) === null || _b === void 0 ? void 0 : _b.name,
                    chargesVolume: charges.length,
                    subscriptionCount: totalSubs,
                    country: account.country
                }, userTier);
            }
            catch (error) {
                console.error('Stripe scan error:', error);
                yield RuleEngine_1.RuleEngine.analyze(connection.userId, connection._id, 'stripe', { plan: 'starter' });
            }
        });
    }
}
exports.StripeIntegration = StripeIntegration;
// Factory to get integration instance
const getIntegration = (provider) => {
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
exports.getIntegration = getIntegration;
