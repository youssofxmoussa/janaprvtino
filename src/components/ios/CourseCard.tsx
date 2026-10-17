import { motion } from "motion/react";
import { ChevronRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { spring } from "./press";
import type { Course } from "@/lib/courses";

export function CourseCard({ course, index = 0 }: { course: Course; index?: number }) {
  return (
    <Link
      to="/subject/$courseId"
      params={{ courseId: course.id }}
      preload="render"
      className="block"
    >
      <motion.article
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: index * 0.05 }}
        whileTap={{ scale: 0.98 }}
        className="clay group relative flex items-center gap-4 rounded-2xl p-3 md:p-4"
      >
      <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl md:size-20">
        {course.image ? (
          <img src={course.image} alt="" loading="lazy" decoding="async" width={80} height={80} className="size-full object-cover" />
        ) : (
          <div className="size-6 bg-muted-foreground/20 rounded-full" />
        )}
      </div>
      
      <div className="min-w-0 flex-1 py-1">
        <h3 className="text-[0.9375rem] font-semibold leading-snug [overflow-wrap:anywhere] md:text-[1.0625rem]">
          {course.title}
        </h3>
        <p className="mt-0.5 text-[0.8125rem] font-medium text-muted-foreground">
          {course.credits} Credits
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2 pr-1">
        <ChevronRight className="size-5 text-muted-foreground/50 transition-colors group-hover:text-primary" />
      </div>
      </motion.article>
    </Link>
  );
}
