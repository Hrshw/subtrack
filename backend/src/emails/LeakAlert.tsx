import React from 'react';
import {
    Html,
    Head,
    Preview,
    Body,
    Container,
    Section,
    Text,
    Button,
    Hr,
    Link,
    Heading,
} from '@react-email/components';

interface LeakAlertProps {
    resourceName: string;
    potentialSavings: number;
    reason: string;
}

export const LeakAlert = ({
    resourceName = 'GitHub Copilot',
    potentialSavings = 800,
    reason = 'Inactive for 30+ days',
}: LeakAlertProps) => {
    return (
        <Html>
            <Head />
            <Preview>New leak detected: {resourceName}</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Section style={header}>
                        <Heading style={logo}>SubTrack</Heading>
                    </Section>

                    <Section style={alertBox}>
                        <Text style={alertIcon}>🚨</Text>
                        <Text style={alertTitle}>New Leak Detected</Text>
                        <Text style={alertMessage}>
                            We found a new zombie subscription in your connected services.
                        </Text>
                    </Section>

                    <Section style={card}>
                        <Text style={resourceTitle}>{resourceName}</Text>
                        <Text style={savingsAmount}>₹{potentialSavings.toLocaleString('en-IN')}/mo</Text>
                        <Text style={reasonText}>{reason}</Text>
                    </Section>

                    <Section style={content}>
                        <Button style={button} href="https://subtrack.app/dashboard">
                            Fix This Leak
                        </Button>
                    </Section>

                    <Hr style={hr} />

                    <Section style={footer}>
                        <Link href="https://subtrack.app/settings" style={link}>
                            Manage Alert Settings
                        </Link>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

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
    textAlign: 'center' as const,
};

const logo = {
    color: '#10b981',
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '0',
};

const alertBox = {
    textAlign: 'center' as const,
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
    textAlign: 'center' as const,
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
    textAlign: 'center' as const,
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
    textAlign: 'center' as const,
};

const link = {
    color: '#64748b',
    fontSize: '12px',
    textDecoration: 'none',
};

export default LeakAlert;
