export type AuditEntry = { at: string; actor: string; action: string; target?: string | undefined };

/** Records one admin action as its own private file (no overwrite races). */
export async function logAdminAction(actor: string, action: string, target?: string) {
  try {
    const { getAdmin, DATA_BUCKET } = await import("./supabase-admin.server");
    const at = new Date().toISOString();
    const entry: AuditEntry = { at, actor, action: action.slice(0, 120), target: target?.slice(0, 200) };
    // Reverse-sortable name so newest files list first.
    const key = String(9999999999999 - Date.now()).padStart(13, "0");
    await getAdmin()
      .storage.from(DATA_BUCKET)
      .upload(`audit/${key}-${crypto.randomUUID().slice(0, 8)}.json`, JSON.stringify(entry), {
        contentType: "application/json",
      });
  } catch (e) {
    console.error("audit log failed", e);
  }
}

export async function readAudit(limit = 100): Promise<AuditEntry[]> {
  const { getAdmin, DATA_BUCKET } = await import("./supabase-admin.server");
  const bucket = getAdmin().storage.from(DATA_BUCKET);
  const { data } = await bucket.list("audit", { limit, sortBy: { column: "name", order: "asc" } });
  const files = (data ?? []).filter((f) => f.name.endsWith(".json"));
  const rows = await Promise.all(
    files.map(async (f) => {
      const { data: blob } = await bucket.download(`audit/${f.name}`);
      try {
        return blob ? (JSON.parse(await blob.text()) as AuditEntry) : null;
      } catch {
        return null;
      }
    }),
  );
  return rows.filter((r): r is AuditEntry => r !== null);
}
