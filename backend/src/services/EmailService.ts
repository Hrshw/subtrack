import React from 'react';
import { render } from '@react-email/render';
import { Resend } from 'resend';
import { MonthlyDigest } from '../emails/MonthlyDigest';
import { LeakAlert } from '../emails/LeakAlert';

interface DigestResult {
    resourceName: string;
    reason: string;
    potentialSavings: number;
}

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

export class EmailService {
    static async sendMonthlyDigest(to: string, savings: number, zombies: DigestResult[]) {
        if (!resend) {
            console.warn('RESEND_API_KEY is not configured. Skipping email send.');
            return;
        }

        try {
            const html = await render(
                React.createElement(MonthlyDigest, {
                    savings,
                    zombies,
                })
            );

            const fromAddress = process.env.RESEND_FROM_EMAIL || 'SubTrack <reports@subtrack.app>';

            await resend.emails.send({
                from: fromAddress,
                to,
                subject: `You can save ₹${savings.toLocaleString('en-IN')} this month`,
                html,
            });
            console.log(`📧 Monthly digest sent to ${to}`);
        } catch (error) {
            console.error('Failed to send monthly digest:', error);
        }
    }

    static async sendLeakAlert(to: string, resourceName: string, potentialSavings: number, reason: string) {
        if (!resend) {
            console.warn('RESEND_API_KEY is not configured. Skipping email send.');
            return;
        }

        try {
            const html = await render(
                React.createElement(LeakAlert, {
                    resourceName,
                    potentialSavings,
                    reason,
                })
            );

            const fromAddress = process.env.RESEND_FROM_EMAIL || 'SubTrack <alerts@subtrack.app>';

            await resend.emails.send({
                from: fromAddress,
                to,
                subject: `🚨 New Leak Detected: ${resourceName}`,
                html,
            });
            console.log(`📧 Leak alert sent to ${to}`);
        } catch (error) {
            console.error('Failed to send leak alert:', error);
        }
    }
}
