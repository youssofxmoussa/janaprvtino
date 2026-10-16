import { AnimatePresence, motion } from "motion/react";
import { spring } from "./press";

interface ConfirmSheetProps {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** iOS-style action sheet used for destructive confirmations. */
export function ConfirmSheet({
  open,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  destructive = true,
  onConfirm,
  onCancel,
}: ConfirmSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center px-3 pb-3 safe-bottom"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.button
            aria-label="Dismiss"
            onClick={onCancel}
            className="absolute inset-0 bg-foreground/25 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={spring}
            className="relative w-full max-w-md space-y-2"
          >
            <div className="material overflow-hidden rounded-[18px] shadow-soft">
              <div className="px-5 py-4 text-center">
                <p className="text-[0.9375rem] font-semibold">{title}</p>
                {message && (
                  <p className="mt-1 text-[0.8125rem] leading-relaxed text-muted-foreground">
                    {message}
                  </p>
                )}
              </div>
              <button
                onClick={onConfirm}
                className={`w-full border-t border-border/70 py-3.5 text-[1.0625rem] font-semibold transition-colors active:bg-secondary/60 ${
                  destructive ? "text-destructive" : "text-primary"
                }`}
              >
                {confirmLabel}
              </button>
            </div>

            <button
              onClick={onCancel}
              className="material w-full rounded-[18px] py-3.5 text-[1.0625rem] font-bold text-primary shadow-soft transition-colors active:bg-secondary/60"
            >
              {cancelLabel}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
