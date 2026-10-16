import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Moon, Sun, SunMoon, Type, Zap, Bold } from "lucide-react";
import { spring } from "@/components/ios/press";
import { SettingsHeader, Toggle } from "./notifications";
import {
  defaultAppearance,
  readAppearance,
  saveAppearance,
  type AppearanceSettings,
  type TextSize,
  type ThemeMode,
} from "@/lib/appearance";

export const Route = createFileRoute("/_tabs/appearance")({
  head: () => ({
    meta: [
      { title: "Appearance · Jana Prvt Course" },
      {
        name: "description",
        content: "Switch between light and dark, tune text size, and reduce motion in Jana Prvt Course.",
      },
      { property: "og:title", content: "Appearance · Jana Prvt Course" },
      { property: "og:description", content: "Make Jana Prvt Course look and feel the way you like." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Appearance,
});

const themes: { id: ThemeMode; label: string; icon: typeof Sun }[] = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "Auto", icon: SunMoon },
];

const sizes: { id: TextSize; label: string; sample: string }[] = [
  { id: "small", label: "Small", sample: "text-[0.8125rem]" },
  { id: "default", label: "Default", sample: "text-[0.9375rem]" },
  { id: "large", label: "Large", sample: "text-[1.0625rem]" },
];

function Appearance() {
  const [settings, setSettings] = useState<AppearanceSettings>(defaultAppearance);

  useEffect(() => {
    setSettings(readAppearance());
  }, []);

  const update = (patch: Partial<AppearanceSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveAppearance(next);
      return next;
    });
  };

  return (
    <div className="pb-32">
      <SettingsHeader title="Appearance" subtitle="Tune how Jana Prvt Course looks on this device." />

      <section className="mt-6">
        <h2 className="px-2 text-[0.75rem] font-bold uppercase tracking-widest text-muted-foreground">
          Theme
        </h2>
        <div className="clay mt-2 grid grid-cols-3 gap-2 rounded-3xl p-2">
          {themes.map(({ id, label, icon: Icon }) => {
            const active = settings.theme === id;
            return (
              <button
                key={id}
                onClick={() => update({ theme: id })}
                className={`flex flex-col items-center gap-1.5 rounded-2xl px-2 py-4 transition-all active:scale-95 ${
                  active ? "bg-primary text-primary-foreground shadow-soft" : "bg-secondary/50"
                }`}
              >
                <Icon className="size-5" />
                <span className="text-[0.8125rem] font-semibold">{label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="px-2 text-[0.75rem] font-bold uppercase tracking-widest text-muted-foreground">
          Text size
        </h2>
        <div className="clay mt-2 flex flex-col gap-1 rounded-[18px] p-1.5">
          {sizes.map(({ id, label, sample }) => {
            const active = settings.textSize === id;
            return (
              <button
                key={id}
                onClick={() => update({ textSize: id })}
                className="relative flex items-center gap-3 rounded-[14px] px-3 py-3 text-left"
              >
                {active && (
                  <motion.span
                    layoutId="textsize-pill"
                    transition={spring}
                    className="absolute inset-0 rounded-[14px] bg-primary/10"
                  />
                )}
                <Type
                  className={`relative size-4 shrink-0 opacity-70 ${active ? "text-primary" : ""}`}
                />
                <span
                  className={`relative min-w-0 flex-1 truncate font-semibold ${sample} ${
                    active ? "text-primary" : ""
                  }`}
                >
                  {label}
                </span>
                {active && (
                  <span className="relative text-[0.8125rem] font-bold text-primary">Selected</span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="px-2 text-[0.75rem] font-bold uppercase tracking-widest text-muted-foreground">
          Accessibility
        </h2>
        <div className="clay mt-2 divide-y divide-border/70 rounded-3xl">
         
          <Row
            icon={Bold}
            label="Bold text"
            hint="Heavier type for easier reading"
            on={settings.boldText}
            onChange={(v) => update({ boldText: v })}
          />
        </div>
      </section>

      <p className="mt-4 px-2 text-[0.8125rem] leading-relaxed text-muted-foreground">
        These settings apply instantly and are remembered on this device.
      </p>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  hint,
  on,
  onChange,
}: {
  icon: typeof Zap;
  label: string;
  hint: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-4 first:rounded-t-3xl last:rounded-b-3xl">
      <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-4.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[1rem] font-semibold">{label}</p>
        <p className="truncate text-[0.8125rem] text-muted-foreground">{hint}</p>
      </div>
      <Toggle on={on} onChange={onChange} />
    </div>
  );
}
