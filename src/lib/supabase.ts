import { createClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./supabase-config";

// Browser client. Only the publishable key lives here; everything private is
// checked again on the server with the user's access token.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: typeof window !== "undefined",
    autoRefreshToken: typeof window !== "undefined",
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
  },
});

export async function getSessionUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  const user = data.user;
  const role = user?.app_metadata?.["role"];
  return role === "student" || role === "admin" ? user : null;
}

export function isAdmin(user: { app_metadata?: Record<string, unknown> } | null) {
  return user?.app_metadata?.["role"] === "admin";
}
