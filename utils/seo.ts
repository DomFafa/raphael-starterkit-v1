/**
 * SEO utilities for generating structured data and meta tags
 * Improves search engine visibility and social media sharing
 */

interface WebPageSchema {
  '@context': 'https://schema.org';
  '@type': 'WebPage';
  name: string;
  description: string;
  url: string;
  mainEntity: WebSoftwareApplication;
  publisher: Organization;
  dateModified: string;
  inLanguage: string;
  isPartOf: WebSite;
}

interface WebSoftwareApplication {
  '@type': 'WebSoftwareApplication';
  name: string;
  description: string;
  url: string;
  applicationCategory: string;
  operatingSystem: string;
  offers?: Offer[];
  featureList: string[];
  screenshot: string;
  softwareVersion: string;
  aggregateRating?: AggregateRating;
}

interface WebSite {
  '@type': 'WebSite';
  name: string;
  url: string;
  description: string;
  publisher: Organization;
  inLanguage: string;
}

interface Organization {
  '@type': 'Organization';
  name: string;
  url: string;
  description: string;
  logo: string;
  sameAs?: string[];
}

interface Offer {
  '@type': 'Offer';
  name: string;
  description: string;
  price: string;
  priceCurrency: string;
  availability: string;
  validFrom: string;
}

interface AggregateRating {
  '@type': 'AggregateRating';
  ratingValue: number;
  reviewCount: number;
  bestRating: number;
  worstRating: number;
}

interface ArticleSchema {
  '@context': 'https://schema.org';
  '@type': 'Article';
  headline: string;
  description: string;
  image: string[];
  datePublished: string;
  dateModified: string;
  author: Person;
  publisher: Organization;
  mainEntityOfPage: WebPage;
}

interface Person {
  '@type': 'Person';
  name: string;
}

interface FAQSchema {
  '@context': 'https://schema.org';
  '@type': 'FAQPage';
  mainEntity: Question[];
}

interface Question {
  '@type': 'Question';
  name: string;
  acceptedAnswer: Answer;
}

interface Answer {
  '@type': 'Answer';
  text: string;
}

interface BreadcrumbList {
  '@context': 'https://schema.org';
  '@type': 'BreadcrumbList';
  itemListElement: ListItem[];
}

interface ListItem {
  '@type': 'ListItem';
  position: number;
  name: string;
  item: string;
}

/**
 * Generate structured data for the main Chinese name generator page
 */
export function generateChineseNameGeneratorSchema(baseUrl: string): WebPageSchema {
  const organization: Organization = {
    '@type': 'Organization',
    name: 'ChineseName.club',
    url: baseUrl,
    description: 'AI-powered Chinese name generator creating authentic, culturally significant names',
    logo: `${baseUrl}/logo.png`,
  };

  const webSite: WebSite = {
    '@type': 'WebSite',
    name: 'ChineseName.club',
    url: baseUrl,
    description: 'AI-powered Chinese name generator with cultural significance and personalization',
    publisher: organization,
    inLanguage: 'en-US',
  };

  const offers: Offer[] = [
    {
      '@type': 'Offer',
      name: 'Free Chinese Name Generation',
      description: 'Generate 3 Chinese names daily for free',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      validFrom: new Date().toISOString(),
    },
    {
      '@type': 'Offer',
      name: 'Premium Chinese Name Generation',
      description: 'Unlimited Chinese name generation with advanced features',
      price: '11',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      validFrom: new Date().toISOString(),
    },
  ];

  const webSoftwareApplication: WebSoftwareApplication = {
    '@type': 'WebSoftwareApplication',
    name: 'Chinese Name Generator',
    description: 'AI-powered Chinese name generator that creates authentic names based on personality, cultural significance, and traditional naming conventions',
    url: `${baseUrl}/`,
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Any',
    offers,
    featureList: [
      'AI-powered name generation',
      'Cultural significance analysis',
      'Personality-based matching',
      'PDF certificates',
      'Pronunciation guides',
      'Multiple name styles',
      'Free daily generation',
      'Batch generation',
    ],
    screenshot: `${baseUrl}/screenshot.png`,
    softwareVersion: '1.0',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: 4.8,
      reviewCount: 127,
      bestRating: 5,
      worstRating: 1,
    },
  };

  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Chinese Name Generator - AI-Powered Authentic Names',
    description: 'Generate authentic Chinese names with AI technology. Get personalized names based on your personality, with cultural significance, meanings, and pronunciation guides.',
    url: baseUrl,
    mainEntity: webSoftwareApplication,
    publisher: organization,
    dateModified: new Date().toISOString(),
    inLanguage: 'en-US',
    isPartOf: webSite,
  };
}

/**
 * Generate FAQ structured data
 */
export function generateFAQSchema(): FAQSchema {
  const questions: Question[] = [
    {
      '@type': 'Question',
      name: 'How does the AI Chinese name generator work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Our AI analyzes your personality traits, preferences, and birth information to generate authentic Chinese names that match your character and cultural significance. Each name includes detailed meanings, pronunciation guides, and cultural context.',
      },
    },
    {
      '@type': 'Question',
      name: 'Are the generated Chinese names culturally authentic?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, our AI is trained on authentic Chinese naming traditions, character meanings, and cultural significance. We ensure all generated names follow proper Chinese naming conventions and carry meaningful cultural context.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I use these names for official purposes?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The generated names are for cultural exploration, educational purposes, and personal identity projects. For official name changes or legal documents, we recommend consulting with appropriate authorities and cultural experts.',
      },
    },
    {
      '@type': 'Question',
      name: 'How many names can I generate for free?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'You can generate 3 Chinese names per day for free, no registration required. For unlimited generation and advanced features like PDF certificates and batch generation, you can upgrade to our premium plans.',
      },
    },
    {
      '@type': 'Question',
      name: 'What information do I need to provide?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Basic name generation requires your English name and gender preference. For more personalized results, you can optionally provide your birth year, personality traits, and specific preferences for name style or characteristics.',
      },
    },
  ];

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions,
  };
}

/**
 * Generate breadcrumb structured data
 */
export function generateBreadcrumbSchema(breadcrumbs: Array<{ name: string; url: string }>): BreadcrumbList {
  const itemListElement: ListItem[] = breadcrumbs.map((crumb, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: crumb.name,
    item: crumb.url,
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement,
  };
}

/**
 * Generate meta tags for social media sharing
 */
export function generateSocialMetaTags(
  title: string,
  description: string,
  url: string,
  imageUrl?: string
) {
  return {
    'og:title': title,
    'og:description': description,
    'og:url': url,
    'og:image': imageUrl || `${url}/og-image.png`,
    'og:image:width': '1200',
    'og:image:height': '630',
    'og:type': 'website',
    'og:site_name': 'ChineseName.club',
    'og:locale': 'en_US',
    'twitter:card': 'summary_large_image',
    'twitter:title': title,
    'twitter:description': description,
    'twitter:image': imageUrl || `${url}/twitter-image.png`,
    'twitter:site': '@ChineseNameClub',
  };
}

/**
 * Generate JSON-LD structured data script tag
 */
export function generateStructuredDataScript(schema: any) {
  return {
    type: 'application/ld+json',
    children: JSON.stringify(schema, null, 2),
  };
}

/**
 * Generate comprehensive SEO metadata
 */
export function generateSEOMetadata(
  title: string,
  description: string,
  url: string,
  keywords?: string[],
  imageUrl?: string
) {
  const structuredData = generateChineseNameGeneratorSchema(url);
  const faqData = generateFAQSchema();
  const socialMeta = generateSocialMetaTags(title, description, url, imageUrl);

  return {
    title,
    description,
    keywords: keywords?.join(', ') || [
      'Chinese name generator',
      'AI name generator',
      'Chinese names',
      'cultural names',
      'personalized names',
      'Chinese identity',
      'name meanings',
      'pinyin names',
      'traditional Chinese names',
      'modern Chinese names',
    ].join(', '),
    openGraph: {
      ...socialMeta,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      ...socialMeta,
    },
    alternates: {
      canonical: url,
    },
    structuredData,
    faqData,
  };
}

/**
 * Generate robots meta tag based on environment
 */
export function generateRobotsMeta() {
  if (process.env.NODE_ENV === 'production') {
    return {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    };
  }

  return {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  };
}

/**
 * Generate sitemap URL entries
 */
export function generateSitemapEntries(baseUrl: string): Array<{
  url: string;
  lastModified: string;
  changeFrequency: string;
  priority: number;
}> {
  const now = new Date().toISOString();

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/product/random-generator`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/product/popular-names`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];
}