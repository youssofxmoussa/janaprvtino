// Shared rate limiter: counters live in the private data bucket, so every
// server instance and every device sees the same count.
import { addFailure, limitStatus, type LimitState } from "./access";

async function pathFor(key: string) {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(key)));
  return `ratelimit/${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}.json`;
}

async function bucket() {
  const { getAdmin, DATA_BUCKET } = await import("./supabase-admin.server");
  return getAdmin().storage.from(DATA_BUCKET);
}

async function read(key: string): Promise<LimitState | null> {
  const { data } = await (await bucket()).download(await pathFor(key));
  if (!data) return null;
  try {
    const s = JSON.parse(await data.text()) as LimitState;
    return typeof s.count === "number" && typeof s.reset === "number" ? s : null;
  } catch {
    return null;
  }
}

export async function checkLimit(key: string, max: number) {
  return limitStatus(await read(key), max);
}

export async function recordFailure(key: string, windowMs: number) {
  const next = addFailure(await read(key), windowMs);
  await (await bucket()).upload(await pathFor(key), JSON.stringify(next), { upsert: true, contentType: "application/json" });
  return next;
}

export async function clearLimit(key: string) {
  await (await bucket()).remove([await pathFor(key)]);
}
