import { useEffect, useState } from "react";

/**
 * Moving watermark with the viewer's email, the way big course sites mark
 * every stream so a screen recording points back to the account that leaked it.
 */
export function Watermark({ text, tiled = false, count = 60 }: { text: string; tiled?: boolean; count?: number }) {
  const [pos, setPos] = useState({ x: 10, y: 15 });

  useEffect(() => {
    if (tiled) return;
    const id = window.setInterval(() => {
      setPos({ x: 5 + Math.random() * 55, y: 8 + Math.random() * 75 });
    }, 5000);
    return () => window.clearInterval(id);
  }, [tiled]);

  if (!text) return null;

  if (tiled) {
    return (
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 overflow-hidden select-none">
        <div className="flex h-full w-full flex-wrap content-start gap-x-16 gap-y-40 -rotate-[25deg] p-8 opacity-[0.09]">
          {Array.from({ length: count }, (_, i) => (
            <span key={i} className="whitespace-nowrap text-[0.875rem] font-bold text-foreground">
              {text}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <span
      aria-hidden="true"
      style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
      className="pointer-events-none absolute z-10 select-none whitespace-nowrap rounded-md bg-background/20 px-1.5 py-0.5 text-[0.6875rem] font-semibold text-foreground/40 transition-all duration-1000"
    >
      {text}
    </span>
  );
}
