"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeakAlert = void 0;
const react_1 = __importDefault(require("react"));
const components_1 = require("@react-email/components");
const LeakAlert = ({ resourceName = 'GitHub Copilot', potentialSavings = 800, reason = 'Inactive for 30+ days', }) => {
    return (react_1.default.createElement(components_1.Html, null,
        react_1.default.createElement(components_1.Head, null),
        react_1.default.createElement(components_1.Preview, null,
            "New leak detected: ",
            resourceName),
        react_1.default.createElement(components_1.Body, { style: main },
            react_1.default.createElement(components_1.Container, { style: container },
                react_1.default.createElement(components_1.Section, { style: header },
                    react_1.default.createElement(components_1.Heading, { style: logo }, "SubTrack")),
                react_1.default.createElement(components_1.Section, { style: alertBox },
                    react_1.default.createElement(components_1.Text, { style: alertIcon }, "\uD83D\uDEA8"),
                    react_1.default.createElement(components_1.Text, { style: alertTitle }, "New Leak Detected"),
                    react_1.default.createElement(components_1.Text, { style: alertMessage }, "We found a new zombie subscription in your connected services.")),
                react_1.default.createElement(components_1.Section, { style: card },
                    react_1.default.createElement(components_1.Text, { style: resourceTitle }, resourceName),
                    react_1.default.createElement(components_1.Text, { style: savingsAmount },
                        "\u20B9",
                        potentialSavings.toLocaleString('en-IN'),
                        "/mo"),
                    react_1.default.createElement(components_1.Text, { style: reasonText }, reason)),
                react_1.default.createElement(components_1.Section, { style: content },
                    react_1.default.createElement(components_1.Button, { style: button, href: "https://subtrack.app/dashboard" }, "Fix This Leak")),
                react_1.default.createElement(components_1.Hr, { style: hr }),
                react_1.default.createElement(components_1.Section, { style: footer },
                    react_1.default.createElement(components_1.Link, { href: "https://subtrack.app/settings", style: link }, "Manage Alert Settings"))))));
};
exports.LeakAlert = LeakAlert;
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
const alertBox = {
    textAlign: 'center',
    marginBottom: '32px',
};
const alertIcon = {
    fontSize: '48px',
    margin: '0 0 16px',
};
const alertTitle = {
    color: '#ffffff',
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '0 0 8px',
};
const alertMessage = {
    color: '#94a3b8',
    fontSize: '16px',
    margin: '0',
};
const card = {
    backgroundColor: '#1e293b',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '32px',
    textAlign: 'center',
    border: '1px solid #334155',
};
const resourceTitle = {
    color: '#ffffff',
    fontSize: '20px',
    fontWeight: '600',
    margin: '0 0 8px',
};
const savingsAmount = {
    color: '#f87171',
    fontSize: '32px',
    fontWeight: 'bold',
    margin: '0 0 8px',
};
const reasonText = {
    color: '#94a3b8',
    fontSize: '14px',
    margin: '0',
};
const content = {
    padding: '0 24px',
};
const button = {
    backgroundColor: '#f43f5e',
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
const link = {
    color: '#64748b',
    fontSize: '12px',
    textDecoration: 'none',
};
exports.default = exports.LeakAlert;
