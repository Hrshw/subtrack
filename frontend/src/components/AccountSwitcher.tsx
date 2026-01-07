import { useState } from 'react';
import { ChevronDown, Check, Building2, Server, Layers } from 'lucide-react';
import { Button } from './ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface Connection {
    id: string;
    provider: string;
    accountLabel?: string;
    isDefault?: boolean;
    environment?: 'production' | 'staging' | 'development' | 'other';
}

interface AccountSwitcherProps {
    connections: Connection[];
    selectedConnectionId: string | null; // null = all accounts
    onSelect: (connectionId: string | null) => void;
}

const envIcons: Record<string, React.ComponentType<any>> = {
    production: Server,
    staging: Layers,
    development: Building2,
    other: Building2
};

export function AccountSwitcher({ connections, selectedConnectionId, onSelect }: AccountSwitcherProps) {
    const [open, setOpen] = useState(false);

    const selectedConnection = selectedConnectionId
        ? connections.find(c => c.id === selectedConnectionId)
        : null;

    const getDisplayName = (conn: Connection | null) => {
        if (!conn) return 'All Accounts';
        return conn.accountLabel || `${conn.provider.charAt(0).toUpperCase()}${conn.provider.slice(1)} Account`;
    };

    // Group connections by provider
    const groupedConnections = connections.reduce((acc, conn) => {
        if (!acc[conn.provider]) acc[conn.provider] = [];
        acc[conn.provider].push(conn);
        return acc;
    }, {} as Record<string, Connection[]>);

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    className="min-w-[200px] justify-between border-white/10 bg-white/5 hover:bg-white/10 text-white"
                >
                    <div className="flex items-center gap-2">
                        {selectedConnection ? (
                            <>
                                {(() => {
                                    const EnvIcon = envIcons[selectedConnection.environment || 'other'];
                                    return <EnvIcon className="w-4 h-4" />;
                                })()}
                                <span className="truncate max-w-[150px]">{getDisplayName(selectedConnection)}</span>
                            </>
                        ) : (
                            <>
                                <Layers className="w-4 h-4 text-emerald-400" />
                                <span>All Accounts</span>
                            </>
                        )}
                    </div>
                    <ChevronDown className="w-4 h-4 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="start"
                className="w-[250px] bg-slate-900 border-white/10 text-white"
            >
                {/* All Accounts Option */}
                <DropdownMenuItem
                    onClick={() => { onSelect(null); setOpen(false); }}
                    className="flex items-center justify-between hover:bg-white/10 cursor-pointer"
                >
                    <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-emerald-400" />
                        <span>All Accounts</span>
                    </div>
                    {selectedConnectionId === null && <Check className="w-4 h-4 text-emerald-400" />}
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-white/10" />

                {/* Grouped by Provider */}
                {Object.entries(groupedConnections).map(([provider, conns]) => (
                    <div key={provider}>
                        <div className="px-2 py-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            {provider}
                        </div>
                        {conns.map(conn => {
                            const EnvIcon = envIcons[conn.environment || 'other'];
                            return (
                                <DropdownMenuItem
                                    key={conn.id}
                                    onClick={() => { onSelect(conn.id); setOpen(false); }}
                                    className="flex items-center justify-between hover:bg-white/10 cursor-pointer ml-2"
                                >
                                    <div className="flex items-center gap-2">
                                        <EnvIcon className="w-4 h-4" />
                                        <span className="truncate max-w-[140px]">{getDisplayName(conn)}</span>
                                        {conn.isDefault && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                                Default
                                            </span>
                                        )}
                                    </div>
                                    {selectedConnectionId === conn.id && <Check className="w-4 h-4 text-emerald-400" />}
                                </DropdownMenuItem>
                            );
                        })}
                    </div>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
