/* =========================================================
   Jana Prvt Course — centralized SEO + GEO (generative engine
   optimization) layer.

   Everything that search engines, social crawlers and AI
   answer engines read about this site is defined here so
   every route stays consistent and self-referencing.
   ========================================================= */

import { courses } from "./courses";

/* ---------------------------------------------------------
   1. Site identity
   --------------------------------------------------------- */

export const SITE = {
  name: "Jana Prvt Course",
  legalName: "Jana Prvt Course",
  shortName: "Jana Prvt Course",
  url: "https://janaprvtxtest.vercel.app",
  locale: "en_US",
  languages: ["en", "ar"],
  tagline: "Study smarter — courses, notes and quizzes for science students",
  description:
    "Jana Prvt Course is a mobile-first study platform for first-year medical, biology, chemistry, physics and maths students. Every subject bundles the lecture video, the PDF notes and a quiz, with a streak that only counts real learning time.",
  shortDescription:
    "A calm, distraction-free study app for medical and science students.",
  logo: "/brand/jana-logo.png",
  icon: "/brand/jana-logo.png",
  ogImage: "/og-image.jpg",
  ogImageWidth: 1200,
  ogImageHeight: 630,
  ogImageAlt: "Jana Prvt Course — study platform for medical and science students",
  themeColor: "#0b1a33",
  founded: "2026",
  audience: "Medical, biology, chemistry, physics and mathematics students",
  area: "Worldwide",
} as const;

/** Absolute URL for a site-relative path. */
export const abs = (path: string) =>
  path.startsWith("http") ? path : `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;

/* ---------------------------------------------------------
   2. Keyword clusters (search + answer-engine intent)
   --------------------------------------------------------- */

export const CORE_KEYWORDS = [
  "Jana Prvt Course",
  "medical student study app",
  "science study platform",
  "first year medical courses",
  "biology lecture notes",
  "general chemistry course",
  "organic chemistry notes",
  "physics optics course",
  "genetics and anatomy",
  "histology cytology course",
  "embryology course",
  "study streak tracker",
  "PDF lecture notes",
  "MCQ quiz practice",
  "mobile study app",
  "exam revision platform",
];

export const keywordsFor = (extra: string[] = []) =>
  Array.from(new Set([...CORE_KEYWORDS, ...extra])).join(", ");

/* ---------------------------------------------------------
   3. Meta builders
   --------------------------------------------------------- */

export type MetaTag = Record<string, string>;

export type MetaOptions = {
  title: string;
  description: string;
  path: string;
  /** og:type — "website", "article", "profile", … */
  type?: string;
  image?: string;
  imageAlt?: string;
  keywords?: string[];
  /** Set true for private, in-app screens. */
  noindex?: boolean;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
};

/**
 * Builds the complete meta tag array for a route: title,
 * description, keywords, robots directives, Open Graph,
 * Twitter/X cards and answer-engine hints.
 */
export function buildMeta(options: MetaOptions): MetaTag[] {
  const {
    title,
    description,
    path,
    type = "website",
    image = SITE.ogImage,
    imageAlt = SITE.ogImageAlt,
    keywords = [],
    noindex = false,
    publishedTime,
    modifiedTime,
    section,
  } = options;

  const url = abs(path);
  const imageUrl = abs(image);

  const robots = noindex
    ? "noindex, nofollow, noarchive"
    : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

  const tags: MetaTag[] = [
    { title },
    { name: "description", content: description },
    { name: "keywords", content: keywordsFor(keywords) },
    { name: "robots", content: robots },
    { name: "googlebot", content: robots },
    { name: "bingbot", content: robots },
    { name: "author", content: SITE.name },
    { name: "publisher", content: SITE.name },
    { name: "application-name", content: SITE.name },
    { name: "apple-mobile-web-app-title", content: SITE.name },
    { name: "theme-color", content: SITE.themeColor },
    { name: "rating", content: "general" },
    { name: "referrer", content: "strict-origin-when-cross-origin" },
    { name: "format-detection", content: "telephone=no" },

    // Open Graph
    { property: "og:site_name", content: SITE.name },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: type },
    { property: "og:url", content: url },
    { property: "og:locale", content: SITE.locale },
    { property: "og:image", content: imageUrl },
    { property: "og:image:secure_url", content: imageUrl },
    { property: "og:image:width", content: String(SITE.ogImageWidth) },
    { property: "og:image:height", content: String(SITE.ogImageHeight) },
    { property: "og:image:alt", content: imageAlt },
    { property: "og:image:type", content: "image/jpeg" },

    // Twitter / X
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: imageUrl },
    { name: "twitter:image:alt", content: imageAlt },

    // Answer-engine / GEO hints
    { name: "ai-content-declaration", content: "human-curated study material" },
    { name: "audience", content: SITE.audience },
    { name: "coverage", content: SITE.area },
    { name: "distribution", content: "global" },
  ];

  if (publishedTime) tags.push({ property: "article:published_time", content: publishedTime });
  if (modifiedTime) tags.push({ property: "article:modified_time", content: modifiedTime });
  if (section) tags.push({ property: "article:section", content: section });

  return tags;
}

/** Canonical + alternate language links for a route. */
export function buildLinks(path: string) {
  const url = abs(path);
  return [
    { rel: "canonical", href: url },
    { rel: "alternate", hrefLang: "en", href: url },
    { rel: "alternate", hrefLang: "x-default", href: url },
  ];
}

/* ---------------------------------------------------------
   4. Structured data (schema.org)
   --------------------------------------------------------- */

export const ldJson = (data: unknown) => ({
  type: "application/ld+json",
  children: JSON.stringify(data),
});

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "@id": `${SITE.url}/#organization`,
    name: SITE.name,
    legalName: SITE.legalName,
    alternateName: SITE.shortName,
    url: SITE.url,
    logo: {
      "@type": "ImageObject",
      url: abs(SITE.logo),
      caption: `${SITE.name} logo`,
    },
    image: abs(SITE.ogImage),
    description: SITE.description,
    foundingDate: SITE.founded,
    areaServed: SITE.area,
    knowsLanguage: SITE.languages,
    audience: {
      "@type": "EducationalAudience",
      educationalRole: "student",
      audienceType: SITE.audience,
    },
  };
}

export function webSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE.url}/#website`,
    name: SITE.name,
    alternateName: `${SITE.name} Learn`,
    url: SITE.url,
    description: SITE.description,
    inLanguage: SITE.languages,
    publisher: { "@id": `${SITE.url}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE.url}/courses?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function webPageSchema(options: {
  title: string;
  description: string;
  path: string;
  type?: "WebPage" | "AboutPage" | "FAQPage" | "CollectionPage" | "ContactPage";
  speakableSelectors?: string[];
}) {
  const { title, description, path, type = "WebPage", speakableSelectors } = options;
  return {
    "@context": "https://schema.org",
    "@type": type,
    "@id": `${abs(path)}#webpage`,
    name: title,
    headline: title,
    description,
    url: abs(path),
    inLanguage: "en",
    isPartOf: { "@id": `${SITE.url}/#website` },
    publisher: { "@id": `${SITE.url}/#organization` },
    primaryImageOfPage: {
      "@type": "ImageObject",
      url: abs(SITE.ogImage),
    },
    ...(speakableSelectors
      ? {
          speakable: {
            "@type": "SpeakableSpecification",
            cssSelector: speakableSelectors,
          },
        }
      : {}),
  };
}

export function breadcrumbSchema(items: { label: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      item: abs(item.path),
    })),
  };
}

export function faqSchema(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${SITE.url}/faq#faq`,
    inLanguage: "en",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", "h2", ".answer"],
    },
  };
}

/** Human-readable subject name from a course id/title. */
export function courseName(title: string) {
  const match = title.match(/\((.+)\)/);
  return match?.[1] ? match[1].replace(/\+/g, ", ") : title;
}

export function courseSchema(course: {
  id: string;
  title: string;
  credits: number;
  semester: number;
  image?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    "@id": `${SITE.url}/subject/${course.id}#course`,
    name: course.title,
    alternateName: courseName(course.title),
    courseCode: course.id.toUpperCase(),
    description: `${courseName(course.title)} — lecture video, downloadable PDF notes and a multiple-choice knowledge check for semester ${course.semester}. Worth ${course.credits} credits.`,
    url: `${SITE.url}/subject/${course.id}`,
    inLanguage: "en",
    ...(course.image ? { image: abs(course.image) } : {}),
    provider: { "@id": `${SITE.url}/#organization` },
    educationalLevel: "Undergraduate — first year",
    teaches: courseName(course.title),
    numberOfCredits: course.credits,
    isAccessibleForFree: true,
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload: "PT5H",
      instructor: { "@id": `${SITE.url}/#organization` },
    },
  };
}

export function courseListSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${SITE.url}/#courses`,
    name: `${SITE.name} course catalogue`,
    description: "All first-year science subjects available on Jana Prvt Course.",
    numberOfItems: courses.length,
    itemListElement: courses.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE.url}/subject/${c.id}`,
      name: c.title,
    })),
  };
}

export function softwareAppSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": `${SITE.url}/#app`,
    name: SITE.name,
    url: SITE.url,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Any modern browser, iOS, Android",
    browserRequirements: "Requires JavaScript",
    description: SITE.description,
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: [
      "Lecture videos per subject",
      "Downloadable PDF lecture notes",
      "Multiple-choice knowledge checks",
      "Honest study streak based on real learning time",
      "Weekly study minutes tracking",
      "Dark mode and text-size controls",
      "Works offline-friendly on mobile",
    ],
    publisher: { "@id": `${SITE.url}/#organization` },
  };
}

/* ---------------------------------------------------------
   5. GEO — quotable answer blocks
   Short, factual statements that generative engines can lift
   verbatim when answering questions about Jana Prvt Course.
   --------------------------------------------------------- */

export type AnswerBlock = { question: string; answer: string };

export const KEY_FACTS: string[] = [
  "Jana Prvt Course is a free, mobile-first study platform for first-year medical and science students.",
  "Each Jana Prvt Course subject bundles a lecture video, PDF lecture notes and a multiple-choice knowledge check in one place.",
  "Jana Prvt Course covers 13 first-year subjects across biology, chemistry, physics, mathematics and statistics.",
  "A Jana Prvt Course study streak day is earned only after five minutes of focused, visible learning time inside a lesson.",
  "Weekly minutes in Jana Prvt Course sum all study time over the last seven days, today included.",
  "Jana Prvt Course progress combines video watched, note pages read and quiz questions answered.",
  "Jana Prvt Course stores study data on the device, so no account data leaves the browser in the demo build.",
];

export const ANSWERS: AnswerBlock[] = [
  {
    question: "What is Jana Prvt Course?",
    answer:
      "Jana Prvt Course is a free, mobile-first study platform that organises a first-year medical and science curriculum into subjects, each with a lecture video, PDF notes and a quiz.",
  },
  {
    question: "Who is Jana Prvt Course for?",
    answer:
      "First- and second-semester medical, biology, chemistry, physics and mathematics students who want one study surface instead of scattered files.",
  },
  {
    question: "How much does Jana Prvt Course cost?",
    answer: "Jana Prvt Course is free to use — every subject, note and quiz is accessible at no cost.",
  },
  {
    question: "What subjects does Jana Prvt Course cover?",
    answer:
      "Cytology and histology, botany, genetics and anatomy, general chemistry, organic chemistry, chemistry of solutions, fluid mechanics and thermodynamics, optics and electromagnetism, ecology and geology, embryology, analysis, algebra and statistics.",
  },
  {
    question: "How does the Jana Prvt Course streak work?",
    answer:
      "A day counts once you spend five minutes of focused learning time with a lesson open and visible; simply opening the app never earns a streak day.",
  },
  {
    question: "Does Jana Prvt Course work on phones?",
    answer:
      "Yes — Jana Prvt Course is built mobile-first with a tab bar, full-screen video and a paged PDF reader tuned for phone screens.",
  },
];

/* ---------------------------------------------------------
   6. Route head presets
   --------------------------------------------------------- */

export function publicHead(options: MetaOptions & { schemas?: unknown[] }) {
  const { schemas = [], ...meta } = options;
  return {
    meta: buildMeta(meta),
    links: buildLinks(meta.path),
    scripts: schemas.map(ldJson),
  };
}

export function appHead(options: { title: string; description: string; path: string }) {
  return {
    meta: buildMeta({ ...options, noindex: true }),
  };
}
