import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./supabase-config";

export const MEDIA_BUCKET = "course-media";
export const DATA_BUCKET = "course-data";

export function getAdmin() {
  const key = process.env["SUPABASESERVICEROLE"];
  if (!key) throw new Error("Server is missing the service key");
  return createClient(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
