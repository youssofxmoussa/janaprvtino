import { createServerFn } from "@tanstack/react-start";
import { requireAdmin, requireMember } from "./auth.middleware";
import {
  emptyContent,
  isValidCourseId,
  isValidMediaPath,
  sanitizeContent,
  type CourseContent,
} from "./course-content";

// Signed links expire, so a copied link stops working soon after.
const VIDEO_TTL = 60 * 60 * 3; // 3h, long enough to finish a lecture
const PDF_TTL = 60 * 60; // 1h

async function readContent(courseId: string): Promise<CourseContent> {
  const { getAdmin, DATA_BUCKET } = await import("./supabase-admin.server");
  const { data, error } = await getAdmin().storage.from(DATA_BUCKET).download(`${courseId}.json`);
  if (error || !data) return emptyContent();
  try {
    return { ...emptyContent(), ...(JSON.parse(await data.text()) as CourseContent) };
  } catch {
    return emptyContent();
  }
}

async function signAll(content: CourseContent) {
  const { getAdmin, MEDIA_BUCKET } = await import("./supabase-admin.server");
  const bucket = getAdmin().storage.from(MEDIA_BUCKET);
  const sign = async (path: string, ttl: number) => (await bucket.createSignedUrl(path, ttl)).data?.signedUrl ?? "";
  return {
    videos: await Promise.all(content.videos.map(async (v) => ({ id: v.id, title: v.title, url: await sign(v.path, VIDEO_TTL) }))),
    pdfs: await Promise.all(content.pdfs.map(async (p) => ({ id: p.id, title: p.title, url: await sign(p.path, PDF_TTL) }))),
  };
}

const courseInput = (input: { courseId: string }) => {
  if (!isValidCourseId(input?.courseId)) throw new Error("Unknown course");
  return { courseId: input.courseId };
};

/** Student view: no storage paths, only short-lived links + viewer email for the watermark. */
export const getCourseContent = createServerFn({ method: "POST" })
  .middleware([requireMember])
  .inputValidator(courseInput)
  .handler(async ({ data, context }) => {
    const content = await readContent(data.courseId);
    const signed = await signAll(content);
    return {
      description: content.description,
      questions: content.questions,
      ...signed,
      viewer: context.email,
    };
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
  .handler(async ({ data }) => {
    const { getAdmin, DATA_BUCKET, MEDIA_BUCKET } = await import("./supabase-admin.server");
    const admin = getAdmin();
    const before = await readContent(data.courseId);
    const { error } = await admin.storage
      .from(DATA_BUCKET)
      .upload(`${data.courseId}.json`, JSON.stringify(data.content), {
        upsert: true,
        contentType: "application/json",
      });
    if (error) throw new Error(error.message);
    // Remove files that are no longer used by this course.
    const keep = new Set([...data.content.videos, ...data.content.pdfs].map((m) => m.path));
    const removed = [...before.videos, ...before.pdfs].map((m) => m.path).filter((p) => !keep.has(p));
    if (removed.length) await admin.storage.from(MEDIA_BUCKET).remove(removed);
    return { ok: true };
  });

export const createUploadUrl = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: { courseId: string; kind: "video" | "pdf"; filename: string }) => {
    const { courseId } = courseInput(input);
    if (input.kind !== "video" && input.kind !== "pdf") throw new Error("Bad file type");
    return { courseId, kind: input.kind, filename: String(input.filename ?? "") };
  })
  .handler(async ({ data }) => {
    const { getAdmin, MEDIA_BUCKET } = await import("./supabase-admin.server");
    const ext = data.kind === "pdf" ? "pdf" : (/\.(mp4|webm|mov|m4v)$/i.exec(data.filename)?.[1] ?? "mp4").toLowerCase();
    const path = `${data.courseId}/${crypto.randomUUID()}.${ext}`;
    if (!isValidMediaPath(data.courseId, path)) throw new Error("Bad path");
    const { data: signed, error } = await getAdmin().storage.from(MEDIA_BUCKET).createSignedUploadUrl(path);
    if (error || !signed) throw new Error(error?.message ?? "Upload failed");
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
