// lib/seo/schema.ts

export const BASE_URL = 'https://removation.ai';

export interface SchemaOrgGraph {
  '@context': 'https://schema.org';
  '@graph': any[];
}

/**
 * Builds the Organization schema
 */
export function buildOrganizationSchema(options: {
  name?: string;
  url?: string;
  logo?: string;
  sameAs?: string[];
  email?: string;
  languages?: string[];
} = {}) {
  const name = options.name || 'Removation.ai';
  const url = options.url || BASE_URL;
  const logo = options.logo || `${BASE_URL}/images/og-image.png`;
  const sameAs = options.sameAs || [
    'https://twitter.com/removationai',
    'https://linkedin.com/company/removation',
    'https://instagram.com/removation.ai',
  ];
  const email = options.email || 'support@removation.ai';
  const languages = options.languages || ['English', 'Hindi'];

  return {
    '@type': 'Organization',
    '@id': `${BASE_URL}/#org`,
    name,
    url,
    logo,
    sameAs,
    contactPoint: {
      '@type': 'ContactPoint',
      email,
      contactType: 'customer service',
      availableLanguage: languages,
    },
  };
}

/**
 * Builds the WebSite schema with search action
 */
export function buildWebSiteSchema(options: {
  name?: string;
  url?: string;
  description?: string;
} = {}) {
  const name = options.name || 'Removation.ai';
  const url = options.url || BASE_URL;
  const description = options.description || 'AI interior design for Indian homes';

  return {
    '@type': 'WebSite',
    '@id': `${BASE_URL}/#website`,
    url,
    name,
    description,
    publisher: { '@id': `${BASE_URL}/#org` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/marketplace?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Builds the SoftwareApplication schema
 */
export function buildSoftwareApplicationSchema(options: {
  name?: string;
  url?: string;
  description?: string;
  ratingValue?: string;
  ratingCount?: string;
} = {}) {
  const name = options.name || 'Removation.ai';
  const url = options.url || BASE_URL;
  const description = options.description || 'AI-powered interior design platform for Indian homeowners. Generate room redesigns, get Vastu Shastra analysis, real-time \u20b9 cost estimates, and book verified local designers.';
  const ratingValue = options.ratingValue || '4.8';
  const ratingCount = options.ratingCount || '847';

  return {
    '@type': 'SoftwareApplication',
    '@id': `${BASE_URL}/#app`,
    name,
    applicationCategory: 'DesignApplication',
    operatingSystem: 'Web',
    url,
    description,
    offers: [
      { '@type': 'Offer', price: '0', priceCurrency: 'INR', name: 'Free Plan' },
      { '@type': 'Offer', price: '2399', priceCurrency: 'INR', name: 'Pro Plan' },
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue,
      ratingCount,
      bestRating: '5',
      worstRating: '1',
    },
    author: { '@id': `${BASE_URL}/#org` },
    featureList: [
      'AI Interior Design',
      'Vastu Shastra Analysis',
      'Renovation Cost Calculator',
      '400+ Design Styles',
      'Designer Marketplace',
      'Style Transfer',
      'Smart Inpainting',
      'Lighting Simulation',
    ],
  };
}

/**
 * Builds the Service schema for local design services
 */
export function buildServiceSchema(options: {
  name: string;
  description: string;
  providerName?: string;
  areaServed?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: options.name,
    description: options.description,
    provider: {
      '@type': 'LocalBusiness',
      name: options.providerName || 'Removation.ai',
      image: `${BASE_URL}/images/og-image.png`,
      address: {
        '@type': 'PostalAddress',
        addressLocality: options.areaServed || 'Bangalore',
        addressRegion: 'Karnataka',
        addressCountry: 'IN',
      },
    },
    areaServed: {
      '@type': 'AdministrativeArea',
      name: options.areaServed || 'India',
    },
  };
}

/**
 * Builds the FAQPage schema
 */
export function buildFAQSchema(questions: { question: string; answer: string }[]) {
  return buildFAQPageSchema(questions);
}

export function buildFAQPageSchema(questions: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };
}

/**
 * Builds the BreadcrumbList schema
 */
export function buildBreadcrumbSchema(items: { name: string; item: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.item.startsWith('http') ? item.item : `${BASE_URL}${item.item}`,
    })),
  };
}

/**
 * Builds the Person schema (Designer details page)
 */
export interface PersonSchemaReview {
  author: string;
  datePublished?: string;
  reviewBody: string;
  reviewRating: number;
}

export function buildPersonSchema(options: {
  name: string;
  image?: string;
  description?: string;
  jobTitle?: string;
  addressLocality?: string;
  url?: string;
  ratingValue?: number;
  ratingCount?: number;
  reviews?: PersonSchemaReview[];
}) {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: options.name,
    jobTitle: options.jobTitle || 'Interior Designer',
    description: options.description,
  };

  if (options.image) {
    schema.image = options.image;
  }

  if (options.url) {
    schema.url = options.url;
  }

  if (options.addressLocality) {
    schema.address = {
      '@type': 'PostalAddress',
      addressLocality: options.addressLocality,
      addressCountry: 'IN',
    };
  }

  // Google requires at least 3 reviews (reviewCount >= 3) to show ratings/stars
  if (options.ratingValue && options.ratingCount && options.ratingCount >= 3) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: options.ratingValue.toFixed(1),
      ratingCount: options.ratingCount.toString(),
      bestRating: '5',
      worstRating: '1',
    };
  }

  if (options.reviews && options.reviews.length > 0) {
    schema.review = options.reviews.map((r) => {
      const reviewObj: any = {
        '@type': 'Review',
        author: {
          '@type': 'Person',
          name: r.author,
        },
        reviewBody: r.reviewBody,
        reviewRating: {
          '@type': 'Rating',
          ratingValue: r.reviewRating.toString(),
          bestRating: '5',
          worstRating: '1',
        },
      };

      if (r.datePublished) {
        reviewObj.datePublished = r.datePublished;
      }

      return reviewObj;
    });
  }

  return schema;
}

/**
 * Builds the BlogPosting schema
 */
export function buildBlogPostSchema(options: {
  title: string;
  description: string;
  image: string;
  authorName: string;
  authorRole?: string;
  datePublished: string;
  dateModified?: string;
  url: string;
  keywords?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: options.title,
    description: options.description,
    image: options.image,
    author: {
      '@type': 'Person',
      name: options.authorName,
      jobTitle: options.authorRole || 'Writer',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Removation.ai',
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/logo.svg`,
      },
    },
    datePublished: options.datePublished,
    dateModified: options.dateModified || options.datePublished,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': options.url,
    },
    keywords: options.keywords || '',
  };
}
