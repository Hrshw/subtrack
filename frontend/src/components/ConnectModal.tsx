import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { getApiUrl } from '../lib/api';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';

interface ConnectModalProps {
    isOpen: boolean;
    onClose: () => void;
    provider: string;
    onConnected: () => void;
}

const ConnectModal: React.FC<ConnectModalProps> = ({ isOpen, onClose, provider, onConnected }) => {
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const { getToken } = useAuth();

    const handleConnect = async (customToken?: string) => {
        setLoading(true);
        try {
            const authToken = await getToken();

            // For real API testing, require manual token entry
            if (!customToken) {
                alert('⚠️ Real OAuth not implemented yet!\n\nTo test with REAL API data:\n1. Click "Enter Token Manually"\n2. Paste your real OAuth token\n3. Connect');
                setLoading(false);
                setShowAdvanced(true);
                return;
            }

            const apiUrl = getApiUrl();
            await axios.post(`${apiUrl}/connections`, {
                provider: provider.toLowerCase(),
                token: customToken, // Real token provided by user
                metadata: { type: 'manual' }
            }, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            onConnected();
            onClose();
            setToken(''); // Clear for next use
        } catch (error) {
            console.error('Failed to connect:', error);
            alert('Failed to connect. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const renderContent = () => {
        const p = provider.toLowerCase();

        if (p === 'aws') {
            return (
                <div className="grid gap-4 py-4">
                    <div className="bg-blue-50 p-4 rounded-md text-sm text-blue-800 mb-2">
                        Recommended: Use our CloudFormation template to create a secure, read-only role.
                    </div>
                    <Button className="w-full" variant="outline" onClick={() => window.open('#', '_blank')}>
                        🚀 Launch CloudFormation Stack
                    </Button>

                    <div className="text-center text-xs text-muted-foreground my-2">- OR -</div>

                    <div className="text-sm font-medium cursor-pointer text-blue-600 hover:underline text-center" onClick={() => setShowAdvanced(!showAdvanced)}>
                        {showAdvanced ? 'Hide Advanced' : 'Enter Access Keys (Advanced)'}
                    </div>

                    {showAdvanced && (
                        <div className="grid gap-2 animate-in fade-in slide-in-from-top-2">
                            <Label htmlFor="token">Access Key ID & Secret</Label>
                            <Input
                                id="token"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                placeholder="AKIA..."
                            />
                            <Button onClick={() => handleConnect(token)} disabled={loading || !token}>
                                {loading ? 'Connecting...' : 'Connect Manually'}
                            </Button>
                        </div>
                    )}
                </div>
            );
        }

        if (p === 'resend') {
            return (
                <div className="grid gap-4 py-4">
                    <p className="text-sm text-muted-foreground">
                        Connect your Resend account to analyze email usage.
                    </p>
                    <Button onClick={() => handleConnect()} disabled={loading} className="w-full bg-black text-white hover:bg-gray-800">
                        {loading ? 'Connecting...' : 'Authorize with Resend'}
                    </Button>

                    <div className="text-center text-xs text-muted-foreground my-2">- OR -</div>

                    <div className="text-sm font-medium cursor-pointer text-blue-600 hover:underline text-center" onClick={() => setShowAdvanced(!showAdvanced)}>
                        {showAdvanced ? 'Hide Advanced' : 'Enter API Key'}
                    </div>

                    {showAdvanced && (
                        <div className="grid gap-2">
                            <Label htmlFor="token">API Key</Label>
                            <Input
                                id="token"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                placeholder="re_..."
                            />
                            <Button onClick={() => handleConnect(token)} disabled={loading || !token}>
                                {loading ? 'Connecting...' : 'Connect Manually'}
                            </Button>
                        </div>
                    )}
                </div>
            );
        }

        // GitHub, Vercel, etc. - Show manual token entry prominently
        return (
            <div className="grid gap-4 py-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
                    <p className="font-semibold text-yellow-800 mb-2">⚠️ OAuth Flow Not Implemented</p>
                    <p className="text-yellow-700 text-xs">
                        Full OAuth is planned for production. For now, enter your token manually to test with REAL API data.
                    </p>
                </div>

                <div className="space-y-3">
                    <div>
                        <Label htmlFor="token" className="text-sm font-medium">
                            {p === 'github' && '🔑 GitHub Personal Access Token'}
                            {p === 'vercel' && '🔑 Vercel Access Token'}
                            {p === 'sentry' && '🔑 Sentry Auth Token'}
                            {p === 'linear' && '🔑 Linear API Key'}
                            {!['github', 'vercel', 'sentry', 'linear'].includes(p) && `🔑 ${provider} Token`}
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1 mb-2">
                            {p === 'github' && 'Get it from: Settings → Developer → Personal Access Tokens'}
                            {p === 'vercel' && 'Get it from: Account Settings → Tokens'}
                            {p === 'sentry' && 'Get it from: Settings → Auth Tokens'}
                            {p === 'linear' && 'Get it from: Settings → API'}
                        </p>
                        <Input
                            id="token"
                            type="password"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            placeholder={
                                p === 'github' ? 'ghp_...' :
                                    p === 'vercel' ? 'Vercel token...' :
                                        p === 'sentry' ? 'Sentry token...' :
                                            'Paste your token...'
                            }
                            className="font-mono text-sm"
                        />
                    </div>

                    <Button
                        onClick={() => handleConnect(token)}
                        disabled={loading || !token}
                        className="w-full"
                    >
                        {loading ? 'Connecting...' : `Connect ${provider} with Real Token`}
                    </Button>

                    <div className="text-xs text-center text-muted-foreground">
                        Token is encrypted and stored securely in your database
                    </div>
                </div>
            </div>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Connect {provider}</DialogTitle>
                    <DialogDescription>
                        Securely connect your {provider} account to scan for savings.
                    </DialogDescription>
                </DialogHeader>
                {renderContent()}
            </DialogContent>
        </Dialog>
    );
};

export default ConnectModal;
