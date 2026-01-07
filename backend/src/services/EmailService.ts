import React from 'react';
import { render } from '@react-email/render';
import { Resend } from 'resend';
import { MonthlyDigest } from '../emails/MonthlyDigest';
import { LeakAlert } from '../emails/LeakAlert';
import { WelcomeEmail } from '../emails/WelcomeEmail';
import { WaitlistEmail } from '../emails/WaitlistEmail';

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

            const fromAddress = process.env.RESEND_FROM_EMAIL || 'SubTrack <reports@subtrack.pulseguard.in>';

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

            const fromAddress = process.env.RESEND_FROM_EMAIL || 'SubTrack <alerts@subtrack.pulseguard.in>';

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

    static async sendSupportTicket(userName: string, userEmail: string, message: string) {
        if (!resend) {
            console.warn('RESEND_API_KEY is not configured. Skipping email send.');
            return;
        }

        try {
            const supportEmail = 'support@subtrack.pulseguard.in'; // Target support address
            const fromAddress = process.env.RESEND_FROM_EMAIL || 'SubTrack Support <support@subtrack.pulseguard.in>';

            await resend.emails.send({
                from: fromAddress,
                to: supportEmail,
                subject: `Support Ticket: ${userName}`,
                html: `
                    <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
                        <h2>New Support Request</h2>
                        <p><strong>From:</strong> ${userName} (${userEmail})</p>
                        <p><strong>Message:</strong></p>
                        <div style="background: #f4f4f4; padding: 15px; border-radius: 5px; border-left: 4px solid #10b981;">
                            ${message.replace(/\n/g, '<br>')}
                        </div>
                    </div>
                `,
            });
            console.log(`📧 Support ticket from ${userEmail} forwarded to team`);
        } catch (error) {
            console.error('Failed to send support ticket:', error);
        }
    }

    static async sendWelcomeEmail(to: string, userName: string) {
        if (!resend) {
            console.warn('RESEND_API_KEY is not configured. Skipping email send.');
            return;
        }

        try {
            const html = await render(
                React.createElement(WelcomeEmail, {
                    userName,
                })
            );

            const fromAddress = process.env.RESEND_FROM_EMAIL || 'SubTrack <welcome@subtrack.pulseguard.in>';

            await resend.emails.send({
                from: fromAddress,
                to,
                subject: `Welcome to SubTrack, ${userName}! 🚀`,
                html,
            });
            console.log(`📧 Welcome email sent to ${to}`);
        } catch (error) {
            console.error('Failed to send welcome email:', error);
        }
    }

    static async sendWaitlistEmail(to: string, position: number) {
        if (!resend) {
            console.warn('RESEND_API_KEY is not configured. Skipping email send.');
            return;
        }

        try {
            const html = await render(
                React.createElement(WaitlistEmail, {
                    position,
                })
            );

            const fromAddress = process.env.RESEND_FROM_EMAIL || 'SubTrack <waitlist@subtrack.pulseguard.in>';

            await resend.emails.send({
                from: fromAddress,
                to,
                subject: `You're #${position} on the SubTrack Waitlist! 🚀`,
                html,
            });
            console.log(`📧 Waitlist confirmation sent to ${to}`);
        } catch (error) {
            console.error('Failed to send waitlist confirmation:', error);
        }
    }
}
