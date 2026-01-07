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
exports.EmailService = void 0;
const react_1 = __importDefault(require("react"));
const render_1 = require("@react-email/render");
const resend_1 = require("resend");
const MonthlyDigest_1 = require("../emails/MonthlyDigest");
const LeakAlert_1 = require("../emails/LeakAlert");
const WelcomeEmail_1 = require("../emails/WelcomeEmail");
const WaitlistEmail_1 = require("../emails/WaitlistEmail");
const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new resend_1.Resend(apiKey) : null;
class EmailService {
    static sendMonthlyDigest(to, savings, zombies) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!resend) {
                console.warn('RESEND_API_KEY is not configured. Skipping email send.');
                return;
            }
            try {
                const html = yield (0, render_1.render)(react_1.default.createElement(MonthlyDigest_1.MonthlyDigest, {
                    savings,
                    zombies,
                }));
                const fromAddress = process.env.RESEND_FROM_EMAIL || 'SubTrack <reports@subtrack.pulseguard.in>';
                yield resend.emails.send({
                    from: fromAddress,
                    to,
                    subject: `You can save ₹${savings.toLocaleString('en-IN')} this month`,
                    html,
                });
                console.log(`📧 Monthly digest sent to ${to}`);
            }
            catch (error) {
                console.error('Failed to send monthly digest:', error);
            }
        });
    }
    static sendLeakAlert(to, resourceName, potentialSavings, reason) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!resend) {
                console.warn('RESEND_API_KEY is not configured. Skipping email send.');
                return;
            }
            try {
                const html = yield (0, render_1.render)(react_1.default.createElement(LeakAlert_1.LeakAlert, {
                    resourceName,
                    potentialSavings,
                    reason,
                }));
                const fromAddress = process.env.RESEND_FROM_EMAIL || 'SubTrack <alerts@subtrack.pulseguard.in>';
                yield resend.emails.send({
                    from: fromAddress,
                    to,
                    subject: `🚨 New Leak Detected: ${resourceName}`,
                    html,
                });
                console.log(`📧 Leak alert sent to ${to}`);
            }
            catch (error) {
                console.error('Failed to send leak alert:', error);
            }
        });
    }
    static sendSupportTicket(userName, userEmail, message) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!resend) {
                console.warn('RESEND_API_KEY is not configured. Skipping email send.');
                return;
            }
            try {
                const supportEmail = 'support@subtrack.pulseguard.in'; // Target support address
                const fromAddress = process.env.RESEND_FROM_EMAIL || 'SubTrack Support <support@subtrack.pulseguard.in>';
                yield resend.emails.send({
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
            }
            catch (error) {
                console.error('Failed to send support ticket:', error);
            }
        });
    }
    static sendWelcomeEmail(to, userName) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!resend) {
                console.warn('RESEND_API_KEY is not configured. Skipping email send.');
                return;
            }
            try {
                const html = yield (0, render_1.render)(react_1.default.createElement(WelcomeEmail_1.WelcomeEmail, {
                    userName,
                }));
                const fromAddress = process.env.RESEND_FROM_EMAIL || 'SubTrack <welcome@subtrack.pulseguard.in>';
                yield resend.emails.send({
                    from: fromAddress,
                    to,
                    subject: `Welcome to SubTrack, ${userName}! 🚀`,
                    html,
                });
                console.log(`📧 Welcome email sent to ${to}`);
            }
            catch (error) {
                console.error('Failed to send welcome email:', error);
            }
        });
    }
    static sendWaitlistEmail(to, position) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!resend) {
                console.warn('RESEND_API_KEY is not configured. Skipping email send.');
                return;
            }
            try {
                const html = yield (0, render_1.render)(react_1.default.createElement(WaitlistEmail_1.WaitlistEmail, {
                    position,
                }));
                const fromAddress = process.env.RESEND_FROM_EMAIL || 'SubTrack <waitlist@subtrack.pulseguard.in>';
                yield resend.emails.send({
                    from: fromAddress,
                    to,
                    subject: `You're #${position} on the SubTrack Waitlist! 🚀`,
                    html,
                });
                console.log(`📧 Waitlist confirmation sent to ${to}`);
            }
            catch (error) {
                console.error('Failed to send waitlist confirmation:', error);
            }
        });
    }
}
exports.EmailService = EmailService;
