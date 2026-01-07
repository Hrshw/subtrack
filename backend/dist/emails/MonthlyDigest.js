"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonthlyDigest = void 0;
const react_1 = __importDefault(require("react"));
const components_1 = require("@react-email/components");
const MonthlyDigest = ({ savings = 12500, zombies = [], }) => {
    return (react_1.default.createElement(components_1.Html, null,
        react_1.default.createElement(components_1.Head, null),
        react_1.default.createElement(components_1.Preview, null,
            "You could save \u20B9",
            savings.toLocaleString('en-IN'),
            " this month"),
        react_1.default.createElement(components_1.Body, { style: main },
            react_1.default.createElement(components_1.Container, { style: container },
                react_1.default.createElement(components_1.Section, { style: header },
                    react_1.default.createElement(components_1.Heading, { style: logo }, "SubTrack")),
                react_1.default.createElement(components_1.Section, { style: heroSection },
                    react_1.default.createElement(components_1.Text, { style: heroTitle }, "Monthly Savings Report"),
                    react_1.default.createElement(components_1.Text, { style: heroAmount },
                        "\u20B9",
                        savings.toLocaleString('en-IN')),
                    react_1.default.createElement(components_1.Text, { style: heroSubtitle }, "Potential monthly savings found")),
                react_1.default.createElement(components_1.Section, { style: content },
                    react_1.default.createElement(components_1.Text, { style: paragraph },
                        "Here's your monthly summary of subscription optimization opportunities. We found ",
                        zombies.length,
                        " potential issues."),
                    zombies.length > 0 && (react_1.default.createElement(components_1.Section, { style: list }, zombies.map((zombie, i) => (react_1.default.createElement(components_1.Row, { key: i, style: listItem },
                        react_1.default.createElement(components_1.Column, { style: itemContent },
                            react_1.default.createElement(components_1.Text, { style: itemTitle }, zombie.resourceName),
                            react_1.default.createElement(components_1.Text, { style: itemReason }, zombie.reason)),
                        react_1.default.createElement(components_1.Column, { style: itemAmount },
                            react_1.default.createElement(components_1.Text, { style: amountText },
                                "\u20B9",
                                zombie.potentialSavings))))))),
                    react_1.default.createElement(components_1.Button, { style: button, href: "https://subtrack.pulseguard.in/dashboard" }, "View Full Report")),
                react_1.default.createElement(components_1.Hr, { style: hr }),
                react_1.default.createElement(components_1.Section, { style: footer },
                    react_1.default.createElement(components_1.Text, { style: footerText }, "You received this email because you enabled Monthly Digest in SubTrack."),
                    react_1.default.createElement(components_1.Link, { href: "https://subtrack.pulseguard.in/settings", style: link }, "Manage Notifications"))))));
};
exports.MonthlyDigest = MonthlyDigest;
const main = {
    backgroundColor: '#0a0e17',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};
const container = {
    margin: '0 auto',
    padding: '20px 0 48px',
    maxWidth: '560px',
};
const header = {
    padding: '24px',
    textAlign: 'center',
};
const logo = {
    color: '#10b981',
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '0',
};
const heroSection = {
    padding: '40px 20px',
    textAlign: 'center',
    background: 'linear-gradient(to bottom right, rgba(16, 185, 129, 0.1), rgba(6, 182, 212, 0.1))',
    borderRadius: '16px',
    marginBottom: '32px',
    border: '1px solid rgba(16, 185, 129, 0.2)',
};
const heroTitle = {
    color: '#94a3b8',
    fontSize: '16px',
    margin: '0 0 8px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    fontWeight: '600',
};
const heroAmount = {
    color: '#ffffff',
    fontSize: '48px',
    fontWeight: '800',
    margin: '0 0 8px',
};
const heroSubtitle = {
    color: '#10b981',
    fontSize: '18px',
    margin: '0',
};
const content = {
    padding: '0 24px',
};
const paragraph = {
    color: '#e2e8f0',
    fontSize: '16px',
    lineHeight: '26px',
    marginBottom: '24px',
};
const list = {
    marginBottom: '32px',
};
const listItem = {
    padding: '16px',
    borderBottom: '1px solid #334155',
};
const itemContent = {
    width: '70%',
};
const itemTitle = {
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 4px',
};
const itemReason = {
    color: '#94a3b8',
    fontSize: '14px',
    margin: '0',
};
const itemAmount = {
    width: '30%',
    textAlign: 'right',
};
const amountText = {
    color: '#f87171',
    fontSize: '16px',
    fontWeight: '600',
    margin: '0',
};
const button = {
    backgroundColor: '#10b981',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center',
    display: 'block',
    width: '100%',
    padding: '16px 0',
};
const hr = {
    borderColor: '#334155',
    margin: '32px 0',
};
const footer = {
    padding: '0 24px',
    textAlign: 'center',
};
const footerText = {
    color: '#64748b',
    fontSize: '12px',
    lineHeight: '20px',
    marginBottom: '12px',
};
const link = {
    color: '#10b981',
    fontSize: '12px',
    textDecoration: 'none',
};
exports.default = exports.MonthlyDigest;
