import { useCallback, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
    <Dialog open={open} onOpenChange={(value) => { if (!value) onClose(); }}>
      <DialogContent aria-describedby={undefined} className="top-auto bottom-3 max-w-md translate-y-0 p-5 sm:top-1/2 sm:bottom-auto sm:-translate-y-1/2">
        <div aria-hidden="true" className="mx-auto h-1 w-9 rounded-full bg-border sm:hidden" />
        <DialogHeader className="pr-7 text-left">
          <DialogTitle className="text-[1.125rem] leading-snug">{title}</DialogTitle>
        </DialogHeader>
        <div className="min-w-0 space-y-4">{children}</div>
      </DialogContent>
    </Dialog>
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
          "min-h-28 w-full rounded-xl border border-border/60 bg-secondary/40 px-4 py-3 text-[1rem] text-foreground outline-none transition-colors focus:border-primary/40 focus:bg-surface-solid focus:ring-4 focus:ring-primary/10",
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
