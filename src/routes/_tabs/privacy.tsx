import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Eye, Fingerprint, Lock, Trash2 } from "lucide-react";
import { SettingsHeader, Toggle } from "./notifications";

export const Route = createFileRoute("/_tabs/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy · Jana Prvt Course" },
      {
        name: "description",
        content: "Control analytics, personalization, and locally stored study data in Jana Prvt Course.",
      },
      { property: "og:title", content: "Privacy · Jana Prvt Course" },
      { property: "og:description", content: "Your data, your rules." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Privacy,
});

const STORAGE_KEY = "janaprvt_privacy_prefs";

const options = [
  { id: "analytics", label: "Usage analytics", hint: "Share anonymous app usage", icon: Eye },
  { id: "personalization", label: "Personalized content", hint: "Tailor recommendations to you", icon: Fingerprint },
  { id: "lockApp", label: "Require unlock", hint: "Ask for device passcode on open", icon: Lock },
] as const;

type PrefId = (typeof options)[number]["id"];

const defaults: Record<PrefId, boolean> = {
  analytics: false,
  personalization: true,
  lockApp: false,
};

function Privacy() {
  const [prefs, setPrefs] = useState<Record<PrefId, boolean>>(defaults);
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setPrefs({ ...defaults, ...(JSON.parse(raw) as Record<PrefId, boolean>) });
    } catch {
      /* ignore */
    }
  }, []);

  const update = (id: PrefId, value: boolean) => {
    setPrefs((prev) => {
      const next = { ...prev, [id]: value };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const clearLocalData = () => {
    localStorage.removeItem("janaprvt_saved_videos");
    setCleared(true);
    window.setTimeout(() => setCleared(false), 2200);
  };

  return (
    <div className="pb-32">
      <SettingsHeader title="Privacy" subtitle="Your data stays on this device by default." />

      <div className="clay mt-6 divide-y divide-border/70 rounded-3xl">
        {options.map(({ id, label, hint, icon: Icon }) => (
          <div key={id} className="flex items-center gap-3 px-4 py-4 first:rounded-t-3xl last:rounded-b-3xl">
            <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Icon className="size-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[1rem] font-semibold">{label}</p>
              <p className="truncate text-[0.8125rem] text-muted-foreground">{hint}</p>
            </div>
            <Toggle on={prefs[id]} onChange={(v) => update(id, v)} />
          </div>
        ))}
      </div>

      <button
        onClick={clearLocalData}
        className="clay mt-4 flex w-full items-center gap-3 rounded-3xl px-4 py-4 text-left active:bg-secondary/60"
      >
        <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-destructive/10 text-destructive">
          <Trash2 className="size-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[1rem] font-semibold text-destructive">Clear saved data</p>
          <p className="truncate text-[0.8125rem] text-muted-foreground">
            {cleared ? "Saved items cleared." : "Removes bookmarks stored on this device"}
          </p>
        </div>
      </button>
    </div>
  );
}
