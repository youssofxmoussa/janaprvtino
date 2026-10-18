import { createServerFn } from "@tanstack/react-start";
import { requireAdmin, requireMember } from "./auth.middleware";
import { canOpenCourse } from "./access";
import { courses } from "./courses";
import { gradeQuestion, studentQuestions } from "./quiz";
import {
  allMedia,
  emptyContent,
  isValidCourseId,
  isValidMediaPath,
  isValidPartId,
  normalizeStored,
  sanitizeContent,
  type CourseContent,
  type Lesson,
} from "./course-content";

// Signed links expire, so a copied link stops working soon after.
const VIDEO_TTL = 60 * 60 * 3; // 3h, long enough to finish a lecture
const PDF_TTL = 60 * 60; // 1h

async function readContent(courseId: string): Promise<CourseContent> {
  const { getAdmin, DATA_BUCKET } = await import("./supabase-admin.server");
  const { data, error } = await getAdmin().storage.from(DATA_BUCKET).download(`${courseId}.json`);
  if (error || !data) return emptyContent();
  try {
    return normalizeStored(courseId, JSON.parse(await data.text()));
  } catch {
    return emptyContent();
  }
}

async function audit(actor: string, action: string, target?: string) {
  const { logAdminAction } = await import("./audit.server");
  await logAdminAction(actor, action, target);
}

async function signLesson(lesson: Lesson) {
  const { getAdmin, MEDIA_BUCKET } = await import("./supabase-admin.server");
  const bucket = getAdmin().storage.from(MEDIA_BUCKET);
  const sign = async (path: string, ttl: number) => (await bucket.createSignedUrl(path, ttl)).data?.signedUrl ?? "";
  const visible = <T extends { hidden?: boolean }>(l: T[]) => l.filter((m) => !m.hidden);
  return {
    videos: await Promise.all(visible(lesson.videos).map(async (v) => ({ id: v.id, title: v.title, url: await sign(v.path, VIDEO_TTL) }))),
    pdfs: await Promise.all(visible(lesson.pdfs).map(async (p) => ({ id: p.id, title: p.title, url: await sign(p.path, PDF_TTL) }))),
  };
}

const courseInput = (input: { courseId: string }) => {
  if (!isValidCourseId(input?.courseId)) throw new Error("Unknown course");
  return { courseId: input.courseId };
};

function assertOpen(meta: Parameters<typeof canOpenCourse>[0], courseId: string) {
  if (!canOpenCourse(meta, courseId)) throw new Error("This course isn't open on your account.");
}

/** Student view of a subject: sections and their visible lessons (no files). */
export const getCourseOutline = createServerFn({ method: "POST" })
  .middleware([requireMember])
  .inputValidator(courseInput)
  .handler(async ({ data, context }) => {
    assertOpen(context.meta, data.courseId);
    const content = await readContent(data.courseId);
    const parts: Record<string, { id: string; title: string; videos: number; pdfs: number; questions: number }[]> = {};
    for (const [partId, lessons] of Object.entries(content.parts)) {
      parts[partId] = lessons.filter((l) => !l.hidden).map((l) => ({
        id: l.id,
        title: l.title,
        videos: l.videos.filter((m) => !m.hidden).length,
        pdfs: l.pdfs.filter((m) => !m.hidden).length,
        questions: l.questions.length,
      }));
    }
    return { description: content.description, parts };
  });

/** Student view of one lesson: no storage paths, only short-lived links + viewer email for the watermark. */
export const getLessonContent = createServerFn({ method: "POST" })
  .middleware([requireMember])
  .inputValidator((input: { courseId: string; partId: string; lessonId: string }) => {
    const { courseId } = courseInput(input);
    if (!isValidPartId(courseId, input.partId)) throw new Error("Unknown section");
    const lessonId = String(input.lessonId ?? "");
    if (!/^[A-Za-z0-9-]{1,64}$/.test(lessonId)) throw new Error("Unknown lesson");
    return { courseId, partId: input.partId, lessonId };
  })
  .handler(async ({ data, context }) => {
    assertOpen(context.meta, data.courseId);
    const content = await readContent(data.courseId);
    const lesson = content.parts[data.partId]?.find((l) => l.id === data.lessonId && !l.hidden);
    if (!lesson) throw new Error("This lesson isn't available.");
    const signed = await signLesson(lesson);
    return { title: lesson.title, questions: studentQuestions(lesson.questions), ...signed, viewer: context.email };
  });

/** Answers are disclosed only after an authenticated, authorized submission. */
export const submitLessonAnswer = createServerFn({ method: "POST" })
  .middleware([requireMember])
  .inputValidator((input: { courseId: string; partId: string; lessonId: string; questionId: number; option: number }) => {
    const { courseId } = courseInput(input);
    if (!isValidPartId(courseId, input.partId) || !/^[A-Za-z0-9-]{1,64}$/.test(input.lessonId)) throw new Error("Unknown lesson");
    if (!Number.isInteger(input.questionId) || !Number.isInteger(input.option)) throw new Error("Invalid answer.");
    return { courseId, partId: input.partId, lessonId: input.lessonId, questionId: input.questionId, option: input.option };
  })
  .handler(async ({ data, context }) => {
    assertOpen(context.meta, data.courseId);
    const content = await readContent(data.courseId);
    const lesson = content.parts[data.partId]?.find((l) => l.id === data.lessonId && !l.hidden);
    if (!lesson) throw new Error("This lesson isn't available.");
    return gradeQuestion(lesson.questions, data.questionId, data.option);
  });

export const getCourseContentAdmin = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator(courseInput)
  .handler(async ({ data }) => readContent(data.courseId));

export const saveCourseContent = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: { courseId: string; content: unknown }) => ({
    courseId: courseInput(input).courseId,
    content: sanitizeContent(input.courseId, input.content),
  }))
  .handler(async ({ data, context }) => {
    const { getAdmin, DATA_BUCKET, MEDIA_BUCKET } = await import("./supabase-admin.server");
    const admin = getAdmin();
    const before = await readContent(data.courseId);
    const { error } = await admin.storage
      .from(DATA_BUCKET)
      .upload(`${data.courseId}.json`, JSON.stringify(data.content), {
        upsert: true,
        contentType: "application/json",
      });
    if (error) throw new Error("Couldn't save. Try again.");
    // Remove files that are no longer used by this course.
    const keep = new Set(allMedia(data.content).map((m) => m.path));
    const removed = allMedia(before).map((m) => m.path).filter((p) => !keep.has(p));
    if (removed.length) await admin.storage.from(MEDIA_BUCKET).remove(removed);
    await audit(context.email, "Saved course content", data.courseId);
    return { ok: true };
  });

const MAX_BYTES = { video: 2 * 1024 ** 3, pdf: 100 * 1024 ** 2 };

export const createUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: { courseId: string; kind: "video" | "pdf"; filename: string; size?: number }) => {
    const { courseId } = courseInput(input);
    if (input.kind !== "video" && input.kind !== "pdf") throw new Error("Bad file type");
    const filename = String(input.filename ?? "").slice(0, 200);
    const ok = input.kind === "pdf" ? /\.pdf$/i.test(filename) : /\.(mp4|webm|mov|m4v)$/i.test(filename);
    if (!ok) throw new Error(input.kind === "pdf" ? "Only PDF files." : "Only MP4, WebM or MOV videos.");
    const size = Number(input.size ?? 0);
    if (size > MAX_BYTES[input.kind]) throw new Error("File is too large.");
    return { courseId, kind: input.kind, filename };
  })
  .handler(async ({ data, context }) => {
    const { getAdmin, MEDIA_BUCKET } = await import("./supabase-admin.server");
    const ext = data.kind === "pdf" ? "pdf" : (/\.(mp4|webm|mov|m4v)$/i.exec(data.filename)?.[1] ?? "mp4").toLowerCase();
    const path = `${data.courseId}/${crypto.randomUUID()}.${ext}`;
    if (!isValidMediaPath(data.courseId, path)) throw new Error("Bad path");
    const { data: signed, error } = await getAdmin().storage.from(MEDIA_BUCKET).createSignedUploadUrl(path);
    if (error || !signed) throw new Error("Upload failed. Try again.");
    await audit(context.email, `Uploaded ${data.kind}`, `${data.courseId}: ${data.filename}`);
    return { path, uploadUrl: signed.signedUrl };
  });

/** Admin preview link for a file in the editor. */
export const getMediaPreview = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: { courseId: string; path: string }) => {
    const { courseId } = courseInput(input);
    if (!isValidMediaPath(courseId, input.path)) throw new Error("Bad path");
    return { path: input.path };
  })
  .handler(async ({ data }) => {
    const { getAdmin, MEDIA_BUCKET } = await import("./supabase-admin.server");
    const { data: s } = await getAdmin().storage.from(MEDIA_BUCKET).createSignedUrl(data.path, 600);
    return { url: s?.signedUrl ?? "" };
  });

export const getDashboardStats = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .handler(async () => {
    const { getAdmin } = await import("./supabase-admin.server");
    const a = getAdmin();
    let students = 0, paused = 0, activeWeek = 0;
    const weekAgo = Date.now() - 7 * 864e5;
    for (let page = 1; page < 50; page++) {
      const { data } = await a.auth.admin.listUsers({ page, perPage: 200 });
      const users = data?.users ?? [];
      for (const u of users) {
        if (u.app_metadata?.["role"] === "admin") continue;
        students++;
        const b = (u as { banned_until?: string | null }).banned_until;
        if (b && new Date(b).getTime() > Date.now()) paused++;
        if (u.last_sign_in_at && new Date(u.last_sign_in_at).getTime() > weekAgo) activeWeek++;
      }
      if (users.length < 200) break;
    }
    const all = await Promise.all(courses.map((c) => readContent(c.id)));
    return {
      students,
      paused,
      activeWeek,
      lessons: all.reduce((n, c) => n + Object.values(c.parts).flat().length, 0),
      videos: all.reduce((n, c) => n + Object.values(c.parts).flat().reduce((m, l) => m + l.videos.length, 0), 0),
      pdfs: all.reduce((n, c) => n + Object.values(c.parts).flat().reduce((m, l) => m + l.pdfs.length, 0), 0),
      questions: all.reduce((n, c) => n + Object.values(c.parts).flat().reduce((m, l) => m + l.questions.length, 0), 0),
    };
  });

export const getActivityLog = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .handler(async () => {
    const { readAudit } = await import("./audit.server");
    return readAudit(100);
  });

/** Signs the admin out of every device (other sessions stop working). */
export const signOutEverywhere = createServerFn({ method: "POST" })
  .middleware([requireMember])
  .handler(async ({ context }) => {
    const { getAdmin } = await import("./supabase-admin.server");
    const { error } = await getAdmin().auth.admin.updateUserById(context.userId, {
      app_metadata: { ...context.meta, session_epoch: Math.floor(Date.now() / 1000) + 1 },
    });
    if (error) throw new Error("Couldn't sign out everywhere.");
    return { ok: true };
  });
