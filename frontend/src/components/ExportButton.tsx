import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import { Button } from './ui/button';
import { FileSpreadsheet, Loader2 } from 'lucide-react';

import { getApiUrl } from '../lib/api';

export function ExportButton() {
    const { getToken } = useAuth();
    const [loading, setLoading] = useState(false);

    const handleExport = async () => {
        try {
            setLoading(true);
            const token = await getToken();

            const response = await axios.get(`${getApiUrl()}/analytics/export`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });

            // Create download link
            const blob = new Blob([response.data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `subtrack-export-${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={loading}
            className="border-slate-600 hover:bg-slate-700"
        >
            {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
                <FileSpreadsheet className="w-4 h-4 mr-2" />
            )}
            Export CSV
        </Button>
    );
}

export default ExportButton;
