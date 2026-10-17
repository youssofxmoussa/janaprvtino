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
        className="relative border-b border-border px-1 py-5 text-foreground"
      >
        <p className="relative mb-2 text-[0.8125rem] font-semibold text-primary">Jana Prvt Course</p>
        <h1 className="relative text-[2.25rem] font-extrabold leading-none tracking-tight">Control center</h1>
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
              className={`relative flex min-w-0 flex-col items-start gap-2 rounded-[20px] border p-3 text-left ${on ? "border-primary/25 text-primary" : "border-border/40 bg-surface-solid text-foreground"}`}
            >
              {on && <motion.div layoutId="adminTab" className="absolute inset-0 rounded-[20px] bg-primary/10" transition={spring} />}
              <span className="relative grid size-8 place-items-center rounded-xl bg-primary/10 text-primary">
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
