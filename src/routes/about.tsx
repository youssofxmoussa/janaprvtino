import { createFileRoute } from "@tanstack/react-router";
import { PublicPage, breadcrumbSchema } from "@/components/seo/PublicPage";

const title = "About Jana Prvt Course — study platform for medical students";
const description =
  "Jana Prvt Course is a focused study app for first-year medical and science students: lecture videos, PDF notes and quizzes per subject, with a streak that only counts real learning time.";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/about" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "AboutPage",
          name: title,
          description,
          url: "/about",
          publisher: { "@type": "Organization", name: "Jana Prvt Course" },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify(
          breadcrumbSchema([
            { label: "Home", path: "/" },
            { label: "About", path: "/about" },
          ]),
        ),
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <PublicPage
      title="About Jana Prvt Course"
      lede="A calm, distraction-free place to study biology, chemistry, physics and maths — built around what students actually do the night before an exam."
      crumbs={[{ label: "Home", to: "/" }, { label: "About" }]}
    >
      <section>
        <h2 className="text-xl font-bold tracking-tight">What Jana Prvt Course is</h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          Jana Prvt Course organises a full first-year science curriculum into subjects. Each subject
          bundles the lecture video, the PDF notes and a multiple-choice knowledge check, so you
          never have to hunt across drives, chats and folders to revise one topic.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold tracking-tight">How progress is measured</h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          Progress combines three honest signals: how much of the video you watched, how many
          pages of the notes you read, and how many quiz questions you answered. The day streak is
          stricter still — it only advances after five real minutes inside a lesson. Opening the
          app never earns a streak.
        </p>
      </section>
      <section>
        <h2 className="text-xl font-bold tracking-tight">Who it is for</h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          Medical, biology, chemistry and physics students in their first two semesters who want a
          single mobile-first study surface instead of a pile of files.
        </p>
      </section>
    </PublicPage>
  );
}
