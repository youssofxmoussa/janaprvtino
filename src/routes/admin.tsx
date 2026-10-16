import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import { Activity, BookOpen, ChevronLeft, HelpCircle, LayoutGrid, Settings, ShieldCheck, Users } from "lucide-react";
import { getSessionUser, isAdmin } from "@/lib/supabase";
import { spring } from "@/components/ios/press";
import { AdminStudents } from "@/components/admin/AdminStudents";
import { AdminCourses, AdminQuiz } from "@/components/admin/AdminCourses";
import { AdminActivity, AdminDashboard, AdminSettings } from "@/components/admin/AdminOverview";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async () => {
    const user = await getSessionUser();
    if (!user) throw redirect({ to: "/login", replace: true });
    if (!isAdmin(user)) throw redirect({ to: "/courses", replace: true });
  },
  head: () => ({
    meta: [
      { title: "Admin · Jana Prvt Course" },
      { name: "robots", content: "noindex, nofollow" },
      { name: "description", content: "Admin area for Jana Prvt Course." },
      { property: "og:title", content: "Admin · Jana Prvt Course" },
      { property: "og:description", content: "Admin area for Jana Prvt Course." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Admin,
});

const TABS = [
  { id: "Dashboard", icon: LayoutGrid, hint: "Overview" },
  { id: "Students", icon: Users, hint: "Accounts" },
  { id: "Courses", icon: BookOpen, hint: "Sessions & files" },
  { id: "Quiz", icon: HelpCircle, hint: "Questions" },
  { id: "Activity", icon: Activity, hint: "Audit log" },
  { id: "Settings", icon: Settings, hint: "Security" },
] as const;
type Tab = (typeof TABS)[number]["id"];

function Admin() {
  const [tab, setTab] = useState<Tab>("Dashboard");
  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-2xl flex-col gap-5 overflow-x-hidden bg-background px-4 pt-4 pb-16 safe-top">
      <header className="flex items-center justify-between">
        <Link to="/courses" className="flex items-center gap-0.5 text-[0.9375rem] font-semibold text-primary">
          <ChevronLeft className="size-5" /> App
        </Link>
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-[0.75rem] font-bold text-primary">
          <ShieldCheck className="size-3.5" /> Secure admin
        </span>
      </header>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
        className="relative overflow-hidden rounded-[28px] bg-primary p-6 text-primary-foreground shadow-lift"
      >
        <div aria-hidden className="absolute -top-16 -right-10 size-48 rounded-full bg-primary-foreground/15 blur-2xl" />
        <div aria-hidden className="absolute -bottom-20 -left-10 size-56 rounded-full bg-primary-foreground/10 blur-3xl" />
        <p className="relative text-[0.8125rem] font-semibold opacity-80">Jana Prvt Course</p>
        <h1 className="relative text-[2.25rem] font-extrabold leading-none tracking-tight">Control center</h1>
        <p className="relative mt-2 max-w-xs text-[0.875rem] opacity-85">Manage students, subjects, sessions, files and quizzes in one place.</p>
      </motion.section>

      <nav className="grid grid-cols-3 gap-2">
        {TABS.map((t, i) => {
          const Icon = t.icon;
          const on = tab === t.id;
          return (
            <motion.button
              key={t.id}
              onClick={() => setTab(t.id)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: i * 0.03 }}
              whileTap={{ scale: 0.95 }}
              className={`relative flex flex-col items-start gap-2 rounded-[20px] p-3 text-left ${on ? "text-primary-foreground" : "clay text-foreground"}`}
            >
              {on && <motion.div layoutId="adminTab" className="absolute inset-0 rounded-[20px] bg-primary shadow-lift" transition={spring} />}
              <span className={`relative grid size-8 place-items-center rounded-xl ${on ? "bg-primary-foreground/20" : "bg-primary/10 text-primary"}`}>
                <Icon className="size-4" />
              </span>
              <span className="relative">
                <span className="block text-[0.875rem] font-bold leading-tight">{t.id}</span>
                <span className={`block text-[0.6875rem] font-medium ${on ? "opacity-80" : "text-muted-foreground"}`}>{t.hint}</span>
              </span>
            </motion.button>
          );
        })}
      </nav>

      <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        {tab === "Dashboard" && <AdminDashboard />}
        {tab === "Students" && <AdminStudents />}
        {tab === "Courses" && <AdminCourses />}
        {tab === "Quiz" && <AdminQuiz />}
        {tab === "Activity" && <AdminActivity />}
        {tab === "Settings" && <AdminSettings />}
      </motion.div>
    </main>
  );
}
