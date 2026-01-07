"use strict";
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
exports.ExportService = void 0;
const ScanResult_1 = require("../models/ScanResult");
class ExportService {
    /**
     * Generate professional CSV data for user's scan results
     */
    static generateCSV(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            // Get all scan results with connection info
            const scanResults = yield ScanResult_1.ScanResult.find({ userId })
                .populate('connectionId')
                .sort({ createdAt: -1 });
            const summary = yield this.generateSummary(userId);
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
            const escape = (val) => {
                if (val === null || val === undefined)
                    return '';
                let str = String(val).replace(/"/g, '""');
                if (str.includes(',') || str.includes('\n') || str.includes('"')) {
                    return `"${str}"`;
                }
                return str;
            };
            // CSV Rows
            for (const result of scanResults) {
                const conn = result.connectionId;
                const provider = (conn === null || conn === void 0 ? void 0 : conn.provider) || 'Unknown';
                const label = result.accountLabel || (conn === null || conn === void 0 ? void 0 : conn.accountLabel) || 'Default';
                // Extract region from rawData if available
                const region = ((_a = result.rawData) === null || _a === void 0 ? void 0 : _a.region) || 'global';
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
        });
    }
    /**
     * Generate summary stats for export
     */
    static generateSummary(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const scanResults = yield ScanResult_1.ScanResult.find({ userId });
            const zombies = scanResults.filter(r => r.status === 'zombie' || r.status === 'unused' || r.status === 'downgrade_possible');
            const active = scanResults.filter(r => r.status === 'active');
            const totalSavings = zombies.reduce((sum, z) => sum + (z.potentialSavings || 0), 0);
            // Group by service
            const byService = scanResults.reduce((acc, r) => {
                const conn = r.connectionId;
                const service = (conn === null || conn === void 0 ? void 0 : conn.serviceType) || 'Unknown';
                if (!acc[service]) {
                    acc[service] = { total: 0, zombies: 0, savings: 0 };
                }
                acc[service].total++;
                if (r.status !== 'active') {
                    acc[service].zombies++;
                    acc[service].savings += r.potentialSavings || 0;
                }
                return acc;
            }, {});
            return {
                totalResources: scanResults.length,
                activeResources: active.length,
                zombieResources: zombies.length,
                totalSavings,
                byService,
                exportedAt: new Date().toISOString()
            };
        });
    }
}
exports.ExportService = ExportService;
