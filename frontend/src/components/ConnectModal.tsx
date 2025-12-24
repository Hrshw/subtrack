import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { getApiUrl } from '../lib/api';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import { AlertCircle, CheckCircle2, ExternalLink, Key, Zap, Shield } from 'lucide-react';

interface ConnectModalProps {
    isOpen: boolean;
    onClose: () => void;
    provider: string;
    onConnected: () => void;
}

// Check if provider supports OAuth (moved outside to avoid dependency issues)
// Note: Sentry and Stripe are manual-only for now until OAuth apps are properly configured
const supportsOAuth = (p: string) => {
    return ['github', 'vercel', 'linear'].includes(p.toLowerCase());
};

const ConnectModal: React.FC<ConnectModalProps> = ({ isOpen, onClose, provider, onConnected }) => {
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    // Default to oauth if supported, otherwise manual
    const [activeTab, setActiveTab] = useState<string>(supportsOAuth(provider) ? 'oauth' : 'manual');
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
            // Reset token when modal opens
            setToken('');
        }
    }, [isOpen, provider]);

    // Handle OAuth connect
    const handleOAuthConnect = async () => {
        try {
            const authToken = await getToken();
            const apiUrl = getApiUrl();

            const response = await axios.get(`${apiUrl}/oauth/authorize-url`, {
                params: { provider: provider.toLowerCase() },
                headers: { Authorization: `Bearer ${authToken}` }
            });

            if (response.data.authUrl) {
                window.location.href = response.data.authUrl;
            }
        } catch (error: any) {
            console.error('OAuth error:', error);
            alert(`OAuth not available: ${error.response?.data?.error || 'Please use manual connection'}`);
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
                metadata: { type: 'manual' }
            }, {
                headers: { Authorization: `Bearer ${authToken}` }
            });

            onConnected();
            onClose();
            setToken('');
        } catch (error) {
            console.error('Failed to connect:', error);
            alert('Failed to connect. Please check your API key and try again.');
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
                    help: 'Go to Settings → Developer settings → Personal access tokens (classic). Required scopes: repo, read:org, read:user',
                    link: 'https://github.com/settings/tokens'
                };
            case 'vercel':
                return {
                    label: 'Access Token',
                    placeholder: 'Enter Vercel token...',
                    help: 'Account Settings → Tokens. Create with Read scope.',
                    link: 'https://vercel.com/account/tokens'
                };
            case 'linear':
                return {
                    label: 'API Key',
                    placeholder: 'lin_api_...',
                    help: 'Settings → API → Create Personal API Key',
                    link: 'https://linear.app/settings/api'
                };
            case 'aws':
                return {
                    label: 'AWS Credentials (JSON Format)',
                    placeholder: '{"access KeyId": "AKIA...", "secretAccessKey": "...", "region": "us-east-1"}',
                    help: '⚠️ MUST be valid JSON! IAM Console → Create User → ReadOnlyAccess policy. Include region!',
                    link: 'https://console.aws.amazon.com/iam/'
                };
            case 'sentry':
                return {
                    label: 'Auth Token',
                    placeholder: 'sntrys_...',
                    help: 'Settings → Auth Tokens. Scopes: project:read, org:read',
                    link: 'https://sentry.io/settings/auth-tokens/'
                };
            case 'resend':
                return {
                    label: 'API Key',
                    placeholder: 're_...',
                    help: 'API Keys → Create API Key',
                    link: 'https://resend.com/api-keys'
                };
            case 'clerk':
                return {
                    label: 'Secret Key',
                    placeholder: 'sk_...',
                    help: 'Dashboard → API Keys → Secret keys',
                    link: 'https://dashboard.clerk.com/'
                };
            case 'stripe':
                return {
                    label: 'Restricted Key',
                    placeholder: 'rk_...',
                    help: 'Developers → API keys → Create restricted key (read-only)',
                    link: 'https://dashboard.stripe.com/apikeys'
                };
            default:
                return {
                    label: 'API Token',
                    placeholder: 'Paste your token...',
                    help: 'Enter the API token for this service.',
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
                                <div className="space-y-2">
                                    <Label htmlFor="token" className="text-sm font-medium text-slate-200">
                                        {instructions.label}
                                    </Label>
                                    <Input
                                        id="token"
                                        type="password"
                                        value={token}
                                        onChange={(e) => setToken(e.target.value)}
                                        placeholder={instructions.placeholder}
                                        className="font-mono text-sm bg-slate-950 border-slate-800 focus:border-emerald-500 focus:ring-emerald-500/20"
                                    />
                                </div>

                                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-800">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                                        <div className="space-y-2">
                                            <p className="text-sm text-slate-300">
                                                {instructions.help}
                                            </p>
                                            {instructions.link && (
                                                <a
                                                    href={instructions.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center text-xs text-emerald-400 hover:text-emerald-300 hover:underline"
                                                >
                                                    Open {provider} Settings <ExternalLink className="w-3 h-3 ml-1" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
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
                            </TabsContent>
                        </Tabs>
                    ) : (
                        // Manual only (no OAuth)
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="token" className="text-sm font-medium text-slate-200">
                                    {instructions.label}
                                </Label>
                                <Input
                                    id="token"
                                    type="password"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    placeholder={instructions.placeholder}
                                    className="font-mono text-sm bg-slate-950 border-slate-800 focus:border-emerald-500 focus:ring-emerald-500/20"
                                />
                            </div>

                            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-800">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-300">
                                            {instructions.help}
                                        </p>
                                        {instructions.link && (
                                            <a
                                                href={instructions.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center text-xs text-emerald-400 hover:text-emerald-300 hover:underline"
                                            >
                                                Open {provider} Settings <ExternalLink className="w-3 h-3 ml-1" />
                                            </a>
                                        )}
                                    </div>
                                </div>
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
