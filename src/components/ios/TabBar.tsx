import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "motion/react";
import { GraduationCap, LayoutGrid, User } from "lucide-react";
import { spring } from "./press";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/courses", label: "Courses", icon: GraduationCap },
  { to: "/learning", label: "Learning", icon: LayoutGrid },
  { to: "/me", label: "Me", icon: User },
] as const;

export function TabBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 safe-bottom">
      <div className="glass-clay pointer-events-auto flex w-full max-w-md items-center justify-around rounded-3xl px-2 py-1.5">
        {tabs.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              preload="render"
              resetScroll
              className="relative flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-2"
            >
              {active && (
                <motion.span
                  layoutId="tab-pill"
                  transition={spring}
                  className="absolute inset-0 rounded-2xl bg-secondary/80"
                />
              )}
              <motion.span
                whileTap={{ scale: 0.9 }}
                transition={spring}
                className="relative flex flex-col items-center gap-0.5"
              >
                <Icon
                  className={cn(
                    "size-[1.375rem] transition-colors",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                  strokeWidth={active ? 2.4 : 1.9}
                />
                <span
                  className={cn(
                    "text-[0.6875rem] font-medium transition-colors",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {label}
                </span>
              </motion.span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
