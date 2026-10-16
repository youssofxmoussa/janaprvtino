import { courses, findPart } from "./courses";

export type MediaItem = { id: string; title: string; path: string; hidden?: boolean };
export type Question = {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
};
/** One session/lesson inside a part (e.g. Cytologie → Session 1). */
export type Lesson = {
  id: string;
  title: string;
  hidden?: boolean;
  videos: MediaItem[];
  pdfs: MediaItem[];
  questions: Question[];
};
export type CourseContent = {
  description: string;
  /** partId → ordered lessons */
  parts: Record<string, Lesson[]>;
};

export const emptyContent = (): CourseContent => ({ description: "", parts: {} });
export const emptyLesson = (title: string): Lesson => ({
  id: crypto.randomUUID(),
  title,
  videos: [],
  pdfs: [],
  questions: [],
});

export function isValidCourseId(id: unknown): id is string {
  return typeof id === "string" && courses.some((c) => c.id === id);
}

export function isValidPartId(courseId: string, partId: unknown): partId is string {
  return typeof partId === "string" && !!findPart(courseId, partId);
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export function isValidMediaPath(courseId: string, path: unknown): path is string {
  return (
    typeof path === "string" &&
    path.startsWith(`${courseId}/`) &&
    /^[a-z0-9]+\/[A-Za-z0-9._-]{1,120}$/.test(path)
  );
}

function sanitizeMedia(courseId: string, list: unknown): MediaItem[] {
  if (!Array.isArray(list)) return [];
  return list.slice(0, 50).map((raw) => {
    const m = (raw ?? {}) as Record<string, unknown>;
    if (!isValidMediaPath(courseId, m["path"])) throw new Error("Invalid file");
    return {
      id: str(m["id"], 64) || crypto.randomUUID(),
      title: str(m["title"], 160) || "Untitled",
      path: m["path"] as string,
      hidden: m["hidden"] === true,
    };
  });
}

function sanitizeQuestions(list: unknown, where: string): Question[] {
  const qs = Array.isArray(list) ? list.slice(0, 200) : [];
  return qs.map((raw, i) => {
    const q = (raw ?? {}) as Record<string, unknown>;
    const options = (Array.isArray(q["options"]) ? q["options"] : [])
      .map((o) => str(o, 300))
      .filter(Boolean)
      .slice(0, 6);
    const correct = Number(q["correctAnswer"]);
    const text = str(q["question"], 1000);
    if (!text) throw new Error(`${where}: question ${i + 1} is empty`);
    if (options.length < 2) throw new Error(`${where}: question ${i + 1} needs at least 2 answers`);
    if (!Number.isInteger(correct) || correct < 0 || correct >= options.length) {
      throw new Error(`${where}: question ${i + 1}, pick the correct answer`);
    }
    return { id: i + 1, question: text, options, correctAnswer: correct, explanation: str(q["explanation"], 1500) };
  });
}

/** Validates content an admin wants to save. Throws on anything malformed. */
export function sanitizeContent(courseId: string, raw: unknown): CourseContent {
  if (!isValidCourseId(courseId)) throw new Error("Unknown course");
  const c = (raw ?? {}) as Record<string, unknown>;
  const rawParts = (c["parts"] ?? {}) as Record<string, unknown>;
  const parts: Record<string, Lesson[]> = {};
  for (const [partId, list] of Object.entries(rawParts)) {
    if (!isValidPartId(courseId, partId)) throw new Error("Unknown section");
    if (!Array.isArray(list)) continue;
    parts[partId] = list.slice(0, 100).map((raw, i) => {
      const l = (raw ?? {}) as Record<string, unknown>;
      const title = str(l["title"], 160) || `Session ${i + 1}`;
      return {
        id: /^[A-Za-z0-9-]{1,64}$/.test(String(l["id"] ?? "")) ? String(l["id"]) : crypto.randomUUID(),
        title,
        hidden: l["hidden"] === true,
        videos: sanitizeMedia(courseId, l["videos"]),
        pdfs: sanitizeMedia(courseId, l["pdfs"]),
        questions: sanitizeQuestions(l["questions"], title),
      };
    });
  }
  return { description: str(c["description"], 3000), parts };
}

/** Reads stored JSON, upgrading the old one-page-per-course shape. */
export function normalizeStored(courseId: string, raw: unknown): CourseContent {
  const c = (raw ?? {}) as Record<string, unknown>;
  const out: CourseContent = { description: str(c["description"], 3000), parts: {} };
  if (c["parts"] && typeof c["parts"] === "object") {
    out.parts = c["parts"] as Record<string, Lesson[]>;
  } else if (Array.isArray(c["videos"]) || Array.isArray(c["pdfs"]) || Array.isArray(c["questions"])) {
    const first = courses.find((x) => x.id === courseId)?.parts[0]?.id;
    if (first) {
      out.parts[first] = [{
        id: "session-1",
        title: "Session 1",
        videos: (c["videos"] as MediaItem[]) ?? [],
        pdfs: (c["pdfs"] as MediaItem[]) ?? [],
        questions: (c["questions"] as Question[]) ?? [],
      }];
    }
  }
  return out;
}

export function allMedia(content: CourseContent): MediaItem[] {
  return Object.values(content.parts).flat().flatMap((l) => [...l.videos, ...l.pdfs]);
}
