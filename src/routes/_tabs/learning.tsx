import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Clock, Flame, Play, BookOpen, Zap } from "lucide-react";
import { spring } from "@/components/ios/press";
import { courses } from "@/lib/courses";
import { StreakFlame } from "@/components/ios/StreakFlame";
import { TodayGoalCard } from "@/components/ios/GoalCard";
import {
  earnedDay,
  minutesLeftToday,
  formatMinutes,
  getSubject,
  streakDays,
  subjectProgress,
  useActivity,
  weekMinutes,
} from "@/lib/activity";

export const Route = createFileRoute("/_tabs/learning")({
  head: () => ({
    meta: [
      { title: "Learning · Jana Prvt Course" },
      {
        name: "description",
        content: "Track your streak, weekly minutes, and the lessons waiting for you today.",
      },
      { property: "og:title", content: "Learning · Jana Prvt Course" },
      { property: "og:description", content: "Your streak, progress, and up-next lessons." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Learning,
});

function Learning() {
  const activity = useActivity();

  const streak = streakDays(activity);
  const minutes = weekMinutes(activity);
  const todayGoalLeft = minutesLeftToday(activity);


  const rows = courses
    .map((c) => {
      const a = getSubject(activity, c.id);
      return { course: c, activity: a, progress: subjectProgress(a) };
    })
    .filter((r) => r.activity.lastOpened > 0)
    .sort((a, b) => b.activity.lastOpened - a.activity.lastOpened);

  const hasActivity = rows.length > 0;

  // Last 7 days, ending today.
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return {
      label: d.toLocaleDateString(undefined, { weekday: "narrow" }),
      active: earnedDay(activity, d),
      today: i === 6,
    };
  });

  // Up next: last opened but unfinished, else the first subject never opened.
  const upNext =
    rows.find((r) => r.progress < 100)?.course ??
    courses.find((c) => getSubject(activity, c.id).lastOpened === 0) ??
    courses[0]!;

  return (
    <div className="pb-32 pt-6">
      <h1 className="text-large-title">Learning</h1>

      <div className="mt-5">
        <TodayGoalCard continueTo={upNext.id} />
      </div>



      <div className="mt-5 grid grid-cols-2 gap-3">
        {[
          { label: "Day streak", value: String(streak), icon: Flame },
          { label: "This week", value: formatMinutes(minutes), icon: Clock },
        ].map(({ label, value, icon: Icon }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: i * 0.06 }}
            className="clay rounded-2xl p-4"
          >
            <Icon className="size-5 text-primary" />
            <p className="mt-3 text-2xl font-bold tracking-tight tabular-nums">{value}</p>
            <p className="text-[0.8125rem] text-muted-foreground">{label}</p>
          </motion.div>
        ))}
      </div>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 0.12 }}
        className="glass-clay mt-3 rounded-2xl p-4"
      >
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-[0.8125rem] font-medium uppercase tracking-wide text-muted-foreground">
            <Zap className="size-3.5 text-primary" />
            Streak week
          </p>
          <p className="text-[0.75rem] text-muted-foreground tabular-nums">
            {todayGoalLeft > 0
              ? `${todayGoalLeft} min of learning left today`
              : "Today earned"}
          </p>
        </div>
        <div className="mt-3 flex items-center justify-between">
          {week.map((day) => (
            <div key={day.label + String(day.today)} className="flex flex-col items-center gap-1">
              {day.active ? (
                <motion.span
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={spring}
                >
                  <StreakFlame className="size-5" />
                </motion.span>
              ) : (
                <Flame
                  className={
                    day.today
                      ? "size-5 text-muted-foreground"
                      : "size-5 text-muted-foreground/40"
                  }
                  strokeWidth={1.8}
                />
              )}
              <span
                className={
                  day.today
                    ? "text-[0.6875rem] font-semibold text-foreground"
                    : "text-[0.6875rem] text-muted-foreground"
                }
              >
                {day.label}
              </span>
            </div>
          ))}
        </div>
      </motion.section>

      <section className="material mt-4 rounded-3xl p-5 shadow-soft">
        <p className="text-[0.8125rem] font-medium tracking-wide text-muted-foreground uppercase">
          Up next
        </p>
        <h2 className="mt-1 text-xl font-semibold break-words">{upNext.title}</h2>
        <p className="text-[0.9375rem] text-muted-foreground">
          {hasActivity ? "Pick up where you left off" : "Start your first session"} ·{" "}
          {upNext.credits} credits
        </p>
        <Link
          to="/subject/$courseId"
          params={{ courseId: upNext.id }}
          preload="render"
          className="mt-4 inline-flex h-[3.25rem] w-full items-center justify-center rounded-lg bg-primary text-[1.0625rem] font-semibold text-primary-foreground shadow-soft transition-transform active:scale-[0.97]"
        >
          <Play className="mr-2 size-4 fill-current" />
          {hasActivity ? "Continue" : "Start course"}
        </Link>
      </section>

      <section className="mt-6">
        <h2 className="text-[1.0625rem] font-semibold">Active Subjects</h2>

        {!hasActivity ? (
          <div className="clay mt-3 flex flex-col items-center gap-2 rounded-2xl px-6 py-10 text-center">
            <div className="grid size-12 place-items-center rounded-2xl bg-primary/10">
              <BookOpen className="size-5 text-primary" />
            </div>
            <p className="text-[0.9375rem] font-semibold">Nothing here yet</p>
            <p className="text-[0.8125rem] text-muted-foreground">
              Open a subject and your streak, minutes and progress will show up here.
            </p>
          </div>
        ) : (
          <div className="clay mt-3 divide-y divide-border rounded-2xl">
            {rows.map(({ course: c, progress }) => (
              <Link
                key={c.id}
                to="/subject/$courseId"
                params={{ courseId: c.id }}
                preload="render"
                className="flex items-center gap-3 p-4 first:rounded-t-2xl last:rounded-b-2xl transition-colors active:bg-secondary/50"
              >
                <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl">
                  {c.image ? (
                    <img src={c.image} alt="" className="size-full object-contain" />
                  ) : (
                    <span className="truncate px-0.5 text-xs font-bold text-primary">
                      {c.id.toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.9375rem] font-medium">{c.title}</p>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={spring}
                    />
                  </div>
                </div>
                <span className="text-[0.8125rem] font-semibold tabular-nums text-muted-foreground">
                  {progress}%
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
