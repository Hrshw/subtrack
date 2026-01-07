import { useParams, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Check, AlertTriangle, ExternalLink, Copy, Terminal } from 'lucide-react';
import { toast } from 'sonner';

const integrationData: Record<string, {
    title: string;
    description: string;
    icon: string;
    features: string[];
    permissions: string[];
    setupSteps: string[];
    faq: { q: string; a: string }[];
    policy?: any;
    link?: string;
}> = {
    openai: {
        title: 'OpenAI Integration',
        description: 'Track token usage and optimize model costs across projects.',
        icon: '🤖',
        features: [
            'Token usage monitoring (Input vs Output)',
            'Model efficiency analysis (GPT-4 vs 4o vs mini)',
            'Zombie API Key detection',
            'Estimated monthly spend trends'
        ],
        permissions: [
            'Usage: Read (Required for tracking)',
            'API Keys: Read (Optional)',
            'Organizations: Read (Optional)'
        ],
        setupSteps: [
            'Go to OpenAI Dashboard > Settings > Billing',
            'Ensure you have usage tracking enabled',
            'Go to Dashboard > API Keys',
            'Create a "Standard Secret Key" (Recommended)',
            'If using a "Restricted Key", you must find the "Usage" row and set it to "Read" (Note: This is missing for many new Project keys, in which case use a Standard Key)',
            'Paste the API Key into SubTrack'
        ],
        link: 'https://platform.openai.com/api-keys',
        faq: [
            { q: 'Why am I getting a 403 Forbidden error?', a: 'OpenAI requires the "Usage: Read" (api.read) scope to track costs. In the Restricted Key dashboard, you must scroll down past "List Models" and "Assistants" to find the "Usage" row. Set that row specifically to "Read".' },
            { q: 'Is my prompt data safe?', a: 'SubTrack never sees your actual prompts or completions. We only access token metadata and billing timestamps.' },
            { q: 'Why is my usage zero?', a: 'Some API keys (especially older ones) do not support the usage-reading API. Ensure you are using a key from a Paid account.' }
        ]
    },
    github: {
        title: 'GitHub Integration',
        description: 'Optimize your GitHub spend by identifying inactive seats and dormant repositories.',
        icon: '🐙',
        features: [
            'Inactive user seat detection (60+ days no activity)',
            'Dormant repository identification',
            'Account-level plan analysis (Free/Pro/Team)',
            'Public vs Private repository audits'
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
        icon: '▲',
        features: [
            'Pro Plan underutilization check (< 20% bandwidth)',
            'Bandwidth usage tracking vs limits',
            'Abandoned project detection',
            'Plan-level cost monitoring'
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
        description: 'Comprehensive multi-region scan to find zombies and overprovisioned resources.',
        icon: '☁️',
        features: [
            'Stop/Oversized EC2 instances (Rightsizing)',
            'Unattached Elastic IPs (charged when idle)',
            'Unattached EBS Volumes (zombie storage)',
            'Unused Lambda functions (last activity check)',
            'Inefficient DynamoDB billing (Provisioned vs On-demand)',
            'Inactive S3 buckets (metadata & object activity)',
            'Stopped/Multi-AZ RDS instances (high cost idle DBs)',
            'Multi-region scanning (ap-south, us-east, etc.)',
            'Historical Billing (Cost Explorer integration)'
        ],
        permissions: [
            'EC2:Describe (Instances, Addresses, Volumes)',
            'S3:ListBuckets & GetBucketLocation',
            'DynamoDB:ListTables & DescribeTable',
            'RDS:DescribeDBInstances',
            'Lambda:ListFunctions',
            'CE:GetCostAndUsage (Required for Cost History)'
        ],
        setupSteps: [
            'Go to AWS Console > IAM > Users',
            'Create a new user (e.g., "SubTrack-Scanner")',
            'Select "Attach policies directly" > "Create policy"',
            'Switch to JSON tab and paste the policy provided below',
            'Complete user creation and generate "Access Key - Programmatic Access"',
            'Enter the Access Key and Secret Key in SubTrack'
        ],
        policy: {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "ec2:DescribeInstances",
                        "ec2:DescribeVolumes",
                        "ec2:DescribeAddresses",
                        "s3:ListAllMyBuckets",
                        "s3:GetBucketLocation",
                        "s3:ListBucket",
                        "dynamodb:ListTables",
                        "dynamodb:DescribeTable",
                        "rds:DescribeDBInstances",
                        "lambda:ListFunctions",
                        "ce:GetCostAndUsage"
                    ],
                    "Resource": "*"
                }
            ]
        },
        faq: [
            { q: 'Is it safe to share my keys?', a: 'We encrypt your keys using AES-256 before storing them. We recommend creating a dedicated IAM user with only the read-only permissions listed below.' },
            { q: 'Which regions do you scan?', a: 'We scan all major global regions including Mumbai, N. Virginia, Ohio, Oregon, Frankfurt, Ireland, and Singapore.' }
        ]
    },
    sentry: {
        title: 'Sentry Integration',
        description: 'Optimize event quotas and identify zero-usage projects on paid plans.',
        icon: '🔍',
        features: [
            'Event quota utilization monitoring',
            'Zero-usage project detection (on paid plans)',
            'Plan-level cost analysis'
        ],
        permissions: ['Read-only access to organization stats'],
        setupSteps: [
            'Login to Sentry > Settings > Developer Settings',
            'Create a "New Internal Integration" or use an Auth Token',
            'Assign "org:read" scope',
            'Copy the token into SubTrack'
        ],
        faq: []
    },
    linear: {
        title: 'Linear Integration',
        description: 'Analyze workspace activity to identify inactive or overpaid seats.',
        icon: '📐',
        features: [
            'Individual user activity tracking (Issues touched)',
            'Inactive seat identification',
            'Guest account monitoring'
        ],
        permissions: ['read_organization', 'read_users'],
        setupSteps: [
            'Connect via OAuth within SubTrack',
            'Authorize access to your workspace'
        ],
        faq: []
    },
    resend: {
        title: 'Resend Integration',
        description: 'Monitor email volume and optimize domain/plan limits.',
        icon: '📧',
        features: [
            'Email volume monitoring',
            'Domain count vs Plan limit analysis',
            'API Key usage auditing'
        ],
        permissions: ['API Key (Full Access required by Resend API)'],
        setupSteps: [
            'Go to Resend Dashboard > API Keys',
            'Create a new API Key',
            'Paste it into SubTrack'
        ],
        faq: []
    },
    clerk: {
        title: 'Clerk Integration',
        description: 'Analyze MAU activity and identify user growth trends.',
        icon: '🔐',
        features: [
            'Monthly Active User (MAU) tracking',
            'Organization count monitoring',
            'User tier detection (Free/Hobby/Pro/Enterprise)'
        ],
        permissions: ['API Key (Secret Key)'],
        setupSteps: [
            'Go to Clerk Dashboard > API Keys',
            'Copy your Secret Key (starting with sk_...)',
            'Paste it into SubTrack'
        ],
        faq: []
    },
    stripe: {
        title: 'Stripe Integration',
        description: 'Analyze transaction volume and active subscription growth.',
        icon: '💳',
        features: [
            'Transaction volume monitoring',
            'Active subscription count tracking',
            'Account health and country-specific checks'
        ],
        permissions: ['Restricted API Key (Read-only)'],
        setupSteps: [
            'Go to Stripe > Developers > API Keys',
            'Create a "Restricted Key"',
            'Grant Read-only access to: Accounts, Charges, Subscriptions',
            'Copy the restricted key (rk_...) into SubTrack'
        ],
        faq: []
    },
    digitalocean: {
        title: 'DigitalOcean Integration',
        description: 'Scan your DigitalOcean environment for idle droplets, unattached volumes, and forgotten snapshots.',
        icon: '🌊',
        features: [
            'Stopped droplet detection',
            'Unattached block storage volumes',
            'Abandoned snapshots & backups',
            'Load balancer optimization'
        ],
        permissions: [
            'Personal Access Token (Read-only)'
        ],
        setupSteps: [
            'Login to DigitalOcean Cloud Console',
            'Go to API > Tokens/Keys',
            'Click "Generate New Token"',
            'Name it "SubTrack" and ensure only "Read" is selected',
            'Copy the token (starts with dop_v1_) and paste it in SubTrack'
        ],
        link: 'https://cloud.digitalocean.com/account/api/tokens',
        faq: [
            { q: 'Which resources do you track?', a: 'We track Droplets, Volumes, Snapshots, and Load Balancers. We flag any stopped droplet that is still incurring costs.' }
        ]
    },
    supabase: {
        title: 'Supabase Integration',
        description: 'Monitor your Supabase projects, database activity, and plan utilization.',
        icon: '⚡',
        features: [
            'Paused project monitoring',
            'Database activity auditing',
            'Plan-level limit checks',
            'Storage utilization trends'
        ],
        permissions: [
            'Personal Access Token (sbp_...)'
        ],
        setupSteps: [
            'Go to your Supabase Dashboard',
            'Click your profile icon > Account Preferences',
            'Select "Access Tokens"',
            'Generate a new token named "SubTrack"',
            'Copy and paste the token into SubTrack'
        ],
        link: 'https://supabase.com/dashboard/account/tokens',
        faq: [
            { q: 'Can you see my data?', a: 'No. We use the Management API which only gives us access to infrastructure meta-data. We cannot query your database rows.' }
        ]
    },
    notion: {
        title: 'Notion Integration',
        description: 'Audit your Notion workspace seats and identify inactive members.',
        icon: '📝',
        features: [
            'Member activity tracking',
            'Inactive seat detection',
            'Workspace plan analysis',
            'Guest account auditing'
        ],
        permissions: [
            'Internal Integration Token'
        ],
        setupSteps: [
            'Go to Notion Settings > Connections',
            'Select "Develop or manage integrations"',
            'Create a new "Internal Integration" named "SubTrack"',
            'Copy the "Internal Integration Token"',
            'Ensure the integration is added to the workspace'
        ],
        link: 'https://www.notion.so/my-integrations',
        faq: [
            { q: 'How do you track activity?', a: 'We check member-level audit logs and last-active timestamps to see who is actually using their seat.' }
        ]
    },
    gcp: {
        title: 'Google Cloud Integration',
        description: 'Scan your GCP projects for idle VMs, unattached disks, and over-provisioned resources.',
        icon: '🔷',
        features: [
            'Stopped Compute Engine instances',
            'Unattached Persistent Disks',
            'Idle Cloud SQL instances',
            'Unused static IP addresses',
            'Cloud Storage bucket analysis'
        ],
        permissions: [
            'Service Account with Viewer role'
        ],
        setupSteps: [
            'Go to GCP Console > IAM & Admin > Service Accounts',
            'Create a new Service Account named "SubTrack"',
            'Grant "Viewer" role to the service account',
            'Create a JSON key for the service account',
            'Paste the JSON key contents into SubTrack'
        ],
        link: 'https://console.cloud.google.com/iam-admin/serviceaccounts',
        faq: [
            { q: 'Which GCP services do you scan?', a: 'We scan Compute Engine, Cloud SQL, Persistent Disks, Static IPs, and Cloud Storage for cost optimization opportunities.' }
        ]
    },
    azure: {
        title: 'Azure Integration',
        description: 'Monitor your Azure subscriptions for idle VMs, unattached disks, and orphaned resources.',
        icon: '🔵',
        features: [
            'Stopped Virtual Machines',
            'Unattached Managed Disks',
            'Unused Public IP addresses',
            'Idle Azure SQL databases',
            'Storage account optimization'
        ],
        permissions: [
            'Service Principal with Reader role'
        ],
        setupSteps: [
            'Go to Azure Portal > Azure Active Directory > App registrations',
            'Create a new App registration named "SubTrack"',
            'Create a client secret for the application',
            'Assign "Reader" role to the App at subscription level',
            'Copy the Tenant ID, Client ID, and Client Secret into SubTrack'
        ],
        link: 'https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/RegisteredApps',
        faq: [
            { q: 'Which Azure resources do you scan?', a: 'We scan Virtual Machines, Managed Disks, Public IPs, Azure SQL, and Storage Accounts for cost optimization.' }
        ]
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
                        <span className="text-2xl font-bold text-white capitalize">{data.icon}</span>
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

                {data.policy && (
                    <div className="mb-12">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold text-white m-0 flex items-center gap-2">
                                <Terminal className="w-6 h-6 text-emerald-400" />
                                IAM Policy JSON
                            </h2>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(JSON.stringify(data.policy, null, 2));
                                    toast.success('Policy copied to clipboard');
                                }}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all text-sm font-medium"
                            >
                                <Copy className="w-4 h-4" /> Copy Policy
                            </button>
                        </div>
                        <div className="relative group">
                            <pre className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-sm font-mono text-emerald-400/80 overflow-x-auto shadow-2xl">
                                {JSON.stringify(data.policy, null, 2)}
                            </pre>
                            <div className="absolute top-4 right-4 text-[10px] uppercase tracking-widest font-bold text-slate-600">
                                JSON Configuration
                            </div>
                        </div>
                        <p className="mt-4 text-sm text-slate-500 italic">
                            * This policy follows the principle of least privilege, granting only the read-only access necessary for SubTrack to function.
                        </p>
                    </div>
                )}

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
