"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ROLES, requireAdmin, requirePerm, startSession, type Role } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { hashPassword, passwordProblem, verifyPassword } from "@/lib/password";

const str = (v: FormDataEntryValue | null, max = 200) => String(v ?? "").trim().slice(0, max);
const go = (path: string, q: string): never => redirect(`${path}?${q}`);
const msg = (m: string) => `err=${encodeURIComponent(m)}`;

async function activeOwners(excludingId?: number) {
  return db.user.count({ where: { role: "OWNER", active: true, ...(excludingId ? { id: { not: excludingId } } : {}) } });
}

/** Owner only: add a staff member with a temporary password they must change at first login. */
export async function createStaff(formData: FormData) {
  const me = await requirePerm("staff");
  const email = str(formData.get("email")).toLowerCase(), name = str(formData.get("name"), 80), role = str(formData.get("role"), 20) as Role, pw = String(formData.get("password") ?? "");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return go("/admin/staff", msg("Enter a valid email address."));
  if (!name) return go("/admin/staff", msg("Enter a name."));
  if (!ROLES.includes(role)) return go("/admin/staff", msg("Choose a role."));
  const problem = passwordProblem(pw);
  if (problem) return go("/admin/staff", msg(problem));
  if (await db.user.findUnique({ where: { email } })) return go("/admin/staff", msg("That email already has an account."));
  await db.user.create({ data: { email, name, role, passwordHash: await hashPassword(pw), mustChangePassword: true } });
  await audit(me, "staff added", email, role);
  go("/admin/staff", "saved=1");
}

/** Owner only: change a role or switch an account on/off. */
export async function updateStaff(formData: FormData) {
  const me = await requirePerm("staff");
  const id = Number(formData.get("id")), role = str(formData.get("role"), 20) as Role, active = formData.get("active") === "on";
  const u = id ? await db.user.findUnique({ where: { id } }) : null;
  if (!u || !ROLES.includes(role)) return;
  if (u.id === me.id && (role !== u.role || !active)) return go("/admin/staff", msg("You can't change your own role or deactivate yourself."));
  if (u.role === "OWNER" && u.active && (role !== "OWNER" || !active) && (await activeOwners(u.id)) === 0)
    return go("/admin/staff", msg("There must always be at least one active owner."));
  await db.user.update({ where: { id }, data: { role, active, ...(!active ? { sessionVersion: { increment: 1 } } : {}) } });
  await audit(me, "staff updated", u.email, `role ${u.role}→${role}, active ${u.active}→${active}`);
  go("/admin/staff", "saved=1");
}

/** Owner only: set a new temporary password and sign that person out everywhere. */
export async function resetStaffPassword(formData: FormData) {
  const me = await requirePerm("staff");
  const id = Number(formData.get("id")), pw = String(formData.get("password") ?? "");
  const u = id ? await db.user.findUnique({ where: { id } }) : null;
  if (!u) return;
  const problem = passwordProblem(pw);
  if (problem) return go("/admin/staff", msg(problem));
  await db.user.update({ where: { id }, data: { passwordHash: await hashPassword(pw), mustChangePassword: true, sessionVersion: { increment: 1 } } });
  await audit(me, "staff password reset", u.email);
  // If an owner resets their own password, keep them signed in with a fresh session.
  if (u.id === me.id) { const f = await db.user.findUnique({ where: { id }, select: { id: true, sessionVersion: true } }); if (f) await startSession(f); }
  go("/admin/staff", "saved=1");
}

/** Any staff member: change their own password (needs the current one). */
export async function changeOwnPassword(formData: FormData) {
  const me = await requireAdmin({ allowMustChange: true });
  const cur = String(formData.get("current") ?? ""), pw = String(formData.get("password") ?? ""), again = String(formData.get("again") ?? "");
  const u = await db.user.findUnique({ where: { id: me.id } });
  if (!u || !(await verifyPassword(cur, u.passwordHash))) return go("/admin/account", msg("Your current password is not correct."));
  if (pw !== again) return go("/admin/account", msg("The new passwords don't match."));
  const problem = passwordProblem(pw);
  if (problem) return go("/admin/account", msg(problem));
  if (pw === cur) return go("/admin/account", msg("Choose a password different from the current one."));
  const n = await db.user.update({ where: { id: me.id }, data: { passwordHash: await hashPassword(pw), mustChangePassword: false, sessionVersion: { increment: 1 } } });
  await startSession(n); // other devices are signed out, this one stays
  await audit(me, "password changed");
  go("/admin/account", "saved=1");
}

/** Any staff member: sign out of every device (e.g. a lost phone). */
export async function signOutEverywhere() {
  const me = await requireAdmin({ allowMustChange: true });
  const n = await db.user.update({ where: { id: me.id }, data: { sessionVersion: { increment: 1 } } });
  await startSession(n);
  await audit(me, "signed out everywhere");
  go("/admin/account", "saved=1");
}
