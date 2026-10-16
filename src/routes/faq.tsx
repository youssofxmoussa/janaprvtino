import { createFileRoute } from "@tanstack/react-router";
import { PublicPage, breadcrumbSchema } from "@/components/seo/PublicPage";

const title = "Jana Prvt Course FAQ — streaks, progress and offline study";
const description =
  "Answers about how Jana Prvt Course counts study time, how the day streak and weekly minutes are calculated, and how progress syncs across devices.";

const faqs = [
  {
    q: "How does Jana Prvt Course calculate a day streak?",
    a: "A day is earned after five minutes of focused learning time — the lesson page must be open and visible. Watching a video, reading the PDF notes or answering quiz questions all count. Simply opening the app does not.",
  },
  {
    q: "When do the flame icons update?",
    a: "Immediately. Learning time is recorded every few seconds, so the day's flame switches from grey to lit as soon as you cross the five-minute goal — no refresh required.",
  },
  {
    q: "What do the weekly minutes show?",
    a: "The weekly card sums every minute spent in the app across the last seven days, today included. It tracks overall effort, while the streak tracks focused lesson time only.",
  },
  {
    q: "What happens if I miss a day?",
    a: "The streak resets to zero and starts again on your next earned day. Yesterday still counts as the anchor if you have not hit today's goal yet.",
  },
  {
    q: "Does Jana Prvt Course work on mobile?",
    a: "Yes. Jana Prvt Course is built mobile-first with a tab bar, full-screen video and a paged PDF reader tuned for phone screens.",
  },
];

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/faq" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/faq" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbSchema([
            { label: "Home", path: "/" },
            { label: "FAQ", path: "/faq" },
          ]),
        ),
      },
    ],
  }),
  component: FaqPage,
});

function FaqPage() {
  return (
    <PublicPage
      title="Frequently asked questions"
      lede="Short, direct answers about streaks, study time and progress in Jana Prvt Course."
      crumbs={[{ label: "Home", to: "/" }, { label: "FAQ" }]}
    >
      {faqs.map((f) => (
        <section key={f.q}>
          <h2 className="text-lg font-bold tracking-tight">{f.q}</h2>
          <p className="mt-2 leading-relaxed text-muted-foreground">{f.a}</p>
        </section>
      ))}
    </PublicPage>
  );
}
