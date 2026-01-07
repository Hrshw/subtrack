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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startSubscriptionReminderCron = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
const User_1 = require("../models/User");
const resend_1 = require("resend");
const resend = new resend_1.Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || 'SubTrack <noreply@subtrack.pulseguard.in>';
/**
 * Sends renewal reminder emails to users whose subscriptions expire in 2 days
 * Runs daily at 9 AM IST
 */
const startSubscriptionReminderCron = () => {
    // Run at 9:00 AM every day (IST = UTC+5:30, so 3:30 AM UTC)
    node_cron_1.default.schedule('30 3 * * *', () => __awaiter(void 0, void 0, void 0, function* () {
        console.log('🔔 Running subscription renewal reminder check...');
        try {
            // Calculate date 2 days from now
            const now = new Date();
            const twoDaysFromNow = new Date(now);
            twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
            // Set time bounds for the day 2 days from now
            const startOfDay = new Date(twoDaysFromNow);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(twoDaysFromNow);
            endOfDay.setHours(23, 59, 59, 999);
            // Find Pro users whose subscription ends in 2 days and haven't been reminded
            const usersToRemind = yield User_1.User.find({
                subscriptionStatus: 'pro',
                subscriptionEndDate: {
                    $gte: startOfDay,
                    $lte: endOfDay
                },
                renewalReminderSent: { $ne: true }
            });
            console.log(`📧 Found ${usersToRemind.length} users to remind`);
            for (const user of usersToRemind) {
                try {
                    yield sendRenewalReminderEmail(user);
                    // Mark reminder as sent
                    yield User_1.User.findByIdAndUpdate(user._id, {
                        renewalReminderSent: true
                    });
                    console.log(`✅ Sent renewal reminder to ${user.email}`);
                }
                catch (emailError) {
                    console.error(`❌ Failed to send reminder to ${user.email}:`, emailError);
                }
            }
            console.log('🔔 Subscription reminder check complete');
        }
        catch (error) {
            console.error('❌ Subscription reminder cron error:', error);
        }
    }));
    console.log('⏰ Subscription renewal reminder cron job scheduled (daily at 9 AM IST)');
};
exports.startSubscriptionReminderCron = startSubscriptionReminderCron;
function sendRenewalReminderEmail(user) {
    return __awaiter(this, void 0, void 0, function* () {
        const planName = user.plan === 'annual' ? 'Annual' : 'Monthly';
        const expiryDate = new Date(user.subscriptionEndDate).toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your SubTrack Pro subscription is expiring soon</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0e17; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <!-- Logo -->
            <div style="text-align: center; margin-bottom: 32px;">
                <img src="https://subtrack.pulseguard.in/subtrack.svg" alt="SubTrack" style="height: 48px;">
            </div>

            <!-- Main Card -->
            <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; padding: 32px; border: 1px solid #334155;">
                <h1 style="color: #ffffff; font-size: 24px; margin: 0 0 16px 0; text-align: center;">
                    Your Pro subscription expires in 2 days ⏰
                </h1>

                <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0; text-align: center;">
                    Hey ${user.name || 'there'}! Your <strong style="color: #10b981;">SubTrack Pro ${planName}</strong> 
                    subscription will expire on <strong style="color: #ffffff;">${expiryDate}</strong>.
                </p>

                <!-- Stats Box -->
                <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                    <p style="color: #10b981; font-size: 14px; margin: 0 0 8px 0; text-align: center;">
                        Don't lose access to:
                    </p>
                    <ul style="color: #e2e8f0; font-size: 14px; margin: 0; padding-left: 24px; line-height: 1.8;">
                        <li>Unlimited service connections</li>
                        <li>Deep AWS infrastructure scanning</li>
                        <li>AI-powered savings recommendations</li>
                        <li>Weekly automated scans</li>
                        <li>PDF/CSV report exports</li>
                    </ul>
                </div>

                <!-- CTA Button -->
                <div style="text-align: center;">
                    <a href="https://subtrack.pulseguard.in/dashboard" 
                       style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); 
                              color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; 
                              font-size: 16px; font-weight: 600;">
                        Keep Saving Money 🚀
                    </a>
                </div>

                <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 24px;">
                    Your subscription will auto-renew. No action needed if you wish to continue.
                </p>
            </div>

            <!-- Footer -->
            <div style="text-align: center; margin-top: 32px;">
                <p style="color: #475569; font-size: 12px; margin: 0;">
                    Questions? Reply to this email or reach out to <a href="mailto:support@subtrack.pulseguard.in" style="color: #10b981;">support@subtrack.pulseguard.in</a>
                </p>
                <p style="color: #334155; font-size: 11px; margin-top: 16px;">
                    SubTrack by PulseGuard · Made with ❤️ for developers
                </p>
            </div>
        </div>
    </body>
    </html>
    `;
        yield resend.emails.send({
            from: FROM_EMAIL,
            to: user.email,
            subject: '⏰ Your SubTrack Pro subscription expires in 2 days',
            html
        });
    });
}
