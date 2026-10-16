import { courses } from "./courses";

export type MediaItem = { id: string; title: string; path: string; hidden?: boolean };
export type Question = {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
};
export type CourseContent = {
  description: string;
  videos: MediaItem[];
  pdfs: MediaItem[];
  questions: Question[];
};

export const emptyContent = (): CourseContent => ({
  description: "",
  videos: [],
  pdfs: [],
  questions: [],
});

export function isValidCourseId(id: unknown): id is string {
  return typeof id === "string" && courses.some((c) => c.id === id);
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

/** Validates content an admin wants to save. Throws on anything malformed. */
export function sanitizeContent(courseId: string, raw: unknown): CourseContent {
  if (!isValidCourseId(courseId)) throw new Error("Unknown course");
  const c = (raw ?? {}) as Record<string, unknown>;
  const qs = Array.isArray(c["questions"]) ? c["questions"].slice(0, 200) : [];
  const questions = qs.map((raw, i) => {
    const q = (raw ?? {}) as Record<string, unknown>;
    const options = (Array.isArray(q["options"]) ? q["options"] : [])
      .map((o) => str(o, 300))
      .filter(Boolean)
      .slice(0, 6);
    const correct = Number(q["correctAnswer"]);
    const text = str(q["question"], 1000);
    if (!text) throw new Error(`Question ${i + 1} is empty`);
    if (options.length < 2) throw new Error(`Question ${i + 1} needs at least 2 answers`);
    if (!Number.isInteger(correct) || correct < 0 || correct >= options.length) {
      throw new Error(`Question ${i + 1}: pick the correct answer`);
    }
    return { id: i + 1, question: text, options, correctAnswer: correct, explanation: str(q["explanation"], 1500) };
  });
  return {
    description: str(c["description"], 3000),
    videos: sanitizeMedia(courseId, c["videos"]),
    pdfs: sanitizeMedia(courseId, c["pdfs"]),
    questions,
  };
}
