"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WelcomeEmail = void 0;
const react_1 = __importDefault(require("react"));
const components_1 = require("@react-email/components");
const WelcomeEmail = ({ userName }) => {
    return (react_1.default.createElement(components_1.Html, null,
        react_1.default.createElement(components_1.Head, null),
        react_1.default.createElement(components_1.Preview, null, "Welcome to SubTrack - Let's optimize your cloud spend!"),
        react_1.default.createElement(components_1.Body, { style: main },
            react_1.default.createElement(components_1.Container, { style: container },
                react_1.default.createElement(components_1.Section, { style: header },
                    react_1.default.createElement(components_1.Img, { src: "https://subtrack.pulseguard.in/logo/logo-subTrack.jpg", width: "40", height: "40", alt: "SubTrack", style: logo }),
                    react_1.default.createElement(components_1.Text, { style: logoText }, "SubTrack")),
                react_1.default.createElement(components_1.Section, { style: heroSection },
                    react_1.default.createElement(components_1.Text, { style: heroText },
                        "Welcome to the future of ",
                        react_1.default.createElement("span", { style: highlight }, "SaaS Management"),
                        ", ",
                        userName,
                        "!"),
                    react_1.default.createElement(components_1.Text, { style: subHeroText }, "You've just taken the first step towards killing \"zombie\" infrastructure and saving thousands in forgotten developer tool costs."),
                    react_1.default.createElement(components_1.Section, { style: buttonContainer },
                        react_1.default.createElement(components_1.Link, { href: "https://subtrack.pulseguard.in/dashboard", style: button }, "Go to Dashboard"))),
                react_1.default.createElement(components_1.Section, { style: contentSection },
                    react_1.default.createElement(components_1.Text, { style: sectionTitle }, "How to get started:"),
                    react_1.default.createElement(components_1.Row, { style: stepRow },
                        react_1.default.createElement(components_1.Column, { style: stepIconWrapper },
                            react_1.default.createElement("div", { style: stepIcon }, "1")),
                        react_1.default.createElement(components_1.Column, { style: stepContent },
                            react_1.default.createElement(components_1.Text, { style: stepTitle }, "Connect your stack"),
                            react_1.default.createElement(components_1.Text, { style: stepDescription }, "Connect GitHub, AWS, Vercel, and other services with read-only permissions."))),
                    react_1.default.createElement(components_1.Row, { style: stepRow },
                        react_1.default.createElement(components_1.Column, { style: stepIconWrapper },
                            react_1.default.createElement("div", { style: stepIcon }, "2")),
                        react_1.default.createElement(components_1.Column, { style: stepContent },
                            react_1.default.createElement(components_1.Text, { style: stepTitle }, "Automatic Scanning"),
                            react_1.default.createElement(components_1.Text, { style: stepDescription }, "Our AI scans for unused repositories, ghost EC2 instances, and tier downgrade possibilities."))),
                    react_1.default.createElement(components_1.Row, { style: stepRow },
                        react_1.default.createElement(components_1.Column, { style: stepIconWrapper },
                            react_1.default.createElement("div", { style: stepIcon }, "3")),
                        react_1.default.createElement(components_1.Column, { style: stepContent },
                            react_1.default.createElement(components_1.Text, { style: stepTitle }, "Kill the leaks"),
                            react_1.default.createElement(components_1.Text, { style: stepDescription }, "Get actionable recommendations and stop paying for what you don't use.")))),
                react_1.default.createElement(components_1.Section, { style: footer },
                    react_1.default.createElement(components_1.Text, { style: footerText },
                        "Need help? ",
                        react_1.default.createElement(components_1.Link, { href: "https://subtrack.pulseguard.in/support", style: footerLink }, "Contact our developer support")),
                    react_1.default.createElement(components_1.Text, { style: copyright },
                        "\u00A9 ",
                        new Date().getFullYear(),
                        " SubTrack. All rights reserved."))))));
};
exports.WelcomeEmail = WelcomeEmail;
// Styles
const main = {
    backgroundColor: '#0a0e17',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};
const container = {
    margin: '0 auto',
    padding: '40px 20px',
    width: '100%',
    maxWidth: '600px',
};
const header = {
    padding: '20px 0',
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
};
const logo = {
    borderRadius: '8px',
    display: 'inline-block',
};
const logoText = {
    color: '#fff',
    fontSize: '24px',
    fontWeight: '700',
    margin: '0 0 0 10px',
    display: 'inline-block',
    verticalAlign: 'middle',
};
const heroSection = {
    padding: '40px 30px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '24px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    textAlign: 'center',
    marginTop: '20px',
};
const heroText = {
    color: '#fff',
    fontSize: '32px',
    lineHeight: '1.2',
    fontWeight: '700',
    margin: '0 0 20px 0',
};
const highlight = {
    color: '#10b981',
};
const subHeroText = {
    color: '#94a3b8',
    fontSize: '18px',
    lineHeight: '1.6',
    margin: '0 0 30px 0',
};
const buttonContainer = {
    textAlign: 'center',
};
const button = {
    backgroundColor: '#10b981',
    borderRadius: '12px',
    color: '#000',
    fontSize: '16px',
    fontWeight: '600',
    textDecoration: 'none',
    textAlign: 'center',
    display: 'inline-block',
    padding: '12px 30px',
};
const contentSection = {
    padding: '40px 0',
};
const sectionTitle = {
    color: '#fff',
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '25px',
};
const stepRow = {
    marginBottom: '20px',
};
const stepIconWrapper = {
    width: '40px',
    verticalAlign: 'top',
};
const stepIcon = {
    width: '30px',
    height: '30px',
    backgroundColor: '#10b981',
    borderRadius: '15px',
    color: '#000',
    textAlign: 'center',
    lineHeight: '30px',
    fontSize: '16px',
    fontWeight: '700',
};
const stepContent = {
    paddingLeft: '15px',
};
const stepTitle = {
    color: '#fff',
    margin: '0 0 5px 0',
    fontSize: '16px',
    fontWeight: '600',
};
const stepDescription = {
    color: '#64748b',
    margin: '0',
    fontSize: '14px',
    lineHeight: '1.5',
};
const footer = {
    padding: '40px 0 0',
    textAlign: 'center',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
    marginTop: '40px',
};
const footerText = {
    color: '#64748b',
    fontSize: '14px',
    marginBottom: '10px',
};
const footerLink = {
    color: '#10b981',
    textDecoration: 'underline',
};
const copyright = {
    color: '#475569',
    fontSize: '12px',
};
