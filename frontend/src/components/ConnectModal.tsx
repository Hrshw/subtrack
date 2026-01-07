import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';
import { getApiUrl } from '../lib/api';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import { CheckCircle2, ExternalLink, Key, Zap, Shield, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface ConnectModalProps {
    isOpen: boolean;
    onClose: () => void;
    provider: string;
    subscriptionStatus?: 'free' | 'pro' | 'hobby' | string;
    onConnected: () => void;
}

// Check if provider supports OAuth (moved outside to avoid dependency issues)
// Note: Sentry and Stripe are manual-only for now until OAuth apps are properly configured
const supportsOAuth = (p: string) => {
    return ['github', 'vercel', 'linear'].includes(p.toLowerCase());
};

const ConnectModal: React.FC<ConnectModalProps> = ({ isOpen, onClose, provider, subscriptionStatus, onConnected }) => {
    const [token, setToken] = useState('');
    const [label, setLabel] = useState('');
    const [loading, setLoading] = useState(false);
    // Default to oauth if supported, otherwise manual
    const [activeTab, setActiveTab] = useState<string>(supportsOAuth(provider) ? 'oauth' : 'manual');
    const [showInstructions, setShowInstructions] = useState(false);
    const { getToken } = useAuth();

    // Reset to OAuth tab (Auto Connect) when modal opens or provider changes
    useEffect(() => {
        if (isOpen && provider) {
            // Always prioritize OAuth (Auto Connect) if supported
            if (supportsOAuth(provider)) {
                setActiveTab('oauth');
            } else {
                setActiveTab('manual');
            }
            // Reset state when modal opens
            setToken('');
            setLabel('');
        }
    }, [isOpen, provider]);

    // Handle OAuth connect
    const handleOAuthConnect = async () => {
        try {
            const authToken = await getToken();
            const apiUrl = getApiUrl();

            const response = await axios.get(`${apiUrl}/oauth/authorize-url`, {
                params: {
                    provider: provider.toLowerCase(),
                    label: label || undefined
                },
                headers: { Authorization: `Bearer ${authToken}` }
            });

            if (response.data.authUrl) {
                window.location.href = response.data.authUrl;
            }
        } catch (error: any) {
            console.error('OAuth error:', error);
            toast.error(`OAuth not available: ${error.response?.data?.error || 'Please use manual connection'}`);
            setActiveTab('manual');
        }
    };

    // Handle manual connect
    const handleManualConnect = async () => {
        if (!token) return;

        setLoading(true);
        try {
            const authToken = await getToken();
            const apiUrl = getApiUrl();

            await axios.post(`${apiUrl}/connections`, {
                provider: provider.toLowerCase(),
                token: token,
                accountLabel: label || undefined,
                metadata: { type: 'manual' }
            }, {
                headers: { Authorization: `Bearer ${authToken}` }
            });

            onConnected();
            onClose();
            setToken('');
            setLabel('');
        } catch (error) {
            console.error('Failed to connect:', error);
            toast.error('Failed to connect. Please check your API key and try again.');
        } finally {
            setLoading(false);
        }
    };


    const getProviderInstructions = (p: string) => {
        switch (p.toLowerCase()) {
            case 'github':
                return {
                    label: 'Personal Access Token',
                    placeholder: 'ghp_...',
                    help: 'We recommend using a Classic Token for broader read-only access.',
                    steps: [
                        'Go to GitHub Settings > Developer Settings.',
                        'Select Personal access tokens > Tokens (classic).',
                        'Generate new token with "repo", "read:org", and "read:user" scopes.',
                        'Copy the token and paste it here.'
                    ],
                    link: 'https://github.com/settings/tokens'
                };
            case 'vercel':
                return {
                    label: 'Access Token',
                    placeholder: '...',
                    help: 'Use an account-level token to scan all projects.',
                    steps: [
                        'Go to Vercel Account Settings > Tokens.',
                        'Click "Create", name it "SubTrack".',
                        'Select "Full Access" or ensure it has read access to projects.',
                        'Copy and paste here.'
                    ],
                    link: 'https://vercel.com/account/tokens'
                };
            case 'linear':
                return {
                    label: 'Personal API Key',
                    placeholder: 'lin_api_...',
                    steps: [
                        'Go to Linear Settings > API.',
                        'Input a name like "SubTrack" in Personal API Keys.',
                        'Click "Create API Key".',
                        'Copy the key immediately.'
                    ],
                    link: 'https://linear.app/settings/api'
                };
            case 'aws':
                return {
                    label: 'AWS Credentials (JSON)',
                    placeholder: '{"accessKeyId": "...", "secretAccessKey": "...", "region": "..."}',
                    template: '{\n  "accessKeyId": "YOUR_ACCESS_KEY",\n  "secretAccessKey": "YOUR_SECRET_KEY",\n  "region": "us-east-1"\n}',
                    help: 'For security, use an IAM user with only Read-Only permissions.',
                    steps: [
                        'Go to AWS IAM Console > Users > Create User.',
                        'Attach "ReadOnlyAccess" managed policy.',
                        'Add Inline Policy for billing: ce:GetCostAndUsage (JSON below).',
                        'Create "Access Key" (CLI/API type) and paste the JSON here.'
                    ],
                    policy: {
                        Version: "2012-10-17",
                        Statement: [
                            {
                                Effect: "Allow",
                                Action: ["ce:GetCostAndUsage"],
                                Resource: "*"
                            }
                        ]
                    },
                    link: 'https://console.aws.amazon.com/iam/'
                };
            case 'sentry':
                return {
                    label: 'Auth Token',
                    placeholder: 'sntrys_...',
                    steps: [
                        'Go to Sentry Settings > Auth Tokens.',
                        'Click "Create New Token".',
                        'Tick "project:read" and "org:read".',
                        'Copy and paste the token.'
                    ],
                    link: 'https://sentry.io/settings/auth-tokens/'
                };
            case 'resend':
                return {
                    label: 'API Key',
                    placeholder: 're_...',
                    steps: [
                        'Login to Resend Dashboard > API Keys.',
                        'Click "Create API Key".',
                        'Select "Read-only" if available or standard API key.',
                        'Copy and paste here.'
                    ],
                    link: 'https://resend.com/api-keys'
                };
            case 'clerk':
                return {
                    label: 'Secret Key',
                    placeholder: 'sk_live_... or sk_test_...',
                    steps: [
                        'Go to Clerk Dashboard > API Keys.',
                        'Ensure you are in the correct Environment (Production/Staging).',
                        'Copy the "Secret Key" (starts with sk_live_ or sk_test_).'
                    ],
                    link: 'https://dashboard.clerk.com/'
                };
            case 'stripe':
                return {
                    label: 'Restricted Key',
                    placeholder: 'rk_live_... or rk_test_...',
                    help: 'We recommend a Restricted Key over a Secret Key for better security.',
                    steps: [
                        'Go to Stripe Dashboard > Developers > API Keys.',
                        'Click "Create restricted key".',
                        'Give Read-only access to "All resources".',
                        'Generate and copy the key (starts with rk_live_ or rk_test_).'
                    ],
                    link: 'https://dashboard.stripe.com/apikeys'
                };
            case 'openai':
                return {
                    label: 'API Key',
                    placeholder: 'sk-proj-... or sk-...',
                    help: 'Track token usage and optimize model costs.',
                    steps: [
                        'Go to OpenAI Platform > Dashboard > API Keys.',
                        'Create a new "Standard Secret Key" (recommended for cost tracking).',
                        'Note: Project-restricted keys often hide the "Usage" permission. If you don\'t see a "Usage" row to set to "Read", you must use a Standard Key.',
                        'Paste your key (starts with sk-) below.'
                    ],
                    link: 'https://platform.openai.com/api-keys'
                };
            case 'digitalocean':
                return {
                    label: 'Personal Access Token',
                    placeholder: 'dop_v1_...',
                    help: 'SubTrack scans for stopped droplets and unused resources.',
                    steps: [
                        'Go to DigitalOcean > API > Tokens.',
                        'Click "Generate New Token".',
                        'Name it "SubTrack" and select "Read" scope.',
                        'Copy the token (starts with dop_v1_).'
                    ],
                    link: 'https://cloud.digitalocean.com/account/api/tokens'
                };
            case 'supabase':
                return {
                    label: 'Personal Access Token',
                    placeholder: 'sbp_...',
                    help: 'SubTrack monitors your Supabase projects for paused/unused resources via the Management API.',
                    steps: [
                        'Go to supabase.com/dashboard > Click your profile icon (top right).',
                        'Select "Account Preferences" > "Access Tokens".',
                        'Click "Generate new token", name it "SubTrack".',
                        'Copy the token immediately (it won\'t be shown again).'
                    ],
                    link: 'https://supabase.com/dashboard/account/tokens'
                };
            case 'notion':
                return {
                    label: 'Internal Integration Token',
                    placeholder: 'secret_...',
                    help: 'SubTrack analyzes workspace usage and member activity.',
                    steps: [
                        'Go to notion.so/my-integrations or Notion > Settings > Connections > "Develop/manage integrations".',
                        'Click "+ New integration" and name it "SubTrack".',
                        'Select your workspace, set Type to "Internal".',
                        'Under Secrets, click "Show" then "Copy" the Internal Integration Token.'
                    ],
                    link: 'https://www.notion.so/my-integrations'
                };
            case 'gcp':
                return {
                    label: 'GCP Service Account JSON',
                    placeholder: '{"type": "service_account", "project_id": "...", ...}',
                    template: '{\n  "type": "service_account",\n  "project_id": "YOUR_PROJECT_ID",\n  "private_key_id": "YOUR_KEY_ID",\n  "private_key": "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n",\n  "client_email": "subtrack@YOUR_PROJECT.iam.gserviceaccount.com",\n  "client_id": "YOUR_CLIENT_ID"\n}',
                    help: 'SubTrack scans Compute Engine, Cloud SQL, and storage for idle resources.',
                    steps: [
                        'Go to GCP Console > IAM & Admin > Service Accounts.',
                        'Create a new Service Account named "SubTrack".',
                        'Grant "Viewer" role to the service account.',
                        'Click the service account > Keys > Add Key > Create new key (JSON).',
                        'Paste the downloaded JSON contents here.'
                    ],
                    link: 'https://console.cloud.google.com/iam-admin/serviceaccounts'
                };
            case 'azure':
                return {
                    label: 'Azure Service Principal JSON',
                    placeholder: '{"tenantId": "...", "clientId": "...", "clientSecret": "...", "subscriptionId": "..."}',
                    template: '{\n  "tenantId": "YOUR_TENANT_ID",\n  "clientId": "YOUR_CLIENT_ID",\n  "clientSecret": "YOUR_CLIENT_SECRET",\n  "subscriptionId": "YOUR_SUBSCRIPTION_ID"\n}',
                    help: 'SubTrack scans Virtual Machines, Disks, and SQL for idle resources.',
                    steps: [
                        'Go to Azure Portal > Azure Active Directory > App registrations.',
                        'Create a new App registration named "SubTrack".',
                        'Go to Certificates & secrets > New client secret.',
                        'Assign "Reader" role at subscription level (Subscriptions > Access control).',
                        'Paste the Tenant ID, Client ID, Client Secret, and Subscription ID as JSON.'
                    ],
                    link: 'https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/RegisteredApps'
                };
            default:
                return {
                    label: 'API Token',
                    placeholder: 'Paste your token...',
                    steps: ['Locate the API token in your service settings.', 'Copy and paste it here.'],
                    link: ''
                };
        }
    };

    const instructions = getProviderInstructions(provider);
    const hasOAuth = supportsOAuth(provider);

    // Always render Dialog, control visibility with open prop
    return (
        <Dialog open={isOpen && !!provider} onOpenChange={(open) => {
            if (!open) {
                onClose();
            }
        }}>
            <DialogContent className="sm:max-w-[550px] bg-slate-900 border-slate-800 text-white z-[100]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <div className="p-2 rounded-lg bg-slate-800">
                            <Key className="w-5 h-5 text-emerald-400" />
                        </div>
                        Connect {provider}
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        {hasOAuth ? 'Choose auto-connect (OAuth) or manual API credentials.' : 'Enter your API credentials to connect.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {hasOAuth ? (
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 bg-slate-800">
                                <TabsTrigger
                                    value="oauth"
                                    className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white"
                                >
                                    <Zap className="w-4 h-4 mr-2" />
                                    Auto Connect
                                </TabsTrigger>
                                <TabsTrigger
                                    value="manual"
                                    className="data-[state=active]:bg-slate-700"
                                >
                                    <Key className="w-4 h-4 mr-2" />
                                    Manual
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="oauth" className="space-y-4 mt-4">
                                <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-lg p-6">
                                    <div className="flex items-start gap-3 mb-4">
                                        <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="font-semibold text-emerald-300 mb-1">Secure OAuth Connection</h4>
                                            <p className="text-sm text-slate-300">
                                                Connect in one click without sharing your password. Revoke anytime from {provider} settings.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="oauth-label" className="text-sm font-medium text-slate-200">
                                                Account Label (Optional)
                                            </Label>
                                            {subscriptionStatus !== 'pro' && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1 font-bold">
                                                    <Zap className="w-3 h-3" /> PRO FEATURE
                                                </span>
                                            )}
                                        </div>
                                        <Input
                                            id="oauth-label"
                                            value={label}
                                            onChange={(e) => setLabel(e.target.value)}
                                            placeholder="e.g. My Primary Workspace"
                                            className="bg-slate-950 border-slate-800 focus:border-emerald-500"
                                        />
                                        {subscriptionStatus !== 'pro' && (
                                            <p className="text-[10px] text-amber-400/60 mt-1 italic">Multiple accounts & labeling are exclusive to Pro users.</p>
                                        )}
                                    </div>

                                    <ul className="space-y-2 text-sm text-slate-300 mb-4">
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                            No password sharing
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                            Easy to revoke access
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                            One-click setup
                                        </li>
                                    </ul>

                                    <Button
                                        onClick={handleOAuthConnect}
                                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold shadow-lg shadow-emerald-500/20"
                                    >
                                        <Zap className="w-4 h-4 mr-2" />
                                        Connect with {provider}
                                    </Button>
                                </div>
                            </TabsContent>

                            <TabsContent value="manual" className="space-y-4 mt-4">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="manual-label" className="text-sm font-medium text-slate-200">
                                                Account Label (Optional)
                                            </Label>
                                            {subscriptionStatus !== 'pro' && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1 font-bold">
                                                    <Zap className="w-3 h-3" /> PRO FEATURE
                                                </span>
                                            )}
                                        </div>
                                        <Input
                                            id="manual-label"
                                            value={label}
                                            onChange={(e) => setLabel(e.target.value)}
                                            placeholder="e.g. Production Environment"
                                            className="bg-slate-950 border-slate-800 focus:border-emerald-500"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center mb-1">
                                            <Label htmlFor="token" className="text-sm font-medium text-slate-200">
                                                {instructions.label}
                                            </Label>
                                            {(instructions as any).template && (
                                                <button
                                                    onClick={() => setToken((instructions as any).template)}
                                                    className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 uppercase tracking-wider"
                                                >
                                                    Use Template
                                                </button>
                                            )}
                                        </div>
                                        {provider.toLowerCase() === 'aws' ? (
                                            <Textarea
                                                id="token"
                                                value={token}
                                                onChange={(e) => setToken(e.target.value)}
                                                placeholder={instructions.placeholder}
                                                className="font-mono text-sm bg-slate-950 border-slate-800 focus:border-emerald-500 focus:ring-emerald-500/20 min-h-[120px] resize-none"
                                            />
                                        ) : (
                                            <Input
                                                id="token"
                                                type="password"
                                                value={token}
                                                onChange={(e) => setToken(e.target.value)}
                                                placeholder={instructions.placeholder}
                                                className="font-mono text-sm bg-slate-950 border-slate-800 focus:border-emerald-500 focus:ring-emerald-500/20"
                                            />
                                        )}
                                    </div>

                                    <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
                                        <button
                                            onClick={() => setShowInstructions(!showInstructions)}
                                            className="w-full flex items-center justify-between p-4 bg-slate-800/80 hover:bg-slate-800 transition-colors text-sm font-medium"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Shield className="w-4 h-4 text-emerald-400" />
                                                Connection Guide
                                            </div>
                                            {showInstructions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        </button>

                                        {showInstructions && (
                                            <div className="p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                {instructions.help && (
                                                    <p className="text-xs text-slate-400 italic">
                                                        {instructions.help}
                                                    </p>
                                                )}

                                                <div className="space-y-3">
                                                    {instructions.steps?.map((step: string, idx: number) => (
                                                        <div key={idx} className="flex gap-3 text-sm">
                                                            <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] flex items-center justify-center font-bold">
                                                                {idx + 1}
                                                            </div>
                                                            <span className="text-slate-300">{step}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                {instructions.policy && (
                                                    <div className="mt-4 space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Required IAM Policy</span>
                                                            <button
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(JSON.stringify(instructions.policy, null, 2));
                                                                    toast.success('Policy copied to clipboard');
                                                                }}
                                                                className="text-emerald-400 hover:text-emerald-300 text-[10px] flex items-center gap-1"
                                                            >
                                                                <Copy className="w-3 h-3" /> Copy JSON
                                                            </button>
                                                        </div>
                                                        <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[10px] font-mono text-emerald-400/80 overflow-x-auto">
                                                            {JSON.stringify(instructions.policy, null, 2)}
                                                        </pre>
                                                    </div>
                                                )}

                                                {instructions.link && (
                                                    <a
                                                        href={instructions.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs flex items-center justify-center gap-2 transition-all mt-4 border border-emerald-500/20"
                                                    >
                                                        <ExternalLink className="w-3 h-3" />
                                                        Go to {provider} Settings
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <Button
                                        onClick={handleManualConnect}
                                        disabled={loading || !token}
                                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold shadow-lg shadow-emerald-500/20"
                                    >
                                        {loading ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Connecting...
                                            </div>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                                Connect {provider}
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </TabsContent>
                        </Tabs>
                    ) : (
                        // Manual only (no OAuth)
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="manual-only-label" className="text-sm font-medium text-slate-200">
                                        Account Label (Optional)
                                    </Label>
                                    {subscriptionStatus !== 'pro' && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1 font-bold">
                                            <Zap className="w-3 h-3" /> PRO FEATURE
                                        </span>
                                    )}
                                </div>
                                <Input
                                    id="manual-only-label"
                                    value={label}
                                    onChange={(e) => setLabel(e.target.value)}
                                    placeholder="e.g. My Workspace Name"
                                    className="bg-slate-950 border-slate-800 focus:border-emerald-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center mb-1">
                                    <Label htmlFor="token" className="text-sm font-medium text-slate-200">
                                        {instructions.label}
                                    </Label>
                                    {(instructions as any).template && (
                                        <button
                                            onClick={() => setToken((instructions as any).template)}
                                            className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 uppercase tracking-wider"
                                        >
                                            Use Template
                                        </button>
                                    )}
                                </div>
                                {provider.toLowerCase() === 'aws' ? (
                                    <Textarea
                                        id="token"
                                        value={token}
                                        onChange={(e) => setToken(e.target.value)}
                                        placeholder={instructions.placeholder}
                                        className="font-mono text-sm bg-slate-950 border-slate-800 focus:border-emerald-500 focus:ring-emerald-500/20 min-h-[120px] resize-none"
                                    />
                                ) : (
                                    <Input
                                        id="token"
                                        type="password"
                                        value={token}
                                        onChange={(e) => setToken(e.target.value)}
                                        placeholder={instructions.placeholder}
                                        className="font-mono text-sm bg-slate-950 border-slate-800 focus:border-emerald-500 focus:ring-emerald-500/20"
                                    />
                                )}
                            </div>

                            <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
                                <button
                                    onClick={() => setShowInstructions(!showInstructions)}
                                    className="w-full flex items-center justify-between p-4 bg-slate-800/80 hover:bg-slate-800 transition-colors text-sm font-medium"
                                >
                                    <div className="flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-emerald-400" />
                                        Connection Guide
                                    </div>
                                    {showInstructions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>

                                {showInstructions && (
                                    <div className="p-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                        {instructions.help && (
                                            <p className="text-xs text-slate-400 italic">
                                                {instructions.help}
                                            </p>
                                        )}

                                        <div className="space-y-3">
                                            {instructions.steps?.map((step: string, idx: number) => (
                                                <div key={idx} className="flex gap-3 text-sm">
                                                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] flex items-center justify-center font-bold">
                                                        {idx + 1}
                                                    </div>
                                                    <span className="text-slate-300">{step}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {instructions.policy && (
                                            <div className="mt-4 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Required IAM Policy</span>
                                                    <button
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(JSON.stringify(instructions.policy, null, 2));
                                                            toast.success('Policy copied to clipboard');
                                                        }}
                                                        className="text-emerald-400 hover:text-emerald-300 text-[10px] flex items-center gap-1"
                                                    >
                                                        <Copy className="w-3 h-3" /> Copy JSON
                                                    </button>
                                                </div>
                                                <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[10px] font-mono text-emerald-400/80 overflow-x-auto">
                                                    {JSON.stringify(instructions.policy, null, 2)}
                                                </pre>
                                            </div>
                                        )}

                                        {instructions.link && (
                                            <a
                                                href={instructions.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs flex items-center justify-center gap-2 transition-all mt-4 border border-emerald-500/20"
                                            >
                                                <ExternalLink className="w-3 h-3" />
                                                Go to {provider} Settings
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>

                            <Button
                                onClick={handleManualConnect}
                                disabled={loading || !token}
                                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold shadow-lg shadow-emerald-500/20"
                            >
                                {loading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Connecting...
                                    </div>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        Connect {provider}
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ConnectModal;
