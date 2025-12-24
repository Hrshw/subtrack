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
                const fromAddress = process.env.RESEND_FROM_EMAIL || 'SubTrack <reports@subtrack.app>';
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
                const fromAddress = process.env.RESEND_FROM_EMAIL || 'SubTrack <alerts@subtrack.app>';
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
}
exports.EmailService = EmailService;
