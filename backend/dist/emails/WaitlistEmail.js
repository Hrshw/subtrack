"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.WaitlistEmail = void 0;
const components_1 = require("@react-email/components");
const React = __importStar(require("react"));
const WaitlistEmail = ({ position, }) => (React.createElement(components_1.Html, null,
    React.createElement(components_1.Head, null),
    React.createElement(components_1.Preview, null, "You're on the SubTrack Waitlist! \uD83D\uDE80"),
    React.createElement(components_1.Body, { style: main },
        React.createElement(components_1.Container, { style: container },
            React.createElement(components_1.Section, { style: header },
                React.createElement(components_1.Text, { style: logo }, "SubTrack")),
            React.createElement(components_1.Heading, { style: h1 }, "You're on the list!"),
            React.createElement(components_1.Text, { style: text }, "Thanks for joining the SubTrack waitlist. We're excited to help you save money on your dev tool subscriptions."),
            React.createElement(components_1.Section, { style: positionBox },
                React.createElement(components_1.Text, { style: positionLabel }, "Your Position"),
                React.createElement(components_1.Text, { style: positionValue },
                    "#",
                    position)),
            React.createElement(components_1.Text, { style: text }, "We're rolling out access in batches to ensure the best experience for everyone. We'll send you an email as soon as your spot is ready!"),
            React.createElement(components_1.Hr, { style: hr }),
            React.createElement(components_1.Text, { style: footer }, "PulseGuard Tech \u2022 SubTrack \u2022 Saving developers money, one subscription at a time.")))));
exports.WaitlistEmail = WaitlistEmail;
exports.default = exports.WaitlistEmail;
const main = {
    backgroundColor: "#ffffff",
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};
const container = {
    margin: "0 auto",
    padding: "20px 0 48px",
    width: "580px",
};
const header = {
    padding: "20px 0",
    textAlign: "center",
};
const logo = {
    fontSize: "32px",
    fontWeight: "bold",
    color: "#10b981",
};
const h1 = {
    fontSize: "24px",
    fontWeight: "bold",
    textAlign: "center",
    margin: "30px 0",
};
const text = {
    fontSize: "16px",
    lineHeight: "26px",
    color: "#484848",
};
const positionBox = {
    background: "#f4f4f4",
    borderRadius: "8px",
    padding: "24px",
    textAlign: "center",
    margin: "30px 0",
};
const positionLabel = {
    fontSize: "14px",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: "1px",
    margin: "0 0 8px",
};
const positionValue = {
    fontSize: "48px",
    fontWeight: "bold",
    color: "#10b981",
    margin: "0",
};
const hr = {
    borderColor: "#cccccc",
    margin: "20px 0",
};
const footer = {
    color: "#8898aa",
    fontSize: "12px",
    textAlign: "center",
};
