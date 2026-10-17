import { createFileRoute } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { useState, useMemo } from "react";
import { CourseCard } from "@/components/ios/CourseCard";
import { courses } from "@/lib/courses";
import { motion, AnimatePresence } from "motion/react";
import { spring } from "@/components/ios/press";

export const Route = createFileRoute("/_tabs/courses")({
  head: () => ({
    meta: [
      { title: "Courses · Jana Prvt Course" },
      {
        name: "description",
        content: "Browse your Jana Prvt Course courses and pick up exactly where you left off.",
      },
      { property: "og:title", content: "Courses · Jana Prvt Course" },
      { property: "og:description", content: "Your library of focused, beautifully paced courses." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Courses,
});

function Courses() {
  const [searchQuery, setSearchQuery] = useState("");
  const [semesterFilter, setSemesterFilter] = useState<number | null>(null);

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchesSearch =
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.credits.toString().includes(searchQuery);
      const matchesSemester = semesterFilter ? c.semester === semesterFilter : true;
      return matchesSearch && matchesSemester;
    });
  }, [searchQuery, semesterFilter]);

  const s1Courses = filteredCourses.filter((c) => c.semester === 1);
  const s2Courses = filteredCourses.filter((c) => c.semester === 2);

  return (
    <div className="pb-28 pt-6">
      <header className="flex flex-col gap-5">
        <div>
          <p className="text-[0.9375rem] text-muted-foreground font-medium">Academic Library</p>
          <h1 className="text-large-title tracking-tight">Subjects</h1>
        </div>

        <div className="relative flex items-center">
          <div className="glass-clay flex h-11 w-full items-center gap-2 rounded-2xl px-3 transition-all focus-within:ring-2 focus-within:ring-primary/30">
            <Search className="size-4.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search subjects or credits..."
              className="min-w-0 flex-1 bg-transparent text-[0.9375rem] text-foreground outline-none placeholder:text-muted-foreground"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")}>
                <X className="size-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>


        <div className="grid grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)] gap-2">
          {[
            { label: "All", value: null },
            { label: "Semester 1", value: 1 },
            { label: "Semester 2", value: 2 },
          ].map((chip) => (
            <button
              key={chip.label}
              onClick={() => setSemesterFilter(chip.value)}
              className={`relative h-9 min-w-0 rounded-xl px-2 text-[0.8125rem] font-semibold transition-all ${
                semesterFilter === chip.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "clay text-muted-foreground hover:text-foreground"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </header>

      <div className="mt-8 space-y-10">
        <AnimatePresence initial={false} mode="sync">
          {s1Courses.length > 0 && (
            <motion.section
              key="s1"
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              layout
            >
              <h2 className="px-1 text-[1.125rem] font-bold tracking-tight text-foreground/90">
                Semester 1
              </h2>
              <div className="mt-4 space-y-3">
                {s1Courses.map((course, i) => (
                  <CourseCard key={course.id} course={course} index={i} />
                ))}
              </div>
            </motion.section>
          )}

          {s2Courses.length > 0 && (
            <motion.section
              key="s2"
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              layout
            >
              <h2 className="px-1 text-[1.125rem] font-bold tracking-tight text-foreground/90">
                Semester 2
              </h2>
              <div className="mt-4 space-y-3">
                {s2Courses.map((course, i) => (
                  <CourseCard key={course.id} course={course} index={i} />
                ))}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {filteredCourses.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="clay flex size-16 items-center justify-center rounded-2xl mb-4">
              <Search className="size-8 text-muted-foreground/40" />
            </div>
            <p className="text-muted-foreground font-medium">No subjects found matching "{searchQuery}"</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
