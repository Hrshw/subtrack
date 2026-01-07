import React from 'react';
import { render } from '@react-email/render';
import { Resend } from 'resend';
import { ScanResult } from '../models/ScanResult';
import { User } from '../models/User';
import { SavingsHistory } from '../models/SavingsHistory';
import { SlackIntegration } from '../models/SlackIntegration';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

interface WeeklyPulseData {
    totalSavings: number;
    newZombies: number;
    topLeaks: Array<{ name: string; savings: number; reason: string }>;
    weeklyTrend: 'up' | 'down' | 'stable';
    trendPercent: number;
}

export class ReportService {
    /**
     * Generate weekly pulse data for a user
     */
    static async generateWeeklyPulse(userId: string): Promise<WeeklyPulseData> {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        // Get current zombies
        const zombies = await ScanResult.find({
            userId,
            status: { $in: ['zombie', 'unused', 'downgrade_possible'] }
        }).sort({ potentialSavings: -1 });

        const totalSavings = zombies.reduce((sum, z) => sum + (z.potentialSavings || 0), 0);

        // Get zombies detected this week
        const newZombies = zombies.filter(z =>
            z.detectedAt && new Date(z.detectedAt) >= weekAgo
        ).length;

        // Top 3 leaks
        const topLeaks = zombies.slice(0, 3).map(z => ({
            name: z.resourceName,
            savings: z.potentialSavings || 0,
            reason: z.reason || 'Unused resource'
        }));

        // Calculate trend from savings history
        const thisWeekHistory = await SavingsHistory.find({
            userId,
            date: { $gte: weekAgo, $lte: now }
        });

        const lastWeekHistory = await SavingsHistory.find({
            userId,
            date: { $gte: twoWeeksAgo, $lt: weekAgo }
        });

        const thisWeekAvg = thisWeekHistory.length > 0
            ? thisWeekHistory.reduce((sum, h) => sum + h.totalSavings, 0) / thisWeekHistory.length
            : totalSavings;

        const lastWeekAvg = lastWeekHistory.length > 0
            ? lastWeekHistory.reduce((sum, h) => sum + h.totalSavings, 0) / lastWeekHistory.length
            : thisWeekAvg;

        let weeklyTrend: 'up' | 'down' | 'stable' = 'stable';
        let trendPercent = 0;

        if (lastWeekAvg > 0) {
            const change = ((thisWeekAvg - lastWeekAvg) / lastWeekAvg) * 100;
            trendPercent = Math.abs(Math.round(change));
            if (change > 5) weeklyTrend = 'up';
            else if (change < -5) weeklyTrend = 'down';
        }

        return {
            totalSavings,
            newZombies,
            topLeaks,
            weeklyTrend,
            trendPercent
        };
    }

    /**
     * Generate AI summary for weekly report
     */
    static async generateAISummary(pulseData: WeeklyPulseData): Promise<string> {
        if (!OPENROUTER_API_KEY) {
            return this.getFallbackSummary(pulseData);
        }

        try {
            const prompt = `You are a friendly finance assistant for developers. Generate a 2-3 sentence weekly savings summary.

Data:
- Total potential savings: ₹${pulseData.totalSavings.toLocaleString('en-IN')}
- New issues found this week: ${pulseData.newZombies}
- Top leak: ${pulseData.topLeaks[0]?.name || 'None'} (₹${pulseData.topLeaks[0]?.savings || 0})
- Trend: ${pulseData.weeklyTrend === 'up' ? 'Savings opportunities increased' : pulseData.weeklyTrend === 'down' ? 'Good progress made' : 'Stable'}

Be encouraging and use casual Indian-English (yaar, bro). Keep it brief and actionable.`;

            const response = await fetch(OPENROUTER_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://subtrack.pulseguard.in',
                    'X-Title': 'SubTrack',
                },
                body: JSON.stringify({
                    model: 'deepseek/deepseek-r1t2-chimera:free',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.8,
                    max_tokens: 100,
                })
            });

            if (response.ok) {
                const data = await response.json();
                return data.choices?.[0]?.message?.content?.trim() || this.getFallbackSummary(pulseData);
            }
        } catch (error) {
            console.error('AI summary generation failed:', error);
        }

        return this.getFallbackSummary(pulseData);
    }

    /**
     * Fallback summary without AI
     */
    private static getFallbackSummary(pulseData: WeeklyPulseData): string {
        if (pulseData.totalSavings === 0) {
            return "Your cloud stack is looking clean! No zombie subscriptions detected. 🎉";
        }

        return `You could save ₹${pulseData.totalSavings.toLocaleString('en-IN')}/month by cleaning up ${pulseData.newZombies > 0 ? pulseData.newZombies + ' new issues' : 'unused resources'}. Top target: ${pulseData.topLeaks[0]?.name || 'Check dashboard'}.`;
    }

    /**
     * Send weekly pulse email
     */
    static async sendWeeklyPulseEmail(userId: string) {
        if (!resend) {
            console.warn('RESEND_API_KEY not configured. Skipping email.');
            return;
        }

        const user = await User.findById(userId);
        if (!user) return;

        const pulseData = await this.generateWeeklyPulse(userId);
        const aiSummary = await this.generateAISummary(pulseData);

        const trendEmoji = pulseData.weeklyTrend === 'up' ? '📈' : pulseData.weeklyTrend === 'down' ? '📉' : '➡️';

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 16px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🟢 Weekly Savings Pulse</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 10px 0 0;">Your SubTrack Report</p>
        </div>
        
        <div style="padding: 30px;">
            <div style="background: #0f172a; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <p style="color: #94a3b8; margin: 0 0 8px; font-size: 14px;">POTENTIAL MONTHLY SAVINGS</p>
                <h2 style="color: #10b981; margin: 0; font-size: 48px;">₹${pulseData.totalSavings.toLocaleString('en-IN')}</h2>
                <p style="color: #64748b; margin: 8px 0 0; font-size: 14px;">${trendEmoji} ${pulseData.trendPercent}% ${pulseData.weeklyTrend === 'up' ? 'more opportunities' : pulseData.weeklyTrend === 'down' ? 'progress made' : 'stable'} vs last week</p>
            </div>
            
            <p style="color: #cbd5e1; line-height: 1.6; margin: 0 0 24px;">${aiSummary}</p>
            
            ${pulseData.topLeaks.length > 0 ? `
            <div style="background: #0f172a; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <h3 style="color: #f1f5f9; margin: 0 0 16px; font-size: 16px;">🎯 Top Opportunities</h3>
                ${pulseData.topLeaks.map(leak => `
                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #334155;">
                    <span style="color: #e2e8f0;">${leak.name}</span>
                    <span style="color: #10b981; font-weight: bold;">₹${leak.savings.toLocaleString('en-IN')}/mo</span>
                </div>
                `).join('')}
            </div>
            ` : ''}
            
            <div style="text-align: center;">
                <a href="${process.env.CLIENT_URL || 'https://subtrack.pulseguard.in'}/dashboard" 
                   style="display: inline-block; background: #10b981; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                    View Dashboard →
                </a>
            </div>
        </div>
        
        <div style="padding: 20px; text-align: center; border-top: 1px solid #334155;">
            <p style="color: #64748b; margin: 0; font-size: 12px;">PulseGuard Tech • SubTrack • Saving developers money</p>
        </div>
    </div>
</body>
</html>
        `;

        try {
            const fromAddress = process.env.RESEND_FROM_EMAIL || 'SubTrack <reports@subtrack.pulseguard.in>';

            await resend.emails.send({
                from: fromAddress,
                to: user.email,
                subject: `🟢 Weekly Pulse: ₹${pulseData.totalSavings.toLocaleString('en-IN')} savings waiting for you`,
                html,
            });

            console.log(`📧 Weekly pulse email sent to ${user.email}`);
        } catch (error) {
            console.error('Failed to send weekly pulse email:', error);
        }
    }

    /**
     * Send weekly pulse to Slack
     */
    static async sendWeeklyPulseSlack(userId: string) {
        const slackIntegration = await SlackIntegration.findOne({ userId, weeklyPulseEnabled: true });
        if (!slackIntegration?.webhookUrl) return;

        const pulseData = await this.generateWeeklyPulse(userId);
        const aiSummary = await this.generateAISummary(pulseData);

        const trendEmoji = pulseData.weeklyTrend === 'up' ? '📈' : pulseData.weeklyTrend === 'down' ? '📉' : '➡️';

        const blocks = [
            {
                type: "header",
                text: { type: "plain_text", text: "🟢 Weekly Savings Pulse", emoji: true }
            },
            {
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: `*Potential Monthly Savings:* ₹${pulseData.totalSavings.toLocaleString('en-IN')}\n${trendEmoji} ${pulseData.trendPercent}% ${pulseData.weeklyTrend === 'up' ? 'more opportunities' : pulseData.weeklyTrend === 'down' ? 'progress' : 'stable'} vs last week`
                }
            },
            {
                type: "section",
                text: { type: "mrkdwn", text: aiSummary }
            },
            {
                type: "divider"
            }
        ];

        if (pulseData.topLeaks.length > 0) {
            blocks.push({
                type: "section",
                text: {
                    type: "mrkdwn",
                    text: "*🎯 Top Opportunities:*\n" + pulseData.topLeaks.map(l =>
                        `• ${l.name}: ₹${l.savings.toLocaleString('en-IN')}/mo`
                    ).join('\n')
                }
            });
        }

        blocks.push({
            type: "actions",
            elements: [{
                type: "button",
                text: { type: "plain_text", text: "View Dashboard →", emoji: true },
                url: `${process.env.CLIENT_URL || 'https://subtrack.pulseguard.in'}/dashboard`
            }]
        } as any);

        try {
            await fetch(slackIntegration.webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ blocks })
            });

            console.log(`📢 Weekly pulse sent to Slack for user ${userId}`);
        } catch (error) {
            console.error('Failed to send Slack pulse:', error);
        }
    }

    /**
     * Send weekly pulse to all eligible users (called by cron)
     */
    static async sendAllWeeklyPulses() {
        console.log('📊 Starting weekly pulse distribution...');

        const users = await User.find({});
        let emailsSent = 0;
        let slacksSent = 0;

        for (const user of users) {
            try {
                // Send email to all users
                await this.sendWeeklyPulseEmail((user._id as any).toString());
                emailsSent++;

                // Send Slack if connected
                await this.sendWeeklyPulseSlack((user._id as any).toString());
                slacksSent++;
            } catch (error) {
                console.error(`Failed to send pulse to ${user.email}:`, error);
            }
        }

        console.log(`✅ Weekly pulse complete: ${emailsSent} emails, ${slacksSent} Slack messages`);
    }
}
