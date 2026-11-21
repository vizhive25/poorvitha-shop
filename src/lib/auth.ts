// Staff authentication. Each staff member has their own account (see the User table).
// The session cookie is HMAC-signed and bound to the user id + sessionVersion, so deactivating a user,
// resetting their password or "signing out everywhere" invalidates their sessions immediately.
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "crypto";
import { db } from "./db";
import { dummyHash, hashPassword, verifyPassword } from "./password";

const COOKIE = "pm_admin";
const MAX_AGE = 60 * 60 * 12; // 12 hours

export type Role = "OWNER" | "MANAGER" | "ORDERS";
export type Perm = "orders" | "products" | "staff";
export const ROLES: Role[] = ["OWNER", "MANAGER", "ORDERS"];
export const ROLE_LABEL: Record<Role, string> = { OWNER: "Owner (everything)", MANAGER: "Manager (products + orders)", ORDERS: "Orders only" };

const PERMS: Record<Role, Perm[]> = { OWNER: ["orders", "products", "staff"], MANAGER: ["orders", "products"], ORDERS: ["orders"] };
export const can = (role: string, p: Perm) => (PERMS[role as Role] ?? []).includes(p);

export type SessionUser = { id: number; email: string; name: string; role: Role; mustChangePassword: boolean };

const secret = () => {
  const s = process.env.ADMIN_SECRET;
  if (!s || s.length < 16) throw new Error("ADMIN_SECRET is not set (min 16 chars). See .env.example");
  return s;
};
const sign = (v: string) => createHmac("sha256", secret()).update(v).digest("hex");
const safeEq = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export async function startSession(u: { id: number; sessionVersion: number }) {
  const payload = `${u.id}.${u.sessionVersion}.${Date.now() + MAX_AGE * 1000}`;
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: MAX_AGE });
}
export async function endSession() { (await cookies()).delete(COOKIE); }

/** The signed-in, active staff member, or null. */
export async function currentUser(): Promise<SessionUser | null> {
  const v = (await cookies()).get(COOKIE)?.value;
  if (!v) return null;
  const parts = v.split(".");
  if (parts.length !== 4) return null;
  const [id, ver, exp, sig] = parts;
  if (!safeEq(sig, sign(`${id}.${ver}.${exp}`)) || Number(exp) < Date.now()) return null;
  const u = await db.user.findUnique({ where: { id: Number(id) } });
  if (!u || !u.active || u.sessionVersion !== Number(ver)) return null;
  return { id: u.id, email: u.email, name: u.name, role: u.role as Role, mustChangePassword: u.mustChangePassword };
}

export const isAdmin = async () => !!(await currentUser());

/** Any signed-in staff member. Call at the top of every admin page, server action and admin API route. */
export async function requireAdmin(opts: { allowMustChange?: boolean } = {}): Promise<SessionUser> {
  const u = await currentUser();
  if (!u) redirect("/admin/login");
  if (u.mustChangePassword && !opts.allowMustChange) redirect("/admin/account?must=1"); // new/reset accounts must set their own password first
  return u;
}

/** Signed in AND allowed to do `perm`. Others are sent back to the dashboard. */
export async function requirePerm(perm: Perm): Promise<SessionUser> {
  const u = await requireAdmin();
  if (!can(u.role, perm)) redirect("/admin?denied=1");
  return u;
}

/** Same checks for API routes: returns the user or null (caller answers 401/403). */
export async function apiUser(perm: Perm): Promise<SessionUser | null> {
  const u = await currentUser();
  return u && !u.mustChangePassword && can(u.role, perm) ? u : null;
}

// ---------- login ----------
export async function authenticate(email: string, password: string): Promise<{ id: number; sessionVersion: number } | null> {
  const e = email.trim().toLowerCase();

  // Owner recovery without a terminal (e.g. on managed hosting): set ADMIN_RESET_EMAIL and ADMIN_RESET_PASSWORD in the
  // server settings, restart, sign in with them, choose a new password, then REMOVE both settings.
  const rEmail = process.env.ADMIN_RESET_EMAIL?.trim().toLowerCase(), rPw = process.env.ADMIN_RESET_PASSWORD;
  if (rEmail && rPw && e === rEmail && safeEq(sign("pw:" + password), sign("pw:" + rPw))) {
    const passwordHash = await hashPassword(password);
    const found = await db.user.findUnique({ where: { email: e } });
    const u = found
      ? await db.user.update({ where: { id: found.id }, data: { passwordHash, role: "OWNER", active: true, mustChangePassword: true, sessionVersion: { increment: 1 } } })
      : await db.user.create({ data: { email: e, name: "Owner", role: "OWNER", passwordHash, mustChangePassword: true } });
    await db.auditLog.create({ data: { userId: u.id, userEmail: u.email, action: "owner recovery used", target: "", detail: "ADMIN_RESET_* settings: remove them now" } });
    return { id: u.id, sessionVersion: u.sessionVersion };
  }

  const count = await db.user.count();
  if (count === 0) {
    // First run: the owner account is created once, using the setup password from .env as proof of access.
    const setup = process.env.ADMIN_PASSWORD;
    if (!setup || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e) || !safeEq(sign("pw:" + password), sign("pw:" + setup))) return null;
    const u = await db.user.create({ data: { email: e, name: "Owner", role: "OWNER", passwordHash: await hashPassword(password), mustChangePassword: true } });
    return { id: u.id, sessionVersion: u.sessionVersion };
  }
  const u = await db.user.findUnique({ where: { email: e } });
  const ok = await verifyPassword(password, u?.passwordHash ?? (await dummyHash())); // always do the work
  if (!u || !u.active || !ok) return null;
  await db.user.update({ where: { id: u.id }, data: { lastLoginAt: new Date() } });
  return { id: u.id, sessionVersion: u.sessionVersion };
}

// --- tiny in-memory login throttle, keyed by IP and by email (resets on server restart) ---
const attempts = new Map<string, { n: number; first: number }>();
const WINDOW = 15 * 60 * 1000, LIMIT = 8;
export async function clientIp() {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "local").trim();
}
const keys = (ip: string, email: string) => [`ip:${ip}`, `em:${email.trim().toLowerCase()}`];
export function throttled(ip: string, email: string): boolean {
  return keys(ip, email).some((k) => { const a = attempts.get(k); return !!a && Date.now() - a.first <= WINDOW && a.n >= LIMIT; });
}
export function recordFailure(ip: string, email: string) {
  for (const k of keys(ip, email)) {
    const a = attempts.get(k);
    if (!a || Date.now() - a.first > WINDOW) attempts.set(k, { n: 1, first: Date.now() });
    else a.n++;
  }
}
export function clearFailures(ip: string, email: string) { for (const k of keys(ip, email)) attempts.delete(k); }
