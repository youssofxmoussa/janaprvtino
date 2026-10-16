import { motion } from "motion/react";
import { Link } from "@tanstack/react-router";
import { Play, Sparkles } from "lucide-react";
import { spring } from "@/components/ios/press";
import { StreakFlame } from "@/components/ios/StreakFlame";
import {
  GOAL_OPTIONS,
  minutesLeftToday,
  setGoalMinutes,
  suggestedGoal,
  todayFocusMinutes,
  todayGoalPercent,
  useActivity,
  type ActivityState,
} from "@/lib/activity";

function message(done: number, goal: number, left: number) {
  if (done <= 0) return "Let's get started";
  if (done >= goal * 1.5) return "Goal crushed 🔥";
  if (left === 0) return "Goal complete — your streak is protected";
  return `${left} ${left === 1 ? "minute" : "minutes"} to go`;
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
      <motion.div
        className="h-full rounded-full bg-primary"
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={spring}
      />
    </div>
  );
}

/** Big goal card with the goal picker — used on the Me tab. */
export function DailyGoalCard() {
  const activity = useActivity();
  return <GoalCardBody activity={activity} picker />;
}

/** Compact today's-goal card with a continue action — used on Learning. */
export function TodayGoalCard({ continueTo }: { continueTo?: string | undefined }) {
  const activity = useActivity();
  return <GoalCardBody activity={activity} continueTo={continueTo} />;
}

function GoalCardBody({
  activity,
  picker,
  continueTo,
}: {
  activity: ActivityState;
  picker?: boolean | undefined;
  continueTo?: string | undefined;
}) {
  const goal = activity.goalMinutes;
  const done = todayFocusMinutes(activity);
  const percent = todayGoalPercent(activity);
  const left = minutesLeftToday(activity);
  const complete = left === 0;
  const suggestion = suggestedGoal(activity);

  return (
    <section className="clay rounded-3xl p-5">
      <div className="flex items-center justify-between">
        <p className="text-[0.75rem] font-bold uppercase tracking-widest text-muted-foreground">
          {picker ? "Daily study goal" : "Today's goal"}
        </p>
        {complete ? (
          <motion.span
            initial={{ scale: 0.5, opacity: 0, rotate: -12 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={spring}
          >
            <StreakFlame className="size-6" />
          </motion.span>
        ) : null}
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        <motion.span
          key={done}
          initial={{ y: 6, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={spring}
          className="text-[2.25rem] font-black leading-none tabular-nums tracking-tight"
        >
          {done}m
        </motion.span>
        <span className="text-[1.0625rem] font-semibold text-muted-foreground tabular-nums">
          / {goal}m
        </span>
      </div>

      <div className="mt-3">
        <ProgressBar percent={percent} />
      </div>

      <p
        className={`mt-2 text-[0.875rem] font-medium ${
          complete ? "text-primary" : "text-muted-foreground"
        }`}
      >
        {message(done, goal, left)}
      </p>

      {picker ? (
        <>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {GOAL_OPTIONS.map((value) => (
              <button
                key={value}
                onClick={() => setGoalMinutes(value)}
                aria-pressed={goal === value}
                className={`rounded-2xl py-3 text-[0.875rem] font-bold transition-all active:scale-95 ${
                  goal === value
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "bg-secondary/60 text-foreground"
                }`}
              >
                {value}m
              </button>
            ))}
          </div>

          {suggestion !== null && suggestion !== goal ? (
            <button
              onClick={() => setGoalMinutes(suggestion)}
              className="mt-3 flex w-full items-center gap-2 rounded-2xl bg-secondary/60 px-3 py-2.5 text-left transition-transform active:scale-[0.98]"
            >
              <Sparkles className="size-4 shrink-0 text-primary" />
              <span className="min-w-0 flex-1 text-[0.8125rem] text-muted-foreground">
                You study around {suggestion} min a day — use {suggestion}m?
              </span>
              <span className="text-[0.8125rem] font-bold text-primary">Apply</span>
            </button>
          ) : null}
        </>
      ) : null}

      {continueTo ? (
        <Link
          to="/subject/$courseId"
          params={{ courseId: continueTo }}
          preload="render"
          className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-[1rem] font-semibold text-primary-foreground shadow-soft transition-transform active:scale-[0.97]"
        >
          <Play className="mr-2 size-4 fill-current" />
          Continue studying
        </Link>
      ) : null}
    </section>
  );
}
