// Pure access rules, shared by server checks and tests.

export type AccountMeta = {
  [key: string]: unknown;
  role?: unknown;
  courses?: unknown;
  session_epoch?: unknown;
};

/** Course ids a student may open, or null when they may open every course. */
export function allowedCourses(meta: AccountMeta | undefined): string[] | null {
  const list = meta?.courses;
  if (list === null) return null; // Only an explicit admin grant opens every course.
  if (!Array.isArray(list)) return [];
  return list.filter((c): c is string => typeof c === "string");
}

export function canOpenCourse(meta: AccountMeta | undefined, courseId: string): boolean {
  if (meta?.role === "admin") return true;
  if (meta?.role !== "student") return false;
  const allowed = allowedCourses(meta);
  return allowed === null || allowed.includes(courseId);
}

/** A token issued before the last "sign out everywhere" is no longer valid. */
export function tokenStillValid(issuedAtSec: number | undefined, meta: AccountMeta | undefined): boolean {
  const epoch = Number(meta?.session_epoch ?? 0);
  if (!epoch) return true;
  return Number.isFinite(epoch) && typeof issuedAtSec === "number" && issuedAtSec >= epoch;
}

/** Whether an admin may change this account from the students list. */
export function canManageAccount(target: AccountMeta | undefined, targetId: string, actorId: string): boolean {
  if (targetId === actorId) return false;
  return target?.role !== "admin";
}

export function readJwtIat(token: string): number | undefined {
  try {
    const part = token.split(".")[1] ?? "";
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    const iat = (JSON.parse(json) as { iat?: unknown }).iat;
    return typeof iat === "number" ? iat : undefined;
  } catch {
    return undefined;
  }
}

/** Simple fixed-window limiter. Per server instance; slows brute force and abuse. */
const buckets = new Map<string, { count: number; reset: number }>();
export function hitLimit(key: string, max: number, windowMs: number, now = Date.now()): boolean {
  const b = buckets.get(key);
  if (!b || b.reset <= now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    if (buckets.size > 5000) buckets.clear();
    return false;
  }
  b.count += 1;
  return b.count > max;
}

/** Shared (cross-instance) limiter state, stored outside the server instance. */
export type LimitState = { count: number; reset: number };

/** Whether a key is currently locked out, and for how long. */
export function limitStatus(s: LimitState | null, max: number, now = Date.now()) {
  if (!s || s.reset <= now) return { blocked: false, retryAfterMs: 0 };
  return { blocked: s.count >= max, retryAfterMs: s.count >= max ? s.reset - now : 0 };
}

/** Counts one more failed attempt inside the current window. */
export function addFailure(s: LimitState | null, windowMs: number, now = Date.now()): LimitState {
  if (!s || s.reset <= now) return { count: 1, reset: now + windowMs };
  return { count: s.count + 1, reset: s.reset };
}

/** Sign-in limits: per account and per network address. */
export const LOGIN_LIMITS = {
  email: { max: 5, windowMs: 15 * 60_000 },
  ip: { max: 20, windowMs: 15 * 60_000 },
} as const;
