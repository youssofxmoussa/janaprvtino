import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState, type ReactNode } from "react";
import { spring } from "@/components/ios/press";
import { cn } from "@/lib/utils";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("clay rounded-[22px] p-4", className)}>{children}</section>;
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between px-1">
      <h2 className="text-[0.8125rem] font-semibold tracking-wide text-muted-foreground uppercase">{children}</h2>
      {action}
    </div>
  );
}

/** iOS bottom sheet for forms. */
export function Sheet({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[90] flex items-end justify-center px-3 pb-3 safe-bottom" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-foreground/25 backdrop-blur-[2px]" />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={spring}
            className="material relative max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-[22px] p-5 shadow-soft"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[1.0625rem] font-bold">{title}</h3>
              <button onClick={onClose} className="text-[0.9375rem] font-semibold text-primary">Done</button>
            </div>
            <div className="space-y-3">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Row({ children, onClick, className }: { children: ReactNode; onClick?: (() => void) | undefined; className?: string }) {
  const C = onClick ? "button" : "div";
  return (
    <C onClick={onClick} className={cn("flex w-full items-center gap-3 border-b border-border/50 py-3 text-left last:border-0", onClick && "active:opacity-60", className)}>
      {children}
    </C>
  );
}

export function Pill({ tone, children }: { tone: "ok" | "warn" | "info"; children: ReactNode }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 text-[0.6875rem] font-bold",
        tone === "ok" && "bg-primary/10 text-primary",
        tone === "warn" && "bg-destructive/10 text-destructive",
        tone === "info" && "bg-secondary text-muted-foreground",
      )}
    >
      {children}
    </span>
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  const { label, className, ...rest } = props;
  return (
    <label className="block">
      <span className="mb-1 block px-1 text-[0.6875rem] font-medium tracking-wide text-muted-foreground uppercase">{label}</span>
      <textarea
        {...rest}
        className={cn(
          "min-h-24 w-full rounded-lg border border-border/60 bg-secondary/70 px-4 py-3 text-[1rem] outline-none focus:border-primary/60 focus:bg-surface-solid",
          className,
        )}
      />
    </label>
  );
}

/** Runs a server action with busy + message state. */
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const run = useCallback(async <T,>(fn: () => Promise<T>, success?: string): Promise<T | undefined> => {
    setBusy(true);
    setMsg(null);
    try {
      const r = await fn();
      if (success) setMsg({ ok: true, text: success });
      return r;
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Something went wrong." });
      return undefined;
    } finally {
      setBusy(false);
    }
  }, []);
  return { busy, msg, setMsg, run };
}

export function Notice({ msg }: { msg: { ok: boolean; text: string } | null }) {
  if (!msg) return null;
  return (
    <p role="status" className={cn("rounded-xl px-3 py-2 text-[0.8125rem] font-medium", msg.ok ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive")}>
      {msg.text}
    </p>
  );
}

export const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "Never";
