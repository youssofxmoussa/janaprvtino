import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, FileText, Film, Play, Plus, Trash2, Upload, Check } from "lucide-react";
import { Pressable } from "@/components/ios/press";
import { Field } from "@/components/ios/Field";
import { courses } from "@/lib/courses";
import { createUploadUrl, getCourseContentAdmin, getMediaPreview, saveCourseContent } from "@/lib/content.functions";
import { emptyContent, type CourseContent, type MediaItem, type Question } from "@/lib/course-content";
import { Card, Notice, SectionTitle, Sheet, TextArea, useAction } from "./ui";
import { cn } from "@/lib/utils";

function move<T>(list: T[], i: number, d: -1 | 1): T[] {
  const j = i + d;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j] as T, next[i] as T];
  return next;
}

export function CoursePicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {courses.map((c) => (
        <button
          key={c.id}
          onClick={() => onChange(c.id)}
          className={cn("shrink-0 rounded-full px-3 py-1.5 text-[0.8125rem] font-semibold uppercase", value === c.id ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}
        >
          {c.id}
        </button>
      ))}
    </div>
  );
}

/** Loads and saves one course's content for the editors. */
export function useCourseEditor(courseId: string) {
  const load = useServerFn(getCourseContentAdmin);
  const save = useServerFn(saveCourseContent);
  const [content, setContent] = useState<CourseContent | null>(null);
  const [dirty, setDirty] = useState(false);
  const action = useAction();

  useEffect(() => {
    let live = true;
    setContent(null);
    setDirty(false);
    load({ data: { courseId } })
      .then((c) => live && setContent({ ...emptyContent(), ...c }))
      .catch(() => live && setContent(emptyContent()));
    return () => { live = false; };
  }, [courseId, load]);

  const update = useCallback((fn: (c: CourseContent) => CourseContent) => {
    setContent((c) => (c ? fn(c) : c));
    setDirty(true);
  }, []);

  const commit = useCallback(async (next?: CourseContent) => {
    const body = next ?? content;
    if (!body) return;
    const r = await action.run(() => save({ data: { courseId, content: body } }), "Saved.");
    if (r) setDirty(false);
  }, [action, content, courseId, save]);

  return { content, update, commit, dirty, ...action, setContent };
}

function uploadWithProgress(url: string, file: File, onProgress: (p: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("content-type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error("Upload failed.")));
    xhr.onerror = () => reject(new Error("Upload failed. Check your connection."));
    xhr.send(file);
  });
}

export function AdminCourses() {
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const ed = useCourseEditor(courseId);
  const getUpload = useServerFn(createUploadUrl);
  const preview = useServerFn(getMediaPreview);
  const [progress, setProgress] = useState<number | null>(null);
  const [previewing, setPreviewing] = useState<{ kind: "video" | "pdf"; url: string; title: string } | null>(null);
  const c = ed.content;

  const upload = async (kind: "video" | "pdf", file: File) => {
    if (!c) return;
    setProgress(0);
    await ed.run(async () => {
      const { path, uploadUrl } = await getUpload({ data: { courseId, kind, filename: file.name, size: file.size } });
      await uploadWithProgress(uploadUrl, file, setProgress);
      const item: MediaItem = { id: crypto.randomUUID(), title: file.name.replace(/\.[^.]+$/, "").slice(0, 160), path };
      const key = kind === "video" ? "videos" : "pdfs";
      const next = { ...c, [key]: [...c[key], item] };
      ed.setContent(next);
      await ed.commit(next);
    });
    setProgress(null);
  };

  const mediaList = (key: "videos" | "pdfs") => {
    if (!c) return null;
    const kind = key === "videos" ? "video" : "pdf";
    const Icon = key === "videos" ? Film : FileText;
    return (
      <div className="space-y-2">
        <SectionTitle
          action={
            <label className="flex cursor-pointer items-center gap-1 text-[0.875rem] font-semibold text-primary">
              <Upload className="size-4" /> Upload
              <input
                type="file"
                hidden
                accept={kind === "pdf" ? "application/pdf,.pdf" : "video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.m4v"}
                onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) void upload(kind, f); }}
              />
            </label>
          }
        >
          {key === "videos" ? "Lectures" : "PDFs"} ({c[key].length})
        </SectionTitle>
        <Card className="space-y-2">
          {c[key].length === 0 && <p className="py-3 text-center text-[0.875rem] text-muted-foreground">Nothing yet.</p>}
          {c[key].map((m, i) => (
            <div key={m.id} className={cn("flex items-center gap-2", m.hidden && "opacity-50")}>
              <Icon className="size-4 shrink-0 text-muted-foreground" />
              <input
                value={m.title}
                maxLength={160}
                onChange={(e) => ed.update((x) => ({ ...x, [key]: x[key].map((y) => (y.id === m.id ? { ...y, title: e.target.value } : y)) }))}
                className="h-9 min-w-0 flex-1 rounded-lg bg-secondary/60 px-2 text-[0.875rem] outline-none focus:bg-surface-solid"
              />
              <IconBtn label="Preview" onClick={async () => { const r = await preview({ data: { courseId, path: m.path } }).catch(() => null); if (r?.url) setPreviewing({ kind, url: r.url, title: m.title }); }}><Play /></IconBtn>
              <IconBtn label="Move up" onClick={() => ed.update((x) => ({ ...x, [key]: move(x[key], i, -1) }))}><ArrowUp /></IconBtn>
              <IconBtn label="Move down" onClick={() => ed.update((x) => ({ ...x, [key]: move(x[key], i, 1) }))}><ArrowDown /></IconBtn>
              <IconBtn label={m.hidden ? "Show" : "Hide"} onClick={() => ed.update((x) => ({ ...x, [key]: x[key].map((y) => (y.id === m.id ? { ...y, hidden: !y.hidden } : y)) }))}>{m.hidden ? <EyeOff /> : <Eye />}</IconBtn>
              <IconBtn label="Delete" danger onClick={() => ed.update((x) => ({ ...x, [key]: x[key].filter((y) => y.id !== m.id) }))}><Trash2 /></IconBtn>
            </div>
          ))}
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <CoursePicker value={courseId} onChange={setCourseId} />
      <p className="px-1 text-[0.875rem] font-semibold">{courses.find((x) => x.id === courseId)?.title}</p>
      {!c ? (
        <p className="py-8 text-center text-muted-foreground">Loading…</p>
      ) : (
        <>
          <TextArea label="Subject description" value={c.description} maxLength={3000} onChange={(e) => ed.update((x) => ({ ...x, description: e.target.value }))} />
          {progress !== null && (
            <div className="space-y-1">
              <p className="text-[0.8125rem] text-muted-foreground">Uploading… {progress}%</p>
              <div className="h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div>
            </div>
          )}
          {mediaList("videos")}
          {mediaList("pdfs")}
          <SaveBar dirty={ed.dirty} busy={ed.busy} msg={ed.msg} onSave={() => ed.commit()} />
        </>
      )}
      <Sheet open={!!previewing} title={previewing?.title ?? ""} onClose={() => setPreviewing(null)}>
        {previewing?.kind === "video" && <video src={previewing.url} controls controlsList="nodownload" className="w-full rounded-xl" />}
        {previewing?.kind === "pdf" && <iframe title="PDF preview" src={previewing.url} className="h-[60dvh] w-full rounded-xl" />}
      </Sheet>
    </div>
  );
}

function IconBtn({ children, label, onClick, danger }: { children: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button aria-label={label} title={label} onClick={onClick} className={cn("grid size-8 shrink-0 place-items-center rounded-lg bg-secondary/60 [&_svg]:size-4 active:scale-90", danger ? "text-destructive" : "text-muted-foreground")}>
      {children}
    </button>
  );
}

export function SaveBar({ dirty, busy, msg, onSave }: { dirty: boolean; busy: boolean; msg: { ok: boolean; text: string } | null; onSave: () => void }) {
  return (
    <div className="sticky bottom-3 z-20 space-y-2">
      <Notice msg={msg} />
      <Pressable disabled={busy || !dirty} onClick={onSave}>{busy ? "Saving…" : dirty ? "Save changes" : "All saved"}</Pressable>
    </div>
  );
}

export function AdminQuiz() {
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const ed = useCourseEditor(courseId);
  const [editing, setEditing] = useState<{ index: number; q: Question } | null>(null);
  const c = ed.content;
  const blank = (): Question => ({ id: 0, question: "", options: ["", "", "", ""], correctAnswer: 0, explanation: "" });

  return (
    <div className="space-y-4">
      <CoursePicker value={courseId} onChange={setCourseId} />
      {!c ? (
        <p className="py-8 text-center text-muted-foreground">Loading…</p>
      ) : (
        <>
          <SectionTitle action={<button onClick={() => setEditing({ index: -1, q: blank() })} className="flex items-center gap-1 text-[0.875rem] font-semibold text-primary"><Plus className="size-4" />Add</button>}>
            Questions ({c.questions.length})
          </SectionTitle>
          <Card className="space-y-2">
            {c.questions.length === 0 && <p className="py-3 text-center text-[0.875rem] text-muted-foreground">No questions yet.</p>}
            {c.questions.map((q, i) => (
              <div key={i} className="flex items-center gap-2">
                <button className="min-w-0 flex-1 text-left" onClick={() => setEditing({ index: i, q: { ...q, options: [...q.options, "", "", "", ""].slice(0, Math.max(4, q.options.length)) } })}>
                  <p className="truncate text-[0.9375rem] font-semibold">{i + 1}. {q.question}</p>
                  <p className="truncate text-[0.75rem] text-muted-foreground">Answer: {q.options[q.correctAnswer]}</p>
                </button>
                <IconBtn label="Move up" onClick={() => ed.update((x) => ({ ...x, questions: move(x.questions, i, -1) }))}><ArrowUp /></IconBtn>
                <IconBtn label="Move down" onClick={() => ed.update((x) => ({ ...x, questions: move(x.questions, i, 1) }))}><ArrowDown /></IconBtn>
                <IconBtn label="Delete" danger onClick={() => ed.update((x) => ({ ...x, questions: x.questions.filter((_, j) => j !== i) }))}><Trash2 /></IconBtn>
              </div>
            ))}
          </Card>
          <SaveBar dirty={ed.dirty} busy={ed.busy} msg={ed.msg} onSave={() => ed.commit()} />
        </>
      )}

      <Sheet open={!!editing} title={editing?.index === -1 ? "New question" : "Edit question"} onClose={() => setEditing(null)}>
        {editing && (
          <>
            <TextArea label="Question" value={editing.q.question} maxLength={1000} onChange={(e) => setEditing({ ...editing, q: { ...editing.q, question: e.target.value } })} />
            <p className="px-1 text-[0.75rem] text-muted-foreground">Tap the circle to mark the correct answer.</p>
            {editing.q.options.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <button
                  aria-label={`Mark answer ${i + 1} correct`}
                  onClick={() => setEditing({ ...editing, q: { ...editing.q, correctAnswer: i } })}
                  className={cn("grid size-8 shrink-0 place-items-center rounded-full border-2", editing.q.correctAnswer === i ? "border-primary bg-primary text-primary-foreground" : "border-border")}
                >
                  {editing.q.correctAnswer === i && <Check className="size-4" />}
                </button>
                <div className="flex-1">
                  <Field label={`Answer ${i + 1}`} id={`opt-${i}`} value={o} maxLength={300} onChange={(e) => { const options = [...editing.q.options]; options[i] = e.target.value; setEditing({ ...editing, q: { ...editing.q, options } }); }} />
                </div>
              </div>
            ))}
            <TextArea label="Explanation" value={editing.q.explanation} maxLength={1500} onChange={(e) => setEditing({ ...editing, q: { ...editing.q, explanation: e.target.value } })} />
            <Pressable
              onClick={() => {
                const opts = editing.q.options.map((o) => o.trim());
                const correctText = opts[editing.q.correctAnswer];
                if (!editing.q.question.trim() || !correctText) {
                  ed.setMsg({ ok: false, text: "Write the question and the correct answer." });
                  return;
                }
                const options = opts.filter(Boolean);
                const q = { ...editing.q, options, correctAnswer: options.indexOf(correctText) };
                ed.update((x) => ({ ...x, questions: editing.index === -1 ? [...x.questions, q] : x.questions.map((y, j) => (j === editing.index ? q : y)) }));
                setEditing(null);
              }}
            >
              Done
            </Pressable>
          </>
        )}
      </Sheet>
    </div>
  );
}
