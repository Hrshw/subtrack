import { Helmet } from 'react-helmet-async';

const DocsFAQ = () => {
    const faqs = [
        {
            q: "How does SubTrack find savings?",
            a: "We connect to your SaaS providers via API and analyze usage patterns. For example, we look for GitHub seats that haven't been active in 30 days, or AWS EC2 instances with < 5% CPU usage."
        },
        {
            q: "Is my data safe?",
            a: "Yes. We use bank-level encryption (AES-256) for all sensitive data. We only request read-only access to your accounts, so we cannot modify or delete anything."
        },
        {
            q: "How much can I save?",
            a: "On average, our users save 15-20% on their SaaS bills. For a company spending $5,000/month, that's $12,000/year in savings."
        },
        {
            q: "Do you support custom integrations?",
            a: "We are adding new integrations every week. If you have a specific request, please email support@subtrack.app."
        },
        {
            q: "What happens if I cancel my subscription?",
            a: "You will lose access to the Pro features like unlimited connections and automatic weekly scans. Your data will be kept for 30 days in case you decide to return."
        }
    ];

    const schema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(faq => ({
            "@type": "Question",
            "name": faq.q,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.a
            }
        }))
    };

    return (
        <>
            <Helmet>
                <title>FAQ - SubTrack Documentation</title>
                <meta name="description" content="Frequently asked questions about SubTrack. Learn about our scanning technology, security, and pricing." />
                <script type="application/ld+json">
                    {JSON.stringify(schema)}
                </script>
            </Helmet>

            <div className="prose prose-invert prose-emerald max-w-none">
                <h1 className="text-4xl font-bold text-white mb-8">Frequently Asked Questions</h1>

                <div className="space-y-8">
                    {faqs.map((faq, i) => (
                        <div key={i} className="bg-slate-900/50 p-6 rounded-xl border border-slate-800">
                            <h3 className="text-xl font-bold text-white mb-3">{faq.q}</h3>
                            <p className="text-slate-400 leading-relaxed">{faq.a}</p>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

export default DocsFAQ;
