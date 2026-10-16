import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "./auth.middleware";

export type Student = {
  id: string;
  email: string;
  createdAt: string;
  lastSignIn: string | null;
  paused: boolean;
  isAdmin: boolean;
};

const FOREVER = "876000h";

async function admin() {
  const { getAdmin } = await import("./supabase-admin.server");
  return getAdmin();
}

function checkPassword(p: unknown): string {
  if (typeof p !== "string" || p.length < 6 || p.length > 72) {
    throw new Error("Password must be 6–72 characters.");
  }
  return p;
}

async function assertStudent(id: string) {
  const { data, error } = await (await admin()).auth.admin.getUserById(id);
  if (error || !data.user) throw new Error("Student not found.");
  if (data.user.app_metadata?.["role"] === "admin") throw new Error("Admin accounts can't be changed here.");
}

export const listStudents = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .handler(async (): Promise<Student[]> => {
    const a = await admin();
    const all: Student[] = [];
    for (let page = 1; page < 50; page++) {
      const { data, error } = await a.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw new Error(error.message);
      for (const u of data.users) {
        const banned = (u as { banned_until?: string | null }).banned_until;
        all.push({
          id: u.id,
          email: u.email ?? "",
          createdAt: u.created_at,
          lastSignIn: u.last_sign_in_at ?? null,
          paused: Boolean(banned && new Date(banned).getTime() > Date.now()),
          isAdmin: u.app_metadata?.["role"] === "admin",
        });
      }
      if (data.users.length < 200) break;
    }
    return all.sort((x, y) => Number(x.isAdmin) - Number(y.isAdmin) || y.createdAt.localeCompare(x.createdAt));
  });

export const createStudent = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: { email: string; password: string }) => {
    const email = String(input?.email ?? "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email.");
    return { email, password: checkPassword(input?.password) };
  })
  .handler(async ({ data }) => {
    const { error } = await (await admin()).auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      app_metadata: { role: "student" },
    });
    if (error) throw new Error(error.message.includes("already") ? "This email already has an account." : error.message);
    return { ok: true };
  });

export const setStudentPaused = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: { id: string; paused: boolean }) => ({ id: String(input?.id), paused: Boolean(input?.paused) }))
  .handler(async ({ data }) => {
    await assertStudent(data.id);
    const { error } = await (await admin()).auth.admin.updateUserById(data.id, {
      ban_duration: data.paused ? FOREVER : "none",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setStudentPassword = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: { id: string; password: string }) => ({ id: String(input?.id), password: checkPassword(input?.password) }))
  .handler(async ({ data }) => {
    await assertStudent(data.id);
    const { error } = await (await admin()).auth.admin.updateUserById(data.id, { password: data.password });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteStudent = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: { id: string }) => ({ id: String(input?.id) }))
  .handler(async ({ data }) => {
    await assertStudent(data.id);
    const { error } = await (await admin()).auth.admin.deleteUser(data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
