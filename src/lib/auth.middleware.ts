import { createMiddleware } from "@tanstack/react-start";
import { hitLimit, readJwtIat, tokenStillValid, type AccountMeta } from "./access";

/** Browser side: attach the signed-in user's access token to every server call. */
export const attachAuth = createMiddleware({ type: "function" }).client(async ({ next }) => {
  const { supabase } = await import("./supabase");
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return next({ headers: token ? { Authorization: `Bearer ${token}` } : {} });
});

/** Server side: only real, active students or admins get through. */
export const requireMember = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const { getRequestHeader } = await import("@tanstack/react-start/server");
  const { getAdmin } = await import("./supabase-admin.server");
  const header = getRequestHeader("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token || token.length > 4096) throw new Error("Please sign in again.");

  const ip = getRequestHeader("cf-connecting-ip") ?? getRequestHeader("x-forwarded-for") ?? "unknown";
  if (hitLimit(`ip:${ip}`, 240, 60_000)) throw new Error("Too many requests. Wait a minute and try again.");

  const { data, error } = await getAdmin().auth.getUser(token);
  const user = data?.user;
  if (error || !user) throw new Error("Please sign in again.");

  const banned = (user as { banned_until?: string | null }).banned_until;
  if (banned && new Date(banned).getTime() > Date.now()) {
    throw new Error("Your account is paused. Contact your teacher.");
  }

  const meta = (user.app_metadata ?? {}) as AccountMeta;
  if (!tokenStillValid(readJwtIat(token), meta)) throw new Error("Please sign in again.");

  const role = meta.role;
  if (role !== "admin" && role !== "student") {
    throw new Error("This account has no access.");
  }

  return next({
    context: { userId: user.id, email: user.email ?? "", isAdmin: role === "admin", meta },
  });
});

export const requireAdmin = createMiddleware({ type: "function" })
  .middleware([requireMember])
  .server(async ({ next, context }) => {
    if (!context.isAdmin) throw new Error("Admins only.");
    if (hitLimit(`admin:${context.userId}`, 120, 60_000)) throw new Error("Too many actions. Wait a minute.");
    return next();
  });
