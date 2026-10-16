import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Field } from "@/components/ios/Field";
import { Pressable } from "@/components/ios/press";
import { supabase } from "@/lib/supabase";
import { getActivityLog, getDashboardStats, signOutEverywhere } from "@/lib/content.functions";
import { Card, Notice, SectionTitle, useAction } from "./ui";

type Stats = Awaited<ReturnType<typeof getDashboardStats>>;
type Log = Awaited<ReturnType<typeof getActivityLog>>;

export function AdminDashboard() {
  const stats = useServerFn(getDashboardStats);
  const [s, setS] = useState<Stats | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    stats().then(setS).catch((e: Error) => setErr(e.message));
  }, [stats]);
  const tiles: [string, number | undefined][] = [
    ["Students", s?.students],
    ["Active this week", s?.activeWeek],
    ["Paused", s?.paused],
    ["Sessions", s?.lessons],
    ["Videos", s?.videos],
    ["PDFs", s?.pdfs],
    ["Questions", s?.questions],
  ];
  return (
    <div className="space-y-3">
      {err && <Notice msg={{ ok: false, text: err }} />}
      <div className="grid grid-cols-2 gap-3">
        {tiles.map(([label, n]) => (
          <Card key={label} className="relative overflow-hidden">
            <div aria-hidden className="absolute -top-6 -right-6 size-20 rounded-full bg-primary/10" />
            <p className="relative text-[0.75rem] font-semibold text-muted-foreground uppercase">{label}</p>
            <p className="relative mt-1 text-[2rem] font-extrabold tracking-tight text-primary">{n ?? "–"}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function AdminActivity() {
  const log = useServerFn(getActivityLog);
  const [rows, setRows] = useState<Log | null>(null);
  useEffect(() => {
    log().then(setRows).catch(() => setRows([]));
  }, [log]);
  return (
    <div className="space-y-2">
      <SectionTitle>Latest admin actions</SectionTitle>
      <Card className="py-1">
        {rows === null && <p className="py-6 text-center text-muted-foreground">Loading…</p>}
        {rows?.length === 0 && <p className="py-6 text-center text-muted-foreground">No actions yet.</p>}
        {rows?.map((r, i) => (
          <div key={i} className="border-b border-border/50 py-2.5 last:border-0">
            <p className="text-[0.875rem] font-semibold">{r.action}{r.target ? ` · ${r.target}` : ""}</p>
            <p className="text-[0.75rem] text-muted-foreground">{r.actor} · {new Date(r.at).toLocaleString()}</p>
          </div>
        ))}
      </Card>
    </div>
  );
}

export function AdminSettings() {
  const navigate = useNavigate();
  const everywhere = useServerFn(signOutEverywhere);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const { busy, msg, run } = useAction();

  const signOutAll = async () => {
    const r = await run(() => everywhere());
    if (r) {
      await supabase.auth.signOut();
      await navigate({ to: "/login", replace: true });
    }
  };

  return (
    <div className="space-y-4">
      <SectionTitle>Change your password</SectionTitle>
      <Card className="space-y-3">
        <Field label="Current password" id="cur-pass" reveal autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        <Field label="New password" id="next-pass" reveal autoComplete="new-password" maxLength={72} value={next} onChange={(e) => setNext(e.target.value)} />
        <Notice msg={msg} />
        <Pressable
          size="md"
          disabled={busy || next.length < 10 || !current}
          onClick={() =>
            run(async () => {
              const { error } = await supabase.auth.updateUser({ password: next, current_password: current } as never);
              if (error) throw new Error("Couldn't change password. Check your current password.");
              setCurrent(""); setNext("");
            }, "Password changed.")
          }
        >
          Update password
        </Pressable>
        <p className="px-1 text-[0.75rem] text-muted-foreground">Use at least 10 characters for the admin account.</p>
      </Card>
      <SectionTitle>Sessions</SectionTitle>
      <Card className="space-y-2">
        <Pressable size="md" variant="fill" disabled={busy} onClick={signOutAll}>Sign out of all devices</Pressable>
        <Pressable size="md" variant="ghost" className="text-destructive" onClick={async () => { await supabase.auth.signOut(); await navigate({ to: "/login", replace: true }); }}>
          Sign out
        </Pressable>
      </Card>
    </div>
  );
}
