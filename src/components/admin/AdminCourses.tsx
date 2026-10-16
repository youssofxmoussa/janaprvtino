import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowDown, ArrowUp, Check, ChevronLeft, ChevronRight, Eye, EyeOff, FileText, Film, HelpCircle, Layers, Play, Plus, Trash2, Upload } from "lucide-react";
import { Pressable, spring } from "@/components/ios/press";
import { Field } from "@/components/ios/Field";
import { courses, findCourse } from "@/lib/courses";
import { createUploadUrl, getCourseContentAdmin, getMediaPreview, saveCourseContent } from "@/lib/content.functions";
import { emptyContent, emptyLesson, type CourseContent, type Lesson, type MediaItem, type Question } from "@/lib/course-content";
import { Card, Notice, SectionTitle, Sheet, TextArea, useAction } from "./ui";
import { cn } from "@/lib/utils";

function move<T>(list: T[], i: number, d: -1 | 1): T[] {
  const j = i + d;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j] as T, next[i] as T];
  return next;
}

/** Subject picker as a wrapping grid (no sideways scrolling). */
export function CoursePicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  return (
    <div className="space-y-3">
      {[1, 2].map((sem) => (
        <div key={sem} className="space-y-2">
          <p className="px-1 text-[0.6875rem] font-bold tracking-wider text-muted-foreground uppercase">Semester {sem}</p>
          <div className="grid grid-cols-3 gap-2">
            {courses.filter((c) => c.semester === sem).map((c) => (
              <button
                key={c.id}
                onClick={() => onChange(c.id)}
                className={cn(
                  "relative flex flex-col items-center gap-1 rounded-2xl p-2 text-[0.75rem] font-bold uppercase transition-transform active:scale-95",
                  value === c.id ? "bg-primary text-primary-foreground shadow-lift" : "clay text-foreground",
                )}
              >
                {c.image && <img src={c.image} alt="" width={36} height={36} className="size-9 object-contain" />}
                {c.id}
              </button>
            ))}
          </div>
        </div>
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

function IconBtn({ children, label, onClick, danger }: { children: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button aria-label={label} title={label} onClick={onClick} className={cn("grid size-8 shrink-0 place-items-center rounded-lg bg-secondary/70 [&_svg]:size-4 active:scale-90", danger ? "text-destructive" : "text-muted-foreground")}>
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

type Mode = "media" | "quiz";

/** Subject → section → session → videos, PDFs and quiz. */
export function AdminCourses({ initialMode = "media" }: { initialMode?: Mode }) {
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const course = findCourse(courseId);
  const [partId, setPartId] = useState(course?.parts[0]?.id ?? "");
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>(initialMode);
  const ed = useCourseEditor(courseId);
  const c = ed.content;

  const pickCourse = (id: string) => {
    setCourseId(id);
    setPartId(findCourse(id)?.parts[0]?.id ?? "");
    setLessonId(null);
  };

  const lessons = c?.parts[partId] ?? [];
  const lesson = lessons.find((l) => l.id === lessonId) ?? null;
  const setLessons = (fn: (l: Lesson[]) => Lesson[]) => ed.update((x) => ({ ...x, parts: { ...x.parts, [partId]: fn(x.parts[partId] ?? []) } }));
  const setLesson = (fn: (l: Lesson) => Lesson) => setLessons((ls) => ls.map((l) => (l.id === lessonId ? fn(l) : l)));

  if (lesson && c) {
    return (
      <LessonEditor
        courseId={courseId}
        partTitle={course?.parts.find((p) => p.id === partId)?.title ?? ""}
        lesson={lesson}
        mode={mode}
        setMode={setMode}
        onBack={() => setLessonId(null)}
        setLesson={setLesson}
        commitWith={(fn) => {
          const next = { ...c, parts: { ...c.parts, [partId]: (c.parts[partId] ?? []).map((l) => (l.id === lessonId ? fn(l) : l)) } };
          ed.setContent(next);
          return ed.commit(next);
        }}
        ed={ed}
      />
    );
  }

  return (
    <div className="space-y-5">
      <CoursePicker value={courseId} onChange={pickCourse} />
      <Card className="space-y-3">
        <p className="text-[1rem] font-bold">{course?.title}</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {course?.parts.map((p) => (
            <button
              key={p.id}
              onClick={() => setPartId(p.id)}
              className={cn("flex items-center gap-2 rounded-xl p-2 text-left text-[0.8125rem] font-semibold transition-colors", partId === p.id ? "bg-primary/12 text-primary ring-2 ring-primary/40" : "bg-secondary/70")}
            >
              <img src={p.image} alt="" width={28} height={28} className="size-7 object-contain" />
              <span className="min-w-0 truncate">{p.title}</span>
            </button>
          ))}
        </div>
      </Card>

      {!c ? (
        <p className="py-8 text-center text-muted-foreground">Loading…</p>
      ) : (
        <>
          <SectionTitle
            action={
              <button onClick={() => setLessons((ls) => [...ls, emptyLesson(`Session ${ls.length + 1}`)])} className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-[0.8125rem] font-semibold text-primary-foreground active:scale-95">
                <Plus className="size-4" /> Session
              </button>
            }
          >
            Sessions ({lessons.length})
          </SectionTitle>
          <div className="space-y-2">
            {lessons.length === 0 && <Card><p className="py-4 text-center text-[0.875rem] text-muted-foreground">No sessions yet. Add the first one.</p></Card>}
            {lessons.map((l, i) => (
              <Card key={l.id} className={cn("flex items-center gap-2 p-3", l.hidden && "opacity-55")}>
                <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-[0.875rem] font-bold text-primary">{i + 1}</div>
                <input
                  value={l.title}
                  maxLength={160}
                  onChange={(e) => setLessons((ls) => ls.map((y) => (y.id === l.id ? { ...y, title: e.target.value } : y)))}
                  className="h-9 min-w-0 flex-1 rounded-lg bg-secondary/60 px-2 text-[0.875rem] font-semibold outline-none focus:bg-surface-solid"
                />
                <IconBtn label="Move up" onClick={() => setLessons((ls) => move(ls, i, -1))}><ArrowUp /></IconBtn>
                <IconBtn label={l.hidden ? "Show" : "Hide"} onClick={() => setLessons((ls) => ls.map((y) => (y.id === l.id ? { ...y, hidden: !y.hidden } : y)))}>{l.hidden ? <EyeOff /> : <Eye />}</IconBtn>
                <IconBtn label="Delete" danger onClick={() => confirm(`Delete "${l.title}" and its files?`) && setLessons((ls) => ls.filter((y) => y.id !== l.id))}><Trash2 /></IconBtn>
                <IconBtn label="Open" onClick={() => setLessonId(l.id)}><ChevronRight /></IconBtn>
              </Card>
            ))}
          </div>
          <TextArea label="Subject description" value={c.description} maxLength={3000} onChange={(e) => ed.update((x) => ({ ...x, description: e.target.value }))} />
          <SaveBar dirty={ed.dirty} busy={ed.busy} msg={ed.msg} onSave={() => ed.commit()} />
        </>
      )}
    </div>
  );
}

export function AdminQuiz() {
  return <AdminCourses initialMode="quiz" />;
}

function LessonEditor({
  courseId, partTitle, lesson, mode, setMode, onBack, setLesson, commitWith, ed,
}: {
  courseId: string;
  partTitle: string;
  lesson: Lesson;
  mode: Mode;
  setMode: (m: Mode) => void;
  onBack: () => void;
  setLesson: (fn: (l: Lesson) => Lesson) => void;
  commitWith: (fn: (l: Lesson) => Lesson) => Promise<void>;
  ed: ReturnType<typeof useCourseEditor>;
}) {
  const getUpload = useServerFn(createUploadUrl);
  const preview = useServerFn(getMediaPreview);
  const [progress, setProgress] = useState<number | null>(null);
  const [previewing, setPreviewing] = useState<{ kind: "video" | "pdf"; url: string; title: string } | null>(null);
  const [editing, setEditing] = useState<{ index: number; q: Question } | null>(null);
  const blank = (): Question => ({ id: 0, question: "", options: ["", "", "", ""], correctAnswer: 0, explanation: "" });

  const upload = async (kind: "video" | "pdf", file: File) => {
    setProgress(0);
    await ed.run(async () => {
      const { path, uploadUrl } = await getUpload({ data: { courseId, kind, filename: file.name, size: file.size } });
      await uploadWithProgress(uploadUrl, file, setProgress);
      const item: MediaItem = { id: crypto.randomUUID(), title: file.name.replace(/\.[^.]+$/, "").slice(0, 160), path };
      const key = kind === "video" ? "videos" : "pdfs";
      await commitWith((l) => ({ ...l, [key]: [...l[key], item] }));
    });
    setProgress(null);
  };

  const mediaList = (key: "videos" | "pdfs") => {
    const kind = key === "videos" ? "video" : "pdf";
    const Icon = key === "videos" ? Film : FileText;
    const list = lesson[key];
    return (
      <div className="space-y-2">
        <SectionTitle
          action={
            <label className="flex cursor-pointer items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-[0.8125rem] font-semibold text-primary">
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
          {key === "videos" ? "Videos" : "PDFs"} ({list.length})
        </SectionTitle>
        <Card className="space-y-2">
          {list.length === 0 && <p className="py-3 text-center text-[0.875rem] text-muted-foreground">Nothing yet.</p>}
          {list.map((m, i) => (
            <div key={m.id} className={cn("flex items-center gap-1.5", m.hidden && "opacity-50")}>
              <Icon className="size-4 shrink-0 text-muted-foreground" />
              <input
                value={m.title}
                maxLength={160}
                onChange={(e) => setLesson((x) => ({ ...x, [key]: x[key].map((y) => (y.id === m.id ? { ...y, title: e.target.value } : y)) }))}
                className="h-9 min-w-0 flex-1 rounded-lg bg-secondary/60 px-2 text-[0.875rem] outline-none focus:bg-surface-solid"
              />
              <IconBtn label="Preview" onClick={async () => { const r = await preview({ data: { courseId, path: m.path } }).catch(() => null); if (r?.url) setPreviewing({ kind, url: r.url, title: m.title }); }}><Play /></IconBtn>
              <IconBtn label="Move up" onClick={() => setLesson((x) => ({ ...x, [key]: move(x[key], i, -1) }))}><ArrowUp /></IconBtn>
              <IconBtn label={m.hidden ? "Show" : "Hide"} onClick={() => setLesson((x) => ({ ...x, [key]: x[key].map((y) => (y.id === m.id ? { ...y, hidden: !y.hidden } : y)) }))}>{m.hidden ? <EyeOff /> : <Eye />}</IconBtn>
              <IconBtn label="Delete" danger onClick={() => setLesson((x) => ({ ...x, [key]: x[key].filter((y) => y.id !== m.id) }))}><Trash2 /></IconBtn>
            </div>
          ))}
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="flex items-center gap-0.5 text-[0.9375rem] font-semibold text-primary"><ChevronLeft className="size-5" /> Sessions</button>
      <Card className="flex items-center gap-3">
        <div className="grid size-11 place-items-center rounded-2xl bg-primary text-primary-foreground"><Layers className="size-5" /></div>
        <div className="min-w-0">
          <p className="text-[0.75rem] font-semibold text-muted-foreground uppercase">{courseId} · {partTitle}</p>
          <input value={lesson.title} maxLength={160} onChange={(e) => setLesson((l) => ({ ...l, title: e.target.value }))} className="w-full bg-transparent text-[1.125rem] font-bold outline-none" />
        </div>
      </Card>

      <div className="glass-flat grid grid-cols-2 gap-1 rounded-2xl p-1">
        {(["media", "quiz"] as Mode[]).map((m) => (
          <button key={m} onClick={() => setMode(m)} className={cn("relative flex h-9 items-center justify-center gap-1.5 text-[0.875rem] font-semibold", mode === m ? "text-primary" : "text-muted-foreground")}>
            {mode === m && <motion.div layoutId="lessonMode" className="absolute inset-0 rounded-xl bg-primary/10" transition={spring} />}
            <span className="relative flex items-center gap-1.5">{m === "media" ? <><Film className="size-4" />Videos & PDFs</> : <><HelpCircle className="size-4" />Quiz ({lesson.questions.length})</>}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={mode} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="space-y-4">
          {mode === "media" ? (
            <>
              {progress !== null && (
                <div className="space-y-1">
                  <p className="text-[0.8125rem] text-muted-foreground">Uploading… {progress}%</p>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div>
                </div>
              )}
              {mediaList("videos")}
              {mediaList("pdfs")}
            </>
          ) : (
            <>
              <SectionTitle action={<button onClick={() => setEditing({ index: -1, q: blank() })} className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-[0.8125rem] font-semibold text-primary"><Plus className="size-4" />Add</button>}>
                Questions ({lesson.questions.length})
              </SectionTitle>
              <Card className="space-y-2">
                {lesson.questions.length === 0 && <p className="py-3 text-center text-[0.875rem] text-muted-foreground">No questions yet.</p>}
                {lesson.questions.map((q, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <button className="min-w-0 flex-1 text-left" onClick={() => setEditing({ index: i, q: { ...q, options: [...q.options, "", "", "", ""].slice(0, Math.max(4, q.options.length)) } })}>
                      <p className="truncate text-[0.9375rem] font-semibold">{i + 1}. {q.question}</p>
                      <p className="truncate text-[0.75rem] text-muted-foreground">Answer: {q.options[q.correctAnswer]}</p>
                    </button>
                    <IconBtn label="Move up" onClick={() => setLesson((x) => ({ ...x, questions: move(x.questions, i, -1) }))}><ArrowUp /></IconBtn>
                    <IconBtn label="Move down" onClick={() => setLesson((x) => ({ ...x, questions: move(x.questions, i, 1) }))}><ArrowDown /></IconBtn>
                    <IconBtn label="Delete" danger onClick={() => setLesson((x) => ({ ...x, questions: x.questions.filter((_, j) => j !== i) }))}><Trash2 /></IconBtn>
                  </div>
                ))}
              </Card>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      <SaveBar dirty={ed.dirty} busy={ed.busy} msg={ed.msg} onSave={() => ed.commit()} />

      <Sheet open={!!previewing} title={previewing?.title ?? ""} onClose={() => setPreviewing(null)}>
        {previewing?.kind === "video" && <video src={previewing.url} controls controlsList="nodownload" className="w-full rounded-xl" />}
        {previewing?.kind === "pdf" && <iframe title="PDF preview" src={previewing.url} className="h-[60dvh] w-full rounded-xl" />}
      </Sheet>

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
                setLesson((x) => ({ ...x, questions: editing.index === -1 ? [...x.questions, q] : x.questions.map((y, j) => (j === editing.index ? q : y)) }));
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
