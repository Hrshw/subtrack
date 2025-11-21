import { useParams, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Check, AlertTriangle, ExternalLink } from 'lucide-react';

const integrationData: Record<string, {
    title: string;
    description: string;
    icon: string;
    features: string[];
    permissions: string[];
    setupSteps: string[];
    faq: { q: string; a: string }[];
}> = {
    github: {
        title: 'GitHub Integration',
        description: 'Find unused seats, inactive Copilot licenses, and dormant repositories.',
        icon: 'github',
        features: [
            'Identify inactive user seats (30+ days no activity)',
            'Find unused GitHub Copilot licenses',
            'Detect dormant repositories consuming storage',
            'Analyze Action runner usage efficiency'
        ],
        permissions: [
            'read:org (Organization members and usage)',
            'read:user (User profile)',
            'repo (Repository metadata)'
        ],
        setupSteps: [
            'Go to Dashboard > Connect New Service',
            'Select GitHub',
            'Authorize the SubTrack OAuth app',
            'Grant access to the organizations you want to scan'
        ],
        faq: [
            { q: 'Does SubTrack read my code?', a: 'No. We only access metadata about usage, activity timestamps, and billing info. Your code is never read or stored.' },
            { q: 'Can I connect multiple organizations?', a: 'Yes, you can connect as many organizations as you have admin access to.' }
        ]
    },
    vercel: {
        title: 'Vercel Integration',
        description: 'Optimize serverless function usage, bandwidth, and team seats.',
        icon: 'vercel',
        features: [
            'Monitor bandwidth usage limits',
            'Identify unused team seats',
            'Detect abandoned projects',
            'Analyze serverless function execution times'
        ],
        permissions: [
            'Team Settings (Read-only)',
            'Projects (Read-only)',
            'Usage (Read-only)'
        ],
        setupSteps: [
            'Go to Dashboard > Connect New Service',
            'Select Vercel',
            'Log in to your Vercel account',
            'Select the team you want to monitor'
        ],
        faq: [
            { q: 'Do you support Personal accounts?', a: 'Yes, both Personal and Team accounts are supported.' }
        ]
    },
    aws: {
        title: 'AWS Integration',
        description: 'Find idle EC2 instances, unattached EBS volumes, and unused load balancers.',
        icon: 'aws',
        features: [
            'Idle EC2 instance detection (< 5% CPU)',
            'Unattached EBS volume finder',
            'Unused Elastic IPs',
            'Old snapshots consuming storage'
        ],
        permissions: [
            'ec2:DescribeInstances',
            'ec2:DescribeVolumes',
            'ec2:DescribeAddresses',
            'cloudwatch:GetMetricStatistics'
        ],
        setupSteps: [
            'Go to Dashboard > Connect New Service',
            'Select AWS',
            'Enter your Access Key ID and Secret Access Key',
            'Ensure the user has the required read-only permissions'
        ],
        faq: [
            { q: 'Is it safe to share my keys?', a: 'We encrypt your keys using AES-256 before storing them. We recommend creating a dedicated IAM user with read-only permissions.' }
        ]
    },
    // Add other integrations similarly...
    sentry: {
        title: 'Sentry Integration',
        description: 'Optimize event quotas and identify unused projects.',
        icon: 'sentry',
        features: ['Event quota monitoring', 'Unused project detection', 'Seat usage analysis'],
        permissions: ['Read-only access to organization stats'],
        setupSteps: ['Connect via API Key'],
        faq: []
    },
    linear: {
        title: 'Linear Integration',
        description: 'Find inactive user seats in your Linear workspace.',
        icon: 'linear',
        features: ['Inactive user detection', 'Guest account monitoring'],
        permissions: ['read_organization', 'read_users'],
        setupSteps: ['Connect via OAuth'],
        faq: []
    },
    resend: {
        title: 'Resend Integration',
        description: 'Monitor email usage and optimize plan limits.',
        icon: 'resend',
        features: ['Email volume monitoring', 'Domain verification status'],
        permissions: ['API Key (Full Access required by Resend API currently)'],
        setupSteps: ['Enter API Key'],
        faq: []
    },
    clerk: {
        title: 'Clerk Integration',
        description: 'Analyze MAU usage and identify inactive users.',
        icon: 'clerk',
        features: ['MAU tracking', 'Inactive user identification'],
        permissions: ['API Key (Read-only)'],
        setupSteps: ['Enter Secret Key'],
        faq: []
    },
    stripe: {
        title: 'Stripe Integration',
        description: 'Analyze spending trends and subscription costs.',
        icon: 'stripe',
        features: ['Subscription cost analysis', 'Spending trends', 'Duplicate subscription detection'],
        permissions: ['Restricted API Key (Read-only)'],
        setupSteps: ['Enter Restricted API Key'],
        faq: []
    }
};

const DocsIntegration = () => {
    const { slug } = useParams<{ slug: string }>();
    const data = slug ? integrationData[slug] : null;

    if (!data) {
        return <Navigate to="/docs" replace />;
    }

    return (
        <>
            <Helmet>
                <title>{data.title} - SubTrack Documentation</title>
                <meta name="description" content={data.description} />
            </Helmet>

            <div className="prose prose-invert prose-emerald max-w-none">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center border border-slate-700">
                        {/* Placeholder for icon */}
                        <span className="text-2xl font-bold text-white capitalize">{data.icon[0]}</span>
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">{data.title}</h1>
                        <p className="text-xl text-slate-400 m-0">{data.description}</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-12">
                    <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Check className="w-5 h-5 text-emerald-400" />
                            What we scan
                        </h3>
                        <ul className="space-y-2 m-0 p-0 list-none">
                            {data.features.map((feature, i) => (
                                <li key={i} className="text-slate-300 flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-400" />
                            Permissions Required
                        </h3>
                        <ul className="space-y-2 m-0 p-0 list-none">
                            {data.permissions.map((perm, i) => (
                                <li key={i} className="text-slate-300 flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                                    {perm}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-white mb-6">Setup Guide</h2>
                <div className="space-y-4 mb-12">
                    {data.setupSteps.map((step, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 bg-slate-800/30 rounded-lg border border-slate-800">
                            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white">
                                {i + 1}
                            </span>
                            <span className="text-slate-300">{step}</span>
                        </div>
                    ))}
                </div>

                {data.faq.length > 0 && (
                    <>
                        <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
                        <div className="space-y-6">
                            {data.faq.map((item, i) => (
                                <div key={i}>
                                    <h4 className="text-lg font-semibold text-white mb-2">{item.q}</h4>
                                    <p className="text-slate-400">{item.a}</p>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                <div className="mt-12 pt-8 border-t border-slate-800">
                    <a
                        href="/dashboard"
                        className="inline-flex items-center px-6 py-3 rounded-lg bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-colors"
                    >
                        Connect {data.title.split(' ')[0]} Now <ExternalLink className="w-4 h-4 ml-2" />
                    </a>
                </div>
            </div>
        </>
    );
};

export default DocsIntegration;
