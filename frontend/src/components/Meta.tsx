import React from 'react';
import { Helmet } from 'react-helmet-async';

interface MetaProps {
    title?: string;
    description?: string;
    canonical?: string;
    ogImage?: string;
    ogType?: string;
    twitterHandle?: string;
    faqs?: Array<{ question: string; answer: string }>;
}

const Meta: React.FC<MetaProps> = ({
    title = 'SubTrack - Smart SaaS Subscription Tracker',
    description = 'The developer-first SaaS tracker. Detect unused AWS resources, GitHub seats, and Vercel costs instantly.',
    canonical = 'https://subtrack.pulseguard.in',
    ogImage = 'https://subtrack.pulseguard.in/logo/logo-subTrack.jpg',
    ogType = 'website',
    twitterHandle = '@subtrack',
    faqs = []
}) => {
    const fullTitle = title.includes('SubTrack') ? title : `${title} | SubTrack`;

    // Organization Schema
    const organizationSchema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "SubTrack",
        "url": "https://subtrack.pulseguard.in",
        "logo": "https://subtrack.pulseguard.in/logo/logo-subTrack.jpg",
        "sameAs": [
            "https://twitter.com/subtrack",
            "https://github.com/subtrack"
        ]
    };

    // Software App Schema
    const softwareAppSchema = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "SubTrack",
        "operatingSystem": "Web",
        "applicationCategory": "BusinessApplication",
        "description": description,
        "offers": {
            "@type": "Offer",
            "price": "0.00",
            "priceCurrency": "USD"
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "ratingCount": "128"
        }
    };

    // FAQ Schema
    const faqSchema = faqs.length > 0 ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(faq => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
            }
        }))
    } : null;

    return (
        <Helmet>
            <title>{fullTitle}</title>
            <meta name="description" content={description} />
            <link rel="canonical" href={canonical} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={ogType} />
            <meta property="og:url" content={canonical} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={ogImage} />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={canonical} />
            <meta property="twitter:title" content={fullTitle} />
            <meta property="twitter:description" content={description} />
            <meta property="twitter:image" content={ogImage} />
            <meta name="twitter:site" content={twitterHandle} />

            {/* AEO / GEO Structured Data */}
            <script type="application/ld+json">
                {JSON.stringify(organizationSchema)}
            </script>
            <script type="application/ld+json">
                {JSON.stringify(softwareAppSchema)}
            </script>
            {faqSchema && (
                <script type="application/ld+json">
                    {JSON.stringify(faqSchema)}
                </script>
            )}
        </Helmet>
    );
};


export default Meta;
