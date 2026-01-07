import {
    Body,
    Container,
    Head,
    Heading,
    Hr,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Text,
} from "@react-email/components";
import * as React from "react";

interface WaitlistEmailProps {
    position: number;
}

export const WaitlistEmail = ({
    position,
}: WaitlistEmailProps) => (
    <Html>
        <Head />
        <Preview>You're on the SubTrack Waitlist! 🚀</Preview>
        <Body style={main}>
            <Container style={container}>
                <Section style={header}>
                    <Text style={logo}>SubTrack</Text>
                </Section>
                <Heading style={h1}>You're on the list!</Heading>
                <Text style={text}>
                    Thanks for joining the SubTrack waitlist. We're excited to help you save money on your dev tool subscriptions.
                </Text>
                <Section style={positionBox}>
                    <Text style={positionLabel}>Your Position</Text>
                    <Text style={positionValue}>#{position}</Text>
                </Section>
                <Text style={text}>
                    We're rolling out access in batches to ensure the best experience for everyone. We'll send you an email as soon as your spot is ready!
                </Text>
                <Hr style={hr} />
                <Text style={footer}>
                    PulseGuard Tech • SubTrack • Saving developers money, one subscription at a time.
                </Text>
            </Container>
        </Body>
    </Html>
);

export default WaitlistEmail;

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
    textAlign: "center" as const,
};

const logo = {
    fontSize: "32px",
    fontWeight: "bold",
    color: "#10b981",
};

const h1 = {
    fontSize: "24px",
    fontWeight: "bold",
    textAlign: "center" as const,
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
    textAlign: "center" as const,
    margin: "30px 0",
};

const positionLabel = {
    fontSize: "14px",
    color: "#666",
    textTransform: "uppercase" as const,
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
    textAlign: "center" as const,
};
