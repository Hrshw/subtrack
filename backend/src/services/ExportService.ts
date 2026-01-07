import { ScanResult } from '../models/ScanResult';
import { Connection } from '../models/Connection';

export class ExportService {
    /**
     * Generate professional CSV data for user's scan results
     */
    static async generateCSV(userId: string): Promise<string> {
        // Get all scan results with connection info
        const scanResults = await ScanResult.find({ userId })
            .populate('connectionId')
            .sort({ createdAt: -1 });

        const summary = await this.generateSummary(userId);

        // Professional CSV Header with Executive Summary
        const output = [];
        output.push('--- EXECUTIVE SUMMARY ---');
        output.push(`Exported At,${new Date().toLocaleString()}`);
        output.push(`Total Resources Scanned,${summary.totalResources}`);
        output.push(`Active Resources,${summary.activeResources}`);
        output.push(`Optimization Opportunities,${summary.zombieResources}`);
        output.push(`Total Monthly Potential Savings,₹${summary.totalSavings.toLocaleString()}`);
        output.push('');
        output.push('--- DETAILED FINDINGS ---');

        const headers = [
            'Provider',
            'Account Label',
            'Resource Name',
            'Resource Type',
            'Status',
            'Monthly Savings (₹)',
            'Region',
            'Recommendation/Reason',
            'Detected At'
        ];
        output.push(headers.join(','));

        // Helper to escape CSV fields
        const escape = (val: any) => {
            if (val === null || val === undefined) return '';
            let str = String(val).replace(/"/g, '""');
            if (str.includes(',') || str.includes('\n') || str.includes('"')) {
                return `"${str}"`;
            }
            return str;
        };

        // CSV Rows
        for (const result of scanResults) {
            const conn = result.connectionId as any;
            const provider = conn?.provider || 'Unknown';
            const label = result.accountLabel || conn?.accountLabel || 'Default';
            // Extract region from rawData if available
            const region = result.rawData?.region || 'global';

            const row = [
                escape(provider.toUpperCase()),
                escape(label),
                escape(result.resourceName),
                escape(result.resourceType),
                escape(result.status.toUpperCase()),
                result.potentialSavings || 0,
                escape(region),
                escape(result.reason),
                result.detectedAt ? result.detectedAt.toISOString().split('T')[0] : ''
            ];
            output.push(row.join(','));
        }

        return output.join('\n');
    }

    /**
     * Generate summary stats for export
     */
    static async generateSummary(userId: string) {
        const scanResults = await ScanResult.find({ userId });

        const zombies = scanResults.filter(r =>
            r.status === 'zombie' || r.status === 'unused' || r.status === 'downgrade_possible'
        );
        const active = scanResults.filter(r => r.status === 'active');
        const totalSavings = zombies.reduce((sum, z) => sum + (z.potentialSavings || 0), 0);

        // Group by service
        const byService = scanResults.reduce((acc, r) => {
            const conn = r.connectionId as any;
            const service = conn?.serviceType || 'Unknown';
            if (!acc[service]) {
                acc[service] = { total: 0, zombies: 0, savings: 0 };
            }
            acc[service].total++;
            if (r.status !== 'active') {
                acc[service].zombies++;
                acc[service].savings += r.potentialSavings || 0;
            }
            return acc;
        }, {} as Record<string, { total: number; zombies: number; savings: number }>);

        return {
            totalResources: scanResults.length,
            activeResources: active.length,
            zombieResources: zombies.length,
            totalSavings,
            byService,
            exportedAt: new Date().toISOString()
        };
    }
}
