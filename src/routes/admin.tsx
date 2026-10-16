import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import { ChevronLeft } from "lucide-react";
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

const TABS = ["Dashboard", "Students", "Courses", "Quiz", "Activity", "Settings"] as const;
type Tab = (typeof TABS)[number];

function Admin() {
  const [tab, setTab] = useState<Tab>("Dashboard");
  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-2xl flex-col gap-4 bg-background px-4 pt-4 pb-16 safe-top">
      <header className="flex items-center justify-between">
        <Link to="/courses" className="flex items-center gap-0.5 text-[0.9375rem] font-semibold text-primary">
          <ChevronLeft className="size-5" /> App
        </Link>
      </header>
      <h1 className="text-[2rem] font-bold tracking-tight">Admin</h1>

      <nav className="glass-flat sticky top-2 z-30 -mx-1 flex gap-1 overflow-x-auto rounded-2xl p-1">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`relative h-8 shrink-0 px-3 text-[0.8125rem] font-semibold ${tab === t ? "text-primary" : "text-muted-foreground"}`}>
            {tab === t && <motion.div layoutId="adminTab" className="absolute inset-0 rounded-xl bg-primary/10" transition={spring} />}
            <span className="relative">{t}</span>
          </button>
        ))}
      </nav>

      {tab === "Dashboard" && <AdminDashboard />}
      {tab === "Students" && <AdminStudents />}
      {tab === "Courses" && <AdminCourses />}
      {tab === "Quiz" && <AdminQuiz />}
      {tab === "Activity" && <AdminActivity />}
      {tab === "Settings" && <AdminSettings />}
    </main>
  );
}
