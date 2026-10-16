import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  reveal?: boolean;
};

export function Field({ label, reveal, className, id, ...props }: FieldProps) {
  const [shown, setShown] = useState(false);
  const inputId = id ?? label.toLowerCase();

  return (
    <div className="relative">
      <label
        htmlFor={inputId}
        className="pointer-events-none absolute top-2 left-4 text-[0.6875rem] font-medium tracking-wide text-muted-foreground uppercase"
      >
        {label}
      </label>
      <input
        id={inputId}
        type={reveal ? (shown ? "text" : "password") : props.type}
        className={cn(
          "h-[3.5rem] w-full rounded-lg bg-secondary/70 px-4 pt-5 pb-1.5 text-[1.0625rem] text-foreground",
          "border border-border/60 outline-none transition-colors placeholder:text-muted-foreground/70",
          "focus:border-primary/60 focus:bg-surface-solid",
          reveal && "pr-12",
          className,
        )}
        {...props}
      />
      {reveal && (
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          aria-label={shown ? "Hide password" : "Show password"}
          className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-2 text-muted-foreground"
        >
          {shown ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
        </button>
      )}
    </div>
  );
}
