import React from 'react';
import {
    Html,
    Head,
    Body,
    Container,
    Section,
    Text,
    Link,
    Preview,
    Img,
    Row,
    Column,
} from '@react-email/components';

interface WelcomeEmailProps {
    userName: string;
}

export const WelcomeEmail = ({ userName }: WelcomeEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>Welcome to SubTrack - Let's optimize your cloud spend!</Preview>
            <Body style={main}>
                <Container style={container}>
                    {/* Header */}
                    <Section style={header}>
                        <Img
                            src="https://subtrack.pulseguard.in/logo/logo-subTrack.jpg"
                            width="40"
                            height="40"
                            alt="SubTrack"
                            style={logo}
                        />
                        <Text style={logoText}>SubTrack</Text>
                    </Section>

                    {/* Hero Section */}
                    <Section style={heroSection}>
                        <Text style={heroText}>
                            Welcome to the future of <span style={highlight}>SaaS Management</span>, {userName}!
                        </Text>
                        <Text style={subHeroText}>
                            You've just taken the first step towards killing "zombie" infrastructure and saving thousands in forgotten developer tool costs.
                        </Text>
                        <Section style={buttonContainer}>
                            <Link href="https://subtrack.pulseguard.in/dashboard" style={button}>
                                Go to Dashboard
                            </Link>
                        </Section>
                    </Section>

                    {/* Content Section */}
                    <Section style={contentSection}>
                        <Text style={sectionTitle}>How to get started:</Text>

                        <Row style={stepRow}>
                            <Column style={stepIconWrapper}>
                                <div style={stepIcon}>1</div>
                            </Column>
                            <Column style={stepContent}>
                                <Text style={stepTitle}>Connect your stack</Text>
                                <Text style={stepDescription}>Connect GitHub, AWS, Vercel, and other services with read-only permissions.</Text>
                            </Column>
                        </Row>

                        <Row style={stepRow}>
                            <Column style={stepIconWrapper}>
                                <div style={stepIcon}>2</div>
                            </Column>
                            <Column style={stepContent}>
                                <Text style={stepTitle}>Automatic Scanning</Text>
                                <Text style={stepDescription}>Our AI scans for unused repositories, ghost EC2 instances, and tier downgrade possibilities.</Text>
                            </Column>
                        </Row>

                        <Row style={stepRow}>
                            <Column style={stepIconWrapper}>
                                <div style={stepIcon}>3</div>
                            </Column>
                            <Column style={stepContent}>
                                <Text style={stepTitle}>Kill the leaks</Text>
                                <Text style={stepDescription}>Get actionable recommendations and stop paying for what you don't use.</Text>
                            </Column>
                        </Row>
                    </Section>

                    {/* Footer */}
                    <Section style={footer}>
                        <Text style={footerText}>
                            Need help? <Link href="https://subtrack.pulseguard.in/support" style={footerLink}>Contact our developer support</Link>
                        </Text>
                        <Text style={copyright}>
                            © {new Date().getFullYear()} SubTrack. All rights reserved.
                        </Text>
                    </Section>
                </Container>
            </Body>
        </Html>
    );
};

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
    textAlign: 'center' as const,
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
    textAlign: 'center' as const,
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
    textAlign: 'center' as const,
};

const button = {
    backgroundColor: '#10b981',
    borderRadius: '12px',
    color: '#000',
    fontSize: '16px',
    fontWeight: '600',
    textDecoration: 'none',
    textAlign: 'center' as const,
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
    textAlign: 'center' as const,
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
    textAlign: 'center' as const,
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
