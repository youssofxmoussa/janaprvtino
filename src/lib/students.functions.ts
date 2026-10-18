import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "./auth.middleware";
import { allowedCourses, canManageAccount } from "./access";
import { isValidCourseId } from "./course-content";

export type Student = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  lastSignIn: string | null;
  paused: boolean;
  isAdmin: boolean;
  courses: string[] | null;
};

const FOREVER = "876000h";
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const ID_RE = /^[0-9a-f-]{36}$/i;

async function admin() {
  const { getAdmin } = await import("./supabase-admin.server");
  return getAdmin();
}
async function audit(actor: string, action: string, target?: string) {
  const { logAdminAction } = await import("./audit.server");
  await logAdminAction(actor, action, target);
}

function checkPassword(p: unknown): string {
  if (typeof p !== "string" || p.length < 8 || p.length > 72) {
    throw new Error("Password must be 8–72 characters.");
  }
  return p;
}
function checkEmail(e: unknown): string {
  const email = String(e ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) throw new Error("Enter a valid email.");
  return email;
}
function checkId(id: unknown): string {
  const s = String(id ?? "");
  if (!ID_RE.test(s)) throw new Error("Student not found.");
  return s;
}

/** Loads the target and refuses admins and the caller's own account. */
async function assertStudent(id: string, actorId: string) {
  const { data, error } = await (await admin()).auth.admin.getUserById(id);
  if (error || !data.user) throw new Error("Student not found.");
  if (!canManageAccount(data.user.app_metadata, id, actorId)) {
    throw new Error("Admin accounts can't be changed here.");
  }
  return data.user;
}

export const listStudents = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .handler(async (): Promise<Student[]> => {
    const a = await admin();
    const all: Student[] = [];
    for (let page = 1; page < 50; page++) {
      const { data, error } = await a.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw new Error("Couldn't load students.");
      for (const u of data.users) {
        const banned = (u as { banned_until?: string | null }).banned_until;
        all.push({
          id: u.id,
          email: u.email ?? "",
          name: String(u.user_metadata?.["name"] ?? ""),
          createdAt: u.created_at,
          lastSignIn: u.last_sign_in_at ?? null,
          paused: Boolean(banned && new Date(banned).getTime() > Date.now()),
          isAdmin: u.app_metadata?.["role"] === "admin",
          courses: allowedCourses(u.app_metadata),
        });
      }
      if (data.users.length < 200) break;
    }
    return all.sort((x, y) => Number(y.isAdmin) - Number(x.isAdmin) || y.createdAt.localeCompare(x.createdAt));
  });

export const createStudent = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: { email: string; password: string; name?: string }) => ({
    email: checkEmail(input?.email),
    password: checkPassword(input?.password),
    name: String(input?.name ?? "").trim().slice(0, 80),
  }))
  .handler(async ({ data, context }) => {
    const { error } = await (await admin()).auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: data.name ? { name: data.name } : {},
      app_metadata: { role: "student", courses: [] },
    });
    if (error) throw new Error(error.message.includes("already") ? "This email already has an account." : "Couldn't create the student.");
    await audit(context.email, "Added student", data.email);
    return { ok: true };
  });

/** Lines like "email password" or "email,password". */
export const bulkCreateStudents = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: { text: string }) => {
    const lines = String(input?.text ?? "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length > 200) throw new Error("Up to 200 students at once.");
    return {
      rows: lines.map((l, i) => {
        const [e, p] = l.split(/[\s,;]+/);
        try {
          return { email: checkEmail(e), password: checkPassword(p) };
        } catch (err) {
          throw new Error(`Line ${i + 1}: ${(err as Error).message}`);
        }
      }),
    };
  })
  .handler(async ({ data, context }) => {
    const a = await admin();
    let created = 0;
    const failed: string[] = [];
    for (const r of data.rows) {
      const { error } = await a.auth.admin.createUser({
        email: r.email,
        password: r.password,
        email_confirm: true,
        app_metadata: { role: "student", courses: [] },
      });
      if (error) failed.push(r.email);
      else created++;
    }
    await audit(context.email, `Bulk added ${created} students`);
    return { created, failed };
  });

export const setStudentPaused = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: { id: string; paused: boolean }) => ({ id: checkId(input?.id), paused: Boolean(input?.paused) }))
  .handler(async ({ data, context }) => {
    const u = await assertStudent(data.id, context.userId);
    const { error } = await (await admin()).auth.admin.updateUserById(data.id, {
      ban_duration: data.paused ? FOREVER : "none",
      ...(data.paused ? { app_metadata: { ...u.app_metadata, session_epoch: Math.floor(Date.now() / 1000) + 1 } } : {}),
    });
    if (error) throw new Error("Couldn't update the student.");
    await audit(context.email, data.paused ? "Paused student" : "Resumed student", u.email);
    return { ok: true };
  });

export const setStudentPassword = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: { id: string; password: string }) => ({ id: checkId(input?.id), password: checkPassword(input?.password) }))
  .handler(async ({ data, context }) => {
    const u = await assertStudent(data.id, context.userId);
    const { error } = await (await admin()).auth.admin.updateUserById(data.id, {
      password: data.password,
      app_metadata: { ...u.app_metadata, session_epoch: Math.floor(Date.now() / 1000) + 1 },
    });
    if (error) throw new Error("Couldn't change the password.");
    await audit(context.email, "Reset password", u.email);
    return { ok: true };
  });

export const setStudentCourses = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: { id: string; courses: string[] | null }) => {
    const id = checkId(input?.id);
    if (input?.courses === null) return { id, courses: null };
    if (!Array.isArray(input?.courses)) throw new Error("Bad course list");
    return { id, courses: [...new Set(input.courses.filter(isValidCourseId))] };
  })
  .handler(async ({ data, context }) => {
    const u = await assertStudent(data.id, context.userId);
    const meta = { ...u.app_metadata } as Record<string, unknown>;
    meta["courses"] = data.courses;
    const { error } = await (await admin()).auth.admin.updateUserById(data.id, { app_metadata: meta });
    if (error) throw new Error("Couldn't save course access.");
    await audit(context.email, data.courses === null ? "Gave access to all courses" : `Set ${data.courses.length} courses`, u.email);
    return { ok: true };
  });

export const signOutStudent = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: { id: string }) => ({ id: checkId(input?.id) }))
  .handler(async ({ data, context }) => {
    const u = await assertStudent(data.id, context.userId);
    const { error } = await (await admin()).auth.admin.updateUserById(data.id, {
      app_metadata: { ...u.app_metadata, session_epoch: Math.floor(Date.now() / 1000) + 1 },
    });
    if (error) throw new Error("Couldn't sign the student out.");
    await audit(context.email, "Signed out of all devices", u.email);
    return { ok: true };
  });

export const deleteStudent = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .inputValidator((input: { id: string }) => ({ id: checkId(input?.id) }))
  .handler(async ({ data, context }) => {
    const u = await assertStudent(data.id, context.userId);
    const { error } = await (await admin()).auth.admin.deleteUser(data.id);
    if (error) throw new Error("Couldn't delete the student.");
    await audit(context.email, "Deleted student", u.email);
    return { ok: true };
  });
