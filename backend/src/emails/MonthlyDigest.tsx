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
    Img,
    Heading,
    Row,
    Column,
} from '@react-email/components';

interface DigestResult {
    resourceName: string;
    reason: string;
    potentialSavings: number;
}

interface MonthlyDigestProps {
    savings: number;
    zombies: DigestResult[];
}

export const MonthlyDigest = ({
    savings = 12500,
    zombies = [],
}: MonthlyDigestProps) => {
    return (
        <Html>
            <Head />
            <Preview>You could save ₹{savings.toLocaleString('en-IN')} this month</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Section style={header}>
                        <Heading style={logo}>SubTrack</Heading>
                    </Section>

                    <Section style={heroSection}>
                        <Text style={heroTitle}>Monthly Savings Report</Text>
                        <Text style={heroAmount}>₹{savings.toLocaleString('en-IN')}</Text>
                        <Text style={heroSubtitle}>Potential monthly savings found</Text>
                    </Section>

                    <Section style={content}>
                        <Text style={paragraph}>
                            Here's your monthly summary of subscription optimization opportunities. We found {zombies.length} potential issues.
                        </Text>

                        {zombies.length > 0 && (
                            <Section style={list}>
                                {zombies.map((zombie, i) => (
                                    <Row key={i} style={listItem}>
                                        <Column style={itemContent}>
                                            <Text style={itemTitle}>{zombie.resourceName}</Text>
                                            <Text style={itemReason}>{zombie.reason}</Text>
                                        </Column>
                                        <Column style={itemAmount}>
                                            <Text style={amountText}>₹{zombie.potentialSavings}</Text>
                                        </Column>
                                    </Row>
                                ))}
                            </Section>
                        )}

                        <Button style={button} href="https://subtrack.pulseguard.in/dashboard">
                            View Full Report
                        </Button>
                    </Section>

                    <Hr style={hr} />

                    <Section style={footer}>
                        <Text style={footerText}>
                            You received this email because you enabled Monthly Digest in SubTrack.
                        </Text>
                        <Link href="https://subtrack.pulseguard.in/settings" style={link}>
                            Manage Notifications
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

const heroSection = {
    padding: '40px 20px',
    textAlign: 'center' as const,
    background: 'linear-gradient(to bottom right, rgba(16, 185, 129, 0.1), rgba(6, 182, 212, 0.1))',
    borderRadius: '16px',
    marginBottom: '32px',
    border: '1px solid rgba(16, 185, 129, 0.2)',
};

const heroTitle = {
    color: '#94a3b8',
    fontSize: '16px',
    margin: '0 0 8px',
    textTransform: 'uppercase' as const,
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
    textAlign: 'right' as const,
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

export default MonthlyDigest;
