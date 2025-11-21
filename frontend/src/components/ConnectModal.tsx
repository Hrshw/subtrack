import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { getApiUrl } from '../lib/api';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import { AlertCircle, CheckCircle2, ExternalLink, Key } from 'lucide-react';

interface ConnectModalProps {
    isOpen: boolean;
    onClose: () => void;
    provider: string;
    onConnected: () => void;
}

const ConnectModal: React.FC<ConnectModalProps> = ({ isOpen, onClose, provider, onConnected }) => {
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const { getToken } = useAuth();

    const handleConnect = async () => {
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
                    help: 'Settings → Developer settings → Personal access tokens (Tokens (classic)). Scopes: repo, read:org, read:user.',
                    link: 'https://github.com/settings/tokens'
                };
            case 'vercel':
                return {
                    label: 'Access Token',
                    placeholder: 'Enter your Vercel token...',
                    help: 'Account Settings → Tokens. Create a token with "Read Only" scope.',
                    link: 'https://vercel.com/account/tokens'
                };
            case 'aws':
                return {
                    label: 'Access Key ID & Secret Access Key',
                    placeholder: '{"accessKeyId": "AKIA...", "secretAccessKey": "..."}',
                    help: 'Create an IAM user with ReadOnlyAccess. Paste as JSON: {"accessKeyId": "...", "secretAccessKey": "..."}',
                    link: 'https://console.aws.amazon.com/iam/home#/users'
                };
            case 'sentry':
                return {
                    label: 'Auth Token',
                    placeholder: 'Enter your Sentry token...',
                    help: 'Settings → Auth Tokens. Scopes: project:read, org:read.',
                    link: 'https://sentry.io/settings/auth-tokens/'
                };
            case 'linear':
                return {
                    label: 'API Key',
                    placeholder: 'lin_api_...',
                    help: 'Settings → API. Create a new Personal API Key.',
                    link: 'https://linear.app/settings/api'
                };
            case 'resend':
                return {
                    label: 'API Key',
                    placeholder: 're_...',
                    help: 'API Keys → Create API Key. Permission: Full Access or Sending Access.',
                    link: 'https://resend.com/api-keys'
                };
            case 'clerk':
                return {
                    label: 'Secret Key',
                    placeholder: 'sk_...',
                    help: 'Dashboard → API Keys → Secret keys.',
                    link: 'https://dashboard.clerk.com/'
                };
            case 'stripe':
                return {
                    label: 'Restricted Key',
                    placeholder: 'rk_...',
                    help: 'Developers → API keys → Create restricted key. Permissions: Read-only for Customers, Subscriptions, Invoices.',
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

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-800 text-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <div className="p-2 rounded-lg bg-slate-800">
                            <Key className="w-5 h-5 text-emerald-400" />
                        </div>
                        Connect {provider}
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Enter your API credentials to securely connect {provider}. We use bank-level encryption and only request read access.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
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
                    </div>

                    <Button
                        onClick={handleConnect}
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

                    <p className="text-xs text-center text-slate-500">
                        Your credentials are encrypted with AES-256 before storage.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ConnectModal;
