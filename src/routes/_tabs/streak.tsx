import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ChevronLeft, Flame, Clock3, TrendingUp, CalendarDays, Zap } from "lucide-react";
import { spring } from "@/components/ios/press";
import { StreakFlame } from "@/components/ios/StreakFlame";
import { useActivity } from "@/lib/activity";

import arrowImg from "@/assets/scribble-arrow.png";


export const Route = createFileRoute("/_tabs/streak")({
  head: () => ({
    meta: [
      { title: "About Streak · Jana Prvt Course" },
      {
        name: "description",
        content:
          "Learn how the Jana Prvt Course day streak is calculated, when the flame icons update, and how weekly minutes add up.",
      },
      { property: "og:title", content: "About Streak · Jana Prvt Course" },
      { property: "og:description", content: "How Jana Prvt Course streaks and weekly minutes work." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StreakPage,
});

const buildRules = (goalMinutes: number) => [
  {
    icon: Clock3,
    title: "What actually counts",
    body: "Only real learning counts: watching a lecture video, reading a PDF, or answering quiz questions inside a subject. Just opening the app does nothing.",
    note: "lesson open = clock runs",
  },
  {
    icon: Zap,
    title: "Your daily goal earns the day",
    body: `Your goal is currently ${goalMinutes} minutes. Reach it in a single day and that day's flame lights up. You can change it any time from the Me tab.`,
    note: goalMinutes + " min then flame lit",
  },

  {
    icon: TrendingUp,
    title: "How the streak grows",
    body: "Your streak is the number of consecutive earned days, ending today (or yesterday if you have not hit the goal yet today).",
    note: "miss a day, back to 0",
  },
  {
    icon: CalendarDays,
    title: "This week",
    body: "The minutes card adds up all time spent in the app over the last 7 days, today included. That one tracks effort, not the streak.",
    note: "rolling 7 days",
  },
];

/** Hand-drawn curved arrow, tinted with currentColor via CSS mask. */
function ScribbleArrow({ className, flip }: { className?: string; flip?: boolean }) {
  return (
    <motion.span
      aria-hidden="true"
      className={className}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
      style={{
        display: "block",
        backgroundColor: "currentColor",
        WebkitMaskImage: `url(${arrowImg})`,
        maskImage: `url(${arrowImg})`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        transform: flip ? "scaleX(-1)" : undefined,
      }}
    />
  );
}


function StreakPage() {
  const activity = useActivity();
  const rules = buildRules(activity.goalMinutes);

  return (
    <div className="w-full pb-24">
      <header className="glass-flat sticky top-3 z-40 mt-3 flex items-center gap-2 rounded-2xl px-2 py-2">
        <Link
          to="/me"
          preload="render"
          aria-label="Back"
          className="grid size-9 shrink-0 place-items-center rounded-full text-primary transition-transform active:scale-90"
        >
          <ChevronLeft className="size-5" strokeWidth={2.5} />
        </Link>
        <div className="min-w-0">
          <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-muted-foreground">
            Help
          </p>
          <h1 className="truncate text-lg font-bold tracking-tight">About Streak</h1>
        </div>
      </header>

      {/* Hero */}
      <motion.section
        initial={{ y: 18, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={spring}
        className="mt-8 w-full"
      >
        <p className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-primary">
          The streak, explained
        </p>
        <h2 className="mt-2 text-[2rem] leading-[1.05] font-black tracking-tight sm:text-[2.5rem]">
          Show up.
          <br />
          <span className="text-muted-foreground">The flame does the rest.</span>
        </h2>
      </motion.section>

      {/* Legend, full-width, no cards */}
      <section className="mt-10 w-full">
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-5 gap-y-8">
          <div className="grid size-14 shrink-0 place-items-center">
            <Flame className="size-10 text-muted-foreground/40" strokeWidth={1.6} />
          </div>
          <div className="min-w-0">
            <p className="text-[1.0625rem] font-bold">Grey flame</p>
            <p className="mt-0.5 text-[0.875rem] leading-relaxed text-muted-foreground">
              Goal not reached that day. It stays grey until you log enough real learning time.
            </p>
          </div>

          <div className="grid size-14 shrink-0 place-items-center">
            <motion.span
              initial={{ scale: 0.5, opacity: 0, rotate: -12 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ ...spring, delay: 0.2 }}
            >
              <StreakFlame className="size-10" />
            </motion.span>
          </div>
          <div className="min-w-0">
            <p className="text-[1.0625rem] font-bold">Lit flame</p>
            <p className="mt-0.5 text-[0.875rem] leading-relaxed text-muted-foreground">
              Day earned. It flips the moment you cross the daily learning goal.
            </p>
          </div>
        </div>

        <div className="relative mt-2 flex items-start gap-2 pl-6">
          <ScribbleArrow className="h-16 w-14 shrink-0 text-primary/70" />
          <p className="mt-6 -ml-2 max-w-[15rem] text-[0.8125rem] font-semibold italic leading-snug text-primary/80">
            seven of these in a row = a full week
          </p>
        </div>
      </section>

      <div className="my-10 h-px w-full bg-border" />

      {/* Rules — full width rows */}
      <section className="w-full space-y-9">
        {rules.map((r, i) => (
          <motion.div
            key={r.title}
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ ...spring, delay: 0.05 * i }}
            className="w-full"
          >
            <div className="flex items-baseline gap-3">
              <span className="text-[0.75rem] font-black tabular-nums text-primary/60">
                0{i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <r.icon className="size-4 shrink-0 text-primary" strokeWidth={2.2} />
                  <h3 className="truncate text-[1.0625rem] font-bold tracking-tight">{r.title}</h3>
                </div>
                <p className="mt-1.5 text-[0.9375rem] leading-relaxed text-muted-foreground">
                  {r.body}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <ScribbleArrow className="h-8 w-7 shrink-0 text-primary/60" flip />
                  <span className="text-[0.8125rem] font-semibold italic text-primary/75">
                    {r.note}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </section>

      {/* Sticky action, always clickable above the tab bar */}
      <div className="pointer-events-none sticky bottom-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] z-40 mt-12 pb-2">
        <motion.div
          whileTap={{ scale: 0.97 }}
          transition={spring}
          className="pointer-events-auto"
        >
          <Link to="/me" preload="render" className="glass-flat flex h-12 w-full items-center justify-center rounded-2xl text-[1.0625rem] font-semibold text-primary">
            Got it
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
