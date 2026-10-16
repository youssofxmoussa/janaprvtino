import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight, FileText, HelpCircle, PlayCircle } from "lucide-react";
import { findCourse, findPart } from "@/lib/courses";
import { getCourseOutline } from "@/lib/content.functions";
import { spring } from "@/components/ios/press";

export const Route = createFileRoute("/_tabs/subject/$courseId/$partId/")({
  head: ({ params }) => {
    const c = findCourse(params.courseId);
    const p = findPart(params.courseId, params.partId);
    const title = `${p?.title ?? "Lessons"} · ${c?.id.toUpperCase() ?? ""} · Jana Prvt Course`;
    const description = `All sessions of ${p?.title ?? "this section"} with videos, PDFs and quizzes.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: PartLessons,
});

type Outline = Awaited<ReturnType<typeof getCourseOutline>>;

function PartLessons() {
  const { courseId, partId } = Route.useParams();
  const course = findCourse(courseId);
  const part = findPart(courseId, partId);
  const load = useServerFn(getCourseOutline);
  const [outline, setOutline] = useState<Outline | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    load({ data: { courseId: courseId.toLowerCase() } })
      .then((o) => live && setOutline(o))
      .catch((e: Error) => live && setError(e.message));
    return () => { live = false; };
  }, [courseId, load]);

  if (!course || !part) return <p className="p-12 text-center">Section not found</p>;
  const lessons = outline?.parts[partId] ?? [];

  return (
    <div className="pb-28 pt-4">
      <Link to="/subject/$courseId" params={{ courseId: course.id }} className="inline-flex items-center gap-0.5 text-[0.9375rem] font-semibold text-primary">
        <ChevronLeft className="size-5" /> {course.id.toUpperCase()}
      </Link>
      <header className="mt-4 flex items-center gap-4">
        <img src={part.image} alt="" width={64} height={64} className="size-16 object-contain" />
        <div className="min-w-0">
          <p className="text-[0.8125rem] font-semibold text-primary">{part.subtitle}</p>
          <h1 className="text-[1.75rem] font-bold leading-tight tracking-tight">{part.title}</h1>
        </div>
      </header>

      <div className="mt-6 space-y-3">
        {error && <p role="alert" className="rounded-2xl bg-destructive/10 px-4 py-3 text-[0.875rem] font-medium text-destructive">{error}</p>}
        {!outline && !error && [0, 1, 2].map((i) => <div key={i} className="clay h-24 animate-pulse rounded-[22px]" />)}
        {outline && lessons.length === 0 && (
          <p className="clay rounded-[22px] px-4 py-10 text-center text-[0.9375rem] font-medium text-muted-foreground">No sessions yet. Check back soon.</p>
        )}
        {lessons.map((l, i) => (
          <Link key={l.id} to="/subject/$courseId/$partId/$lessonId" params={{ courseId: course.id, partId, lessonId: l.id }} className="block">
            <motion.article
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: i * 0.04 }}
              whileTap={{ scale: 0.98 }}
              className="clay flex min-h-24 items-center gap-4 rounded-[22px] p-4"
            >
              <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-[1.125rem] font-bold text-primary">{i + 1}</div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-[1.0625rem] font-bold">{l.title}</h2>
                <div className="mt-1.5 flex flex-wrap gap-3 text-[0.75rem] font-medium text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><PlayCircle className="size-3.5" />{l.videos} video{l.videos === 1 ? "" : "s"}</span>
                  <span className="inline-flex items-center gap-1"><FileText className="size-3.5" />{l.pdfs} PDF{l.pdfs === 1 ? "" : "s"}</span>
                  <span className="inline-flex items-center gap-1"><HelpCircle className="size-3.5" />{l.questions} quiz</span>
                </div>
              </div>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground/50" />
            </motion.article>
          </Link>
        ))}
      </div>
    </div>
  );
}
