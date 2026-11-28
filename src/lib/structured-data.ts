import { FAQ_IDS } from "@/src/components/home/faq-data";
import {
  SITE_URL,
  SUBSCRIPTION_INTERVAL,
  SUBSCRIPTION_PRICE_BRL,
  TRIAL_DAYS,
  DEFAULT_CURRENCY,
  DEFAULT_LOCALE,
  SOCIAL_PROFILES,
} from "@/src/lib/constants";
import { getPricingDisplay } from "@/src/lib/pricing-display";
import {
  BLOG_PATH,
  buildBlogPostPath,
  getBlogModifiedDate,
  type BlogFrontmatter,
} from "@/src/core/blog";

type Translate = (
  key: string,
  values?: Record<string, string | number>,
) => string;

const SUBSCRIPTION_OFFER_INTERVALS = [
  SUBSCRIPTION_INTERVAL.YEARLY,
  SUBSCRIPTION_INTERVAL.MONTHLY,
] as const;

type SubscriptionOfferInterval = (typeof SUBSCRIPTION_OFFER_INTERVALS)[number];

const OFFER_NAMES = {
  [SUBSCRIPTION_INTERVAL.YEARLY]: "Anual",
  [SUBSCRIPTION_INTERVAL.MONTHLY]: "Mensal",
} as const;

const BILLING_DURATIONS = {
  [SUBSCRIPTION_INTERVAL.YEARLY]: "P1Y",
  [SUBSCRIPTION_INTERVAL.MONTHLY]: "P1M",
} as const;

const ORGANIZATION = {
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "Fluizer",
  url: SITE_URL,
  logo: `${SITE_URL}/web-app-manifest-512x512.png`,
  sameAs: Object.values(SOCIAL_PROFILES),
} as const;

function buildSubscriptionOffer(
  interval: SubscriptionOfferInterval,
): Record<string, unknown> {
  const price = SUBSCRIPTION_PRICE_BRL[interval].toFixed(2);
  return {
    "@type": "Offer",
    name: OFFER_NAMES[interval],
    price,
    priceCurrency: DEFAULT_CURRENCY,
    availability: "https://schema.org/InStock",
    category: "Subscription",
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price,
      priceCurrency: DEFAULT_CURRENCY,
      billingDuration: BILLING_DURATIONS[interval],
    },
  };
}

function buildTrialOffer(): Record<string, unknown> {
  return {
    "@type": "Offer",
    name: "Teste grátis",
    price: "0",
    priceCurrency: DEFAULT_CURRENCY,
    availability: "https://schema.org/InStock",
    eligibleDuration: {
      "@type": "QuantitativeValue",
      value: TRIAL_DAYS,
      unitCode: "DAY",
    },
  };
}

export function buildHomeJsonLd(
  tFaq: Translate,
  description: string,
): Record<string, unknown> {
  const faqValues = { ...getPricingDisplay(), days: TRIAL_DAYS };

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": `${SITE_URL}/#webapp`,
        name: "Fluizer",
        url: SITE_URL,
        description,
        applicationCategory: "EducationalApplication",
        operatingSystem: "Web",
        inLanguage: DEFAULT_LOCALE,
        publisher: { "@id": ORGANIZATION["@id"] },
        offers: [buildTrialOffer(), ...SUBSCRIPTION_OFFER_INTERVALS.map(buildSubscriptionOffer)],
      },
      ORGANIZATION,
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/#faq`,
        mainEntity: FAQ_IDS.map((id) => ({
          "@type": "Question",
          name: tFaq(`items.${id}.question`, faqValues),
          acceptedAnswer: {
            "@type": "Answer",
            text: tFaq(`items.${id}.answer`, faqValues),
          },
        })),
      },
    ],
  };
}

export function buildBlogPostJsonLd(post: BlogFrontmatter): Record<string, unknown> {
  const url = `${SITE_URL}${buildBlogPostPath(post.slug)}`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${url}#article`,
        headline: post.title,
        description: post.description,
        image: `${SITE_URL}${post.cover}`,
        datePublished: post.date,
        dateModified: getBlogModifiedDate(post),
        inLanguage: DEFAULT_LOCALE,
        author: ORGANIZATION,
        publisher: ORGANIZATION,
        mainEntityOfPage: url,
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: post.faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ],
  };
}

export function buildBlogIndexJsonLd(
  posts: BlogFrontmatter[],
  description: string,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${SITE_URL}${BLOG_PATH}#blog`,
    name: "Blog Fluizer",
    url: `${SITE_URL}${BLOG_PATH}`,
    description,
    inLanguage: DEFAULT_LOCALE,
    publisher: ORGANIZATION,
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      url: `${SITE_URL}${buildBlogPostPath(post.slug)}`,
      datePublished: post.date,
      image: `${SITE_URL}${post.cover}`,
    })),
  };
}
