import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, UserPlus, Users, ChevronRight } from "lucide-react";
import { Field } from "@/components/ios/Field";
import { Pressable } from "@/components/ios/press";
import { ConfirmSheet } from "@/components/ios/ConfirmSheet";
import { courses } from "@/lib/courses";
import {
  bulkCreateStudents,
  createStudent,
  deleteStudent,
  listStudents,
  setStudentCourses,
  setStudentPassword,
  setStudentPaused,
  signOutStudent,
  type Student,
} from "@/lib/students.functions";
import { Card, Notice, Pill, Row, Sheet, TextArea, fmtDate, useAction } from "./ui";

type Filter = "all" | "active" | "paused";

export function AdminStudents() {
  const list = useServerFn(listStudents);
  const [students, setStudents] = useState<Student[] | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [adding, setAdding] = useState<"one" | "bulk" | null>(null);
  const [selected, setSelected] = useState<Student | null>(null);
  const { msg, run } = useAction();

  const reload = useCallback(async () => {
    const r = await run(() => list());
    if (r) {
      setStudents(r);
      setSelected((s) => (s ? r.find((x) => x.id === s.id) ?? null : null));
    }
  }, [list, run]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (students ?? []).filter(
      (s) =>
        (!t || s.email.includes(t) || s.name.toLowerCase().includes(t)) &&
        (filter === "all" || (filter === "paused" ? s.paused : !s.paused)),
    );
  }, [students, q, filter]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Pressable size="md" onClick={() => setAdding("one")}><UserPlus className="mr-2 size-4" />Add student</Pressable>
        <Pressable size="md" variant="fill" onClick={() => setAdding("bulk")}><Users className="mr-2 size-4" />Add many</Pressable>
      </div>

      <div className="relative">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by email or name"
          maxLength={100}
          className="h-11 w-full rounded-xl border border-border/60 bg-secondary/70 pr-3 pl-9 text-[0.9375rem] outline-none focus:border-primary/60"
        />
      </div>

      <div className="flex gap-1 rounded-xl bg-secondary/70 p-1">
        {(["all", "active", "paused"] as Filter[]).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`h-8 flex-1 rounded-lg text-[0.8125rem] font-semibold capitalize ${filter === f ? "bg-surface-solid text-foreground shadow-soft" : "text-muted-foreground"}`}>
            {f}
          </button>
        ))}
      </div>

      <Notice msg={msg?.ok ? null : msg} />

      <Card className="py-1">
        {students === null && <p className="py-6 text-center text-muted-foreground">Loading…</p>}
        {students && shown.length === 0 && <p className="py-6 text-center text-muted-foreground">No students found.</p>}
        {shown.map((s) => (
          <Row key={s.id} onClick={s.isAdmin ? undefined : () => setSelected(s)}>
            <div className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-[0.875rem] font-bold text-primary uppercase">
              {(s.name || s.email).slice(0, 1)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[0.9375rem] font-semibold">{s.name || s.email}</p>
              <p className="truncate text-[0.75rem] text-muted-foreground">
                {s.name ? `${s.email} · ` : ""}Last seen {fmtDate(s.lastSignIn)}
              </p>
            </div>
            {s.isAdmin ? <Pill tone="info">Admin</Pill> : s.paused ? <Pill tone="warn">Paused</Pill> : <Pill tone="ok">Active</Pill>}
            {!s.isAdmin && <ChevronRight className="size-4 text-muted-foreground" />}
          </Row>
        ))}
      </Card>

      <AddOne open={adding === "one"} onClose={() => setAdding(null)} onDone={reload} />
      <AddBulk open={adding === "bulk"} onClose={() => setAdding(null)} onDone={reload} />
      {selected && <StudentSheet student={selected} onClose={() => setSelected(null)} onChanged={reload} />}
    </div>
  );
}

function AddOne({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const create = useServerFn(createStudent);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const { busy, msg, run } = useAction();
  return (
    <Sheet open={open} title="New student" onClose={onClose}>
      <Field label="Name" id="new-name" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />
      <Field label="Email" id="new-email" type="email" autoComplete="off" value={email} maxLength={254} onChange={(e) => setEmail(e.target.value)} />
      <Field label="Password" id="new-pass" reveal autoComplete="new-password" value={password} maxLength={72} onChange={(e) => setPassword(e.target.value)} />
      <p className="px-1 text-[0.75rem] text-muted-foreground">The account works right away. At least 8 characters.</p>
      <Notice msg={msg} />
      <Pressable
        disabled={busy}
        onClick={async () => {
          const r = await run(() => create({ data: { email, password, name } }), "Student added.");
          if (r) {
            setEmail(""); setPassword(""); setName("");
            onDone();
          }
        }}
      >
        {busy ? "Adding…" : "Add student"}
      </Pressable>
    </Sheet>
  );
}

function AddBulk({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const bulk = useServerFn(bulkCreateStudents);
  const [text, setText] = useState("");
  const { busy, msg, run, setMsg } = useAction();
  return (
    <Sheet open={open} title="Add many students" onClose={onClose}>
      <TextArea label="One per line: email password" value={text} rows={8} maxLength={20000} onChange={(e) => setText(e.target.value)} placeholder={"sara@mail.com Pass1234\nali@mail.com Secret99"} />
      <Notice msg={msg} />
      <Pressable
        disabled={busy}
        onClick={async () => {
          const r = await run(() => bulk({ data: { text } }));
          if (r) {
            setMsg({ ok: r.failed.length === 0, text: `${r.created} added${r.failed.length ? `, failed: ${r.failed.join(", ")}` : "."}` });
            if (!r.failed.length) setText("");
            onDone();
          }
        }}
      >
        {busy ? "Adding…" : "Add all"}
      </Pressable>
    </Sheet>
  );
}

function StudentSheet({ student, onClose, onChanged }: { student: Student; onClose: () => void; onChanged: () => void }) {
  const pause = useServerFn(setStudentPaused);
  const pass = useServerFn(setStudentPassword);
  const remove = useServerFn(deleteStudent);
  const setCourses = useServerFn(setStudentCourses);
  const signOut = useServerFn(signOutStudent);
  const [password, setPassword] = useState("");
  const [allCourses, setAllCourses] = useState(student.courses === null);
  const [picked, setPicked] = useState<string[]>(student.courses ?? []);
  const [confirm, setConfirm] = useState<"delete" | "signout" | null>(null);
  const [typed, setTyped] = useState("");
  const { busy, msg, run } = useAction();

  const act = async (fn: () => Promise<unknown>, ok: string) => {
    const r = await run(fn, ok);
    if (r) onChanged();
  };

  return (
    <>
      <Sheet open title={student.name || student.email} onClose={onClose}>
        <div className="rounded-xl bg-secondary/60 p-3 text-[0.8125rem] text-muted-foreground">
          <p>{student.email}</p>
          <p>Joined {fmtDate(student.createdAt)} · Last seen {fmtDate(student.lastSignIn)}</p>
        </div>
        <Notice msg={msg} />

        <Pressable size="md" variant={student.paused ? "primary" : "fill"} disabled={busy} onClick={() => act(() => pause({ data: { id: student.id, paused: !student.paused } }), student.paused ? "Account resumed." : "Account paused.")}>
          {student.paused ? "Resume account" : "Pause account"}
        </Pressable>

        <div className="space-y-2 pt-2">
          <Field label="New password" id="reset-pass" reveal autoComplete="new-password" maxLength={72} value={password} onChange={(e) => setPassword(e.target.value)} />
          <Pressable size="md" variant="fill" disabled={busy || password.length < 8} onClick={async () => { await act(() => pass({ data: { id: student.id, password } }), "Password changed. Old sessions were signed out."); setPassword(""); }}>
            Set password
          </Pressable>
        </div>

        <div className="space-y-2 pt-2">
          <p className="px-1 text-[0.6875rem] font-medium tracking-wide text-muted-foreground uppercase">Course access</p>
          <label className="flex items-center justify-between rounded-xl bg-secondary/60 px-3 py-2.5 text-[0.9375rem]">
            All courses
            <input type="checkbox" className="size-5 accent-[var(--primary)]" checked={allCourses} onChange={(e) => setAllCourses(e.target.checked)} />
          </label>
          {!allCourses && (
            <div className="grid max-h-56 gap-1 overflow-y-auto rounded-xl bg-secondary/40 p-2">
              {courses.map((c) => (
                <label key={c.id} className="flex items-center gap-2 px-1 py-1 text-[0.8125rem]">
                  <input
                    type="checkbox"
                    className="size-4 accent-[var(--primary)]"
                    checked={picked.includes(c.id)}
                    onChange={(e) => setPicked((p) => (e.target.checked ? [...p, c.id] : p.filter((x) => x !== c.id)))}
                  />
                  {c.title}
                </label>
              ))}
            </div>
          )}
          <Pressable size="md" variant="fill" disabled={busy} onClick={() => act(() => setCourses({ data: { id: student.id, courses: allCourses ? null : picked } }), "Course access saved.")}>
            Save access
          </Pressable>
        </div>

        <div className="space-y-2 pt-2">
          <Pressable size="md" variant="ghost" disabled={busy} onClick={() => setConfirm("signout")}>Sign out of all devices</Pressable>
          <Pressable size="md" variant="ghost" className="text-destructive" disabled={busy} onClick={() => setConfirm("delete")}>Delete student</Pressable>
          {confirm === "delete" && (
            <div className="space-y-2 rounded-xl bg-destructive/10 p-3">
              <p className="text-[0.8125rem] text-destructive">Type DELETE to remove {student.email} forever.</p>
              <Field label="Confirm" id="confirm-del" value={typed} onChange={(e) => setTyped(e.target.value)} />
              <Pressable
                size="md"
                className="bg-destructive text-destructive-foreground"
                disabled={busy || typed !== "DELETE"}
                onClick={async () => {
                  const r = await run(() => remove({ data: { id: student.id } }));
                  if (r) { onChanged(); onClose(); }
                }}
              >
                Delete forever
              </Pressable>
            </div>
          )}
        </div>
      </Sheet>
      <ConfirmSheet
        open={confirm === "signout"}
        title="Sign out everywhere?"
        message="The student will need to sign in again on every device."
        confirmLabel="Sign out"
        onConfirm={() => { setConfirm(null); void act(() => signOut({ data: { id: student.id } }), "Signed out of all devices."); }}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
}
