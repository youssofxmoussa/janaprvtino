import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft, Bell, BookOpen, Trophy, Lightbulb } from "lucide-react";
import { motion } from "motion/react";

export const Route = createFileRoute("/_tabs/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications · Jana Prvt Course" },
      {
        name: "description",
        content: "Choose which Jana Prvt Course study reminders and course updates you receive.",
      },
      { property: "og:title", content: "Notifications · Jana Prvt Course" },
      { property: "og:description", content: "Control your study reminders and course alerts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Notifications,
});

const STORAGE_KEY = "janaprvt_notification_prefs";

const options = [
  { id: "reminders", label: "Study reminders", hint: "A nudge at your daily study time", icon: Bell },
  { id: "newLessons", label: "New lessons", hint: "When a subject gets new material", icon: BookOpen },
  { id: "progress", label: "Progress milestones", hint: "Celebrate streaks and completions", icon: Trophy },
  { id: "tips", label: "Tips & highlights", hint: "Occasional learning suggestions", icon: Lightbulb },
] as const;

type PrefId = (typeof options)[number]["id"];

const defaults: Record<PrefId, boolean> = {
  reminders: true,
  newLessons: true,
  progress: false,
  tips: false,
};

export function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative h-[1.9rem] w-[3.25rem] shrink-0 rounded-full transition-colors duration-300 ${
        on ? "bg-primary" : "bg-secondary"
      }`}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 34 }}
        className="absolute top-[0.175rem] size-[1.55rem] rounded-full bg-white shadow-md"
        style={{ left: on ? "1.55rem" : "0.175rem" }}
      />
    </button>
  );
}

export function SettingsHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="pt-6">
      <Link
        to="/me"
        preload="render"
        className="-ml-1 flex items-center gap-0.5 text-[0.9375rem] font-medium text-primary active:opacity-60"
      >
        <ChevronLeft className="size-5" />
        Me
      </Link>
      <h1 className="mt-2 text-large-title tracking-tight">{title}</h1>
      <p className="mt-1 text-[0.9375rem] leading-relaxed text-muted-foreground">{subtitle}</p>
    </header>
  );
}

function Notifications() {
  const [prefs, setPrefs] = useState<Record<PrefId, boolean>>(defaults);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setPrefs({ ...defaults, ...(JSON.parse(raw) as Record<PrefId, boolean>) });
    } catch {
      /* ignore */
    }
  }, []);

  const update = (id: PrefId, value: boolean) => {
    setPrefs((prev) => {
      const next = { ...prev, [id]: value };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  return (
    <div className="pb-32">
      <SettingsHeader title="Notifications" subtitle="Only the alerts you actually want." />

      <div className="clay mt-6 divide-y divide-border/70 rounded-3xl">
        {options.map(({ id, label, hint, icon: Icon }) => (
          <div key={id} className="flex items-center gap-3 px-4 py-4 first:rounded-t-3xl last:rounded-b-3xl">
            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Icon className="size-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[1rem] font-semibold">{label}</p>
              <p className="truncate text-[0.8125rem] text-muted-foreground">{hint}</p>
            </div>
            <Toggle on={prefs[id]} onChange={(v) => update(id, v)} />
          </div>
        ))}
      </div>

      <p className="mt-4 px-2 text-[0.8125rem] leading-relaxed text-muted-foreground">
        Preferences are saved on this device instantly.
      </p>
    </div>
  );
}
