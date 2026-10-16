import { motion, type HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";

export const spring = { type: "spring" as const, stiffness: 400, damping: 30 };

type PressableProps = HTMLMotionProps<"button"> & {
  variant?: "primary" | "ghost" | "fill";
  size?: "lg" | "md";
};

export function Pressable({
  className,
  variant = "primary",
  size = "lg",
  ...props
}: PressableProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={spring}
      className={cn(
        "inline-flex w-full items-center justify-center font-semibold outline-none select-none",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        size === "lg"
          ? "h-[3.25rem] rounded-lg text-[1.0625rem]"
          : "h-11 rounded-md text-[0.9375rem]",
        variant === "primary" && "bg-primary text-primary-foreground shadow-soft",
        variant === "fill" && "bg-secondary text-secondary-foreground",
        variant === "ghost" && "text-primary",
        className,
      )}
      {...props}
    />
  );
}
