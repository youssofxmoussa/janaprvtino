import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Bell,
  Bookmark,
  ChevronRight,
  LogOut,
  Moon,
  ShieldCheck,
  Trash2,
  Info,
  Flame,
} from "lucide-react";
import { spring } from "@/components/ios/press";
import { ConfirmSheet } from "@/components/ios/ConfirmSheet";
import { DailyGoalCard } from "@/components/ios/GoalCard";
import { useActivity } from "@/lib/activity";


import { courses } from "@/lib/courses";
import { getSessionUser, isAdmin, supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import avatarJana from "@/assets/avatar-jana.webp";

export const Route = createFileRoute("/_tabs/me")({
  head: () => ({
    meta: [
      { title: "Profile · Jana Prvt Course" },
      {
        name: "description",
        content: "Manage your Jana Prvt Course profile, appearance, notifications, and privacy settings.",
      },
      { property: "og:title", content: "Profile · Jana Prvt Course" },
      { property: "og:description", content: "Your account and app preferences." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Me,
});

const SAVED_KEY = "janaprvt_saved_videos";

function Me() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [admin, setAdmin] = useState(false);
  useEffect(() => {
    void getSessionUser().then((u) => setAdmin(isAdmin(u)));
  }, []);
  const activity = useActivity();
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cleared, setCleared] = useState(false);

  const goal = activity.goalMinutes;
  const savedCount = savedIds.length;
  const savedCourses = savedIds
    .map((id) => courses.find((c) => c.id.toLowerCase() === id.toLowerCase()))
    .filter((c): c is (typeof courses)[number] => Boolean(c));

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SAVED_KEY) || "[]") as string[];
      setSavedIds(saved);
    } catch {
      /* ignore */
    }
  }, []);


  const clearLocalData = () => {
    try {
      localStorage.removeItem(SAVED_KEY);
    } catch {
      /* ignore */
    }
    setSavedIds([]);
    setExpanded(false);
    setConfirmOpen(false);
    setCleared(true);
    setTimeout(() => setCleared(false), 2000);
  };

  const rows = [
    { label: "Notifications", icon: Bell, to: "/notifications" as const },
    { label: "Appearance", icon: Moon, to: "/appearance" as const },
    { label: "Privacy", icon: ShieldCheck, to: "/privacy" as const },
  ];

  return (
    <div className="pb-32 pt-6">
      <h1 className="text-large-title">Me</h1>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
        className="relative mt-5 overflow-hidden rounded-[2rem] bg-primary p-5 shadow-soft"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-primary-foreground/10 blur-2xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-16 size-48 rounded-full bg-primary-foreground/10 blur-2xl"
        />

        <div className="relative flex items-center gap-4">
          <div className="relative shrink-0">
            <div
              aria-hidden="true"
              className="absolute inset-0 rounded-full bg-primary-foreground/25 blur-xl"
            />
            <div className="relative grid size-20 items-end justify-items-center overflow-hidden rounded-full bg-primary-foreground/15 ring-2 ring-primary-foreground/30">
              <img
                src={avatarJana}
                alt="Jana's 3D avatar"
                width={584}
                height={844}
                decoding="async"
                className="h-[5.75rem] w-auto object-contain object-bottom drop-shadow-[0_6px_12px_rgba(0,0,0,0.25)]"
              />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[1.375rem] font-black leading-tight tracking-tight text-primary-foreground">
              Jana
            </p>
            <p className="mt-0.5 truncate text-[0.875rem] text-primary-foreground/70">
              First-year science · Jana Prvt Course
            </p>
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/15 px-2.5 py-1 text-[0.6875rem] font-bold uppercase tracking-widest text-primary-foreground">
              <Flame className="size-3.5" />
              Premium
            </span>
          </div>
        </div>

        <div className="relative mt-5 grid grid-cols-3 gap-2">
          <MiniStat label="Subjects" value={String(courses.length)} />
          <MiniStat label="Saved" value={String(savedCount)} />
          <MiniStat label="Goal" value={`${goal}m`} />
        </div>
      </motion.section>

      <div className="mt-6">
        <DailyGoalCard />
      </div>


      <h2 className="mt-6 px-2 text-[0.75rem] font-bold uppercase tracking-widest text-muted-foreground">
        Preferences
      </h2>
      <div className="clay mt-2 divide-y divide-border rounded-2xl">
        {rows.map(({ label, icon: Icon, to }) => (
          <Link
            key={label}
            to={to}
            preload="render"
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors first:rounded-t-2xl last:rounded-b-2xl active:bg-secondary/60"
          >
            <Icon className="size-5 shrink-0 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate text-[1.0625rem]">{label}</span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>

      <h2 className="mt-6 px-2 text-[0.75rem] font-bold uppercase tracking-widest text-muted-foreground">
        Storage
      </h2>
      <div className="clay mt-2 divide-y divide-border rounded-2xl">
        <button
          onClick={() => savedCount > 0 && setExpanded((v) => !v)}
          className="flex w-full items-center gap-3 rounded-t-2xl px-4 py-3.5 text-left transition-colors active:bg-secondary/60"
        >
          <Bookmark className="size-5 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate text-[1.0625rem]">Saved subjects</span>
          <span className="text-[0.9375rem] font-medium text-muted-foreground">{savedCount}</span>
          {savedCount > 0 && (
            <motion.span animate={{ rotate: expanded ? 90 : 0 }} transition={spring}>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground/60" />
            </motion.span>
          )}
        </button>

        <AnimatePresence initial={false}>
          {expanded && savedCount > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
              className="overflow-hidden"
            >
              {savedCourses.map((c) => (
                <Link
                  key={c.id}
                  to="/subject/$courseId"
                  params={{ courseId: c.id }}
                  className="flex items-center gap-3 px-4 py-3 pl-6 transition-colors active:bg-secondary/60"
                >
                  {c.image ? (
                    <img src={c.image} alt="" className="size-8 shrink-0 object-contain" />
                  ) : (
                    <span className="size-8 shrink-0" />
                  )}
                  <span className="min-w-0 flex-1 truncate text-[0.9375rem]">{c.title}</span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground/50" />
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setConfirmOpen(true)}
          disabled={savedCount === 0}
          className="flex w-full items-center gap-3 rounded-b-2xl px-4 py-3.5 text-left transition-colors active:bg-secondary/60 disabled:opacity-50"
        >
          <Trash2 className="size-5 shrink-0 text-destructive" />
          <span className="min-w-0 flex-1 truncate text-[1.0625rem] text-destructive">
            {cleared ? "Cleared" : "Clear saved items"}
          </span>
        </button>
      </div>

      <ConfirmSheet
        open={confirmOpen}
        title="Clear saved items?"
        message="This removes every saved subject from this device. It can't be undone."
        confirmLabel="Delete"
        onConfirm={clearLocalData}
        onCancel={() => setConfirmOpen(false)}
      />

      <motion.div whileTap={{ scale: 0.97 }} transition={spring}>
        <Link
          to="/streak"
          preload="render"
          className="clay mt-4 flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left"
        >
          <Flame className="size-5 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate text-[1.0625rem]">About Streak</span>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </Link>
      </motion.div>


      {admin && (
        <Link to="/admin" className="clay mt-3 flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left">
          <ShieldCheck className="size-5 shrink-0 text-primary" />
          <span className="min-w-0 flex-1 truncate text-[1.0625rem]">Admin panel</span>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        </Link>
      )}

      <div className="clay mt-3 flex items-center gap-3 rounded-2xl px-4 py-3.5">
        <Info className="size-5 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate text-[1.0625rem]">Version</span>
        <span className="text-[0.9375rem] font-medium text-muted-foreground">1.0.0</span>
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        transition={spring}
        onClick={async () => {
          await queryClient.cancelQueries();
          queryClient.clear();
          await supabase.auth.signOut();
          void navigate({ to: "/login", replace: true });
        }}
        className="clay mt-6 flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left"
      >
        <LogOut className="size-5 shrink-0 text-destructive" />
        <span className="min-w-0 flex-1 truncate text-[1.0625rem] text-destructive">Sign out</span>
      </motion.button>

    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-0.5 rounded-2xl bg-primary-foreground/15 px-2 py-3">
      <span className="text-[1.25rem] font-black leading-none text-primary-foreground">{value}</span>
      <span className="text-[0.6875rem] font-medium text-primary-foreground/70">{label}</span>
    </div>
  );
}
