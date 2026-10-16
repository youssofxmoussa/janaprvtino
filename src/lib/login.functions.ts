import { createServerFn } from "@tanstack/react-start";
import { LOGIN_LIMITS } from "./access";

const wait = (ms: number) => `Too many attempts. Try again in ${Math.max(1, Math.ceil(ms / 60_000))} min.`;

/** Sign-in goes through the server so attempts are counted for everyone, everywhere. */
export const signInWithLimit = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; password: string }) => {
    const email = String(input?.email ?? "").trim().toLowerCase().slice(0, 254);
    const password = String(input?.password ?? "").slice(0, 72);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password) throw new Error("Incorrect email or password.");
    return { email, password };
  })
  .handler(async ({ data }) => {
    const { getRequestHeader } = await import("@tanstack/react-start/server");
    const { checkLimit, recordFailure, clearLimit } = await import("./rate-limit.server");
    const ip = getRequestHeader("cf-connecting-ip") ?? getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const emailKey = `login:email:${data.email}`;
    const ipKey = `login:ip:${ip}`;

    const [byEmail, byIp] = await Promise.all([
      checkLimit(emailKey, LOGIN_LIMITS.email.max),
      checkLimit(ipKey, LOGIN_LIMITS.ip.max),
    ]);
    if (byEmail.blocked || byIp.blocked) {
      return { ok: false as const, error: wait(Math.max(byEmail.retryAfterMs, byIp.retryAfterMs)) };
    }

    const { createClient } = await import("@supabase/supabase-js");
    const { SUPABASE_URL, SUPABASE_ANON_KEY } = await import("./supabase-config");
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    });
    const { data: res, error } = await client.auth.signInWithPassword(data);

    if (error || !res.session) {
      await Promise.all([
        recordFailure(emailKey, LOGIN_LIMITS.email.windowMs),
        recordFailure(ipKey, LOGIN_LIMITS.ip.windowMs),
      ]);
      const paused = /banned/i.test(error?.message ?? "");
      return { ok: false as const, error: paused ? "Your account is paused. Contact your teacher." : "Incorrect email or password." };
    }

    await clearLimit(emailKey);
    const role = res.user?.app_metadata?.["role"];
    if (role !== "admin" && role !== "student") {
      return { ok: false as const, error: "This account has no access. Contact your teacher." };
    }
    return {
      ok: true as const,
      access_token: res.session.access_token,
      refresh_token: res.session.refresh_token,
    };
  });
