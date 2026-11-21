import { db } from "./db";
import type { SessionUser } from "./auth";

/** Records who did what in the admin panel. Never throws. */
export async function audit(user: Pick<SessionUser, "id" | "email"> | null, action: string, target = "", detail = "") {
  try {
    await db.auditLog.create({ data: { userId: user?.id ?? null, userEmail: user?.email ?? "unknown", action, target: target.slice(0, 100), detail: detail.slice(0, 300) } });
  } catch (e) { console.error("audit failed:", e); }
}
