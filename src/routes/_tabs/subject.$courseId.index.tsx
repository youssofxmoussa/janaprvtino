import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { findCourse } from "@/lib/courses";
import { spring } from "@/components/ios/press";

export const Route = createFileRoute("/_tabs/subject/$courseId/")({
  head: ({ params }) => {
    const c = findCourse(params.courseId);
    const title = `${c?.title ?? "Subject"} · Jana Prvt Course`;
    const description = `Choose a section of ${c?.title ?? "this subject"} and start studying.`;
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
  component: SubjectParts,
});

function SubjectParts() {
  const { courseId } = Route.useParams();
  const course = findCourse(courseId);
  if (!course) return <p className="p-12 text-center">Subject not found</p>;
  const [code, ...rest] = course.title.split(" ");

  return (
    <div className="pb-28 pt-4">
      <Link to="/courses" className="inline-flex items-center gap-0.5 text-[0.9375rem] font-semibold text-primary">
        <ChevronLeft className="size-5" /> Subjects
      </Link>
      <header className="mt-4">
        <p className="text-[0.9375rem] font-semibold text-primary">{code} · Semester {course.semester}</p>
        <h1 className="text-[1.75rem] font-bold leading-tight tracking-tight">{rest.join(" ").replace(/[()]/g, "")}</h1>
        <p className="mt-1 text-[0.875rem] text-muted-foreground">{course.parts.length} sections · {course.credits} credits</p>
      </header>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {course.parts.map((p, i) => (
          <Link key={p.id} to="/subject/$courseId/$partId" params={{ courseId: course.id, partId: p.id }} className={course.parts.length === 3 && i === 2 ? "col-span-2" : ""}>
            <motion.article
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: i * 0.06 }}
              whileTap={{ scale: 0.97 }}
              className="clay flex h-full flex-col items-center gap-3 rounded-[22px] p-4 text-center"
            >
              <img src={p.image} alt="" width={88} height={88} className="size-20 object-contain" />
              <div>
                <h2 className="text-[1rem] font-bold leading-tight">{p.title}</h2>
                <p className="mt-0.5 text-[0.75rem] font-medium text-muted-foreground">{p.subtitle}</p>
              </div>
              <span className="mt-auto inline-flex items-center gap-0.5 text-[0.8125rem] font-semibold text-primary">
                Open <ChevronRight className="size-4" />
              </span>
            </motion.article>
          </Link>
        ))}
      </div>
    </div>
  );
}
