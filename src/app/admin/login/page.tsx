import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { authenticate, clearFailures, clientIp, isAdmin, recordFailure, startSession, throttled } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Admin login", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

async function login(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").slice(0, 200);
  const password = String(formData.get("password") ?? "").slice(0, 200);
  const ip = await clientIp();
  if (throttled(ip, email)) redirect("/admin/login?e=wait");
  const u = await authenticate(email, password);
  if (!u) { recordFailure(ip, email); await audit(null, "login failed", email, `ip ${ip}`); redirect("/admin/login?e=bad"); }
  clearFailures(ip, email);
  await startSession(u);
  const row = await db.user.findUnique({ where: { id: u.id }, select: { id: true, email: true } });
  await audit(row, "login", "", `ip ${ip}`);
  redirect("/admin");
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  if (await isAdmin()) redirect("/admin");
  const { e } = await searchParams;
  const first = (await db.user.count()) === 0;
  const inp = "w-full rounded-lg border border-slate-300 px-3 py-2";
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <form action={login} className="w-full max-w-sm space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold">Poorvitha Mobiles – Admin</h1>
        {first && <p className="rounded bg-amber-50 p-2 text-xs text-amber-900">First-time setup: enter the email you want for the owner account and the setup password from the server&apos;s <code>.env</code> file (<code>ADMIN_PASSWORD</code>). You will then be asked to choose your own password.</p>}
        <input name="email" type="email" required autoFocus placeholder="Email" autoComplete="username" className={inp} />
        <input name="password" type="password" required placeholder={first ? "Setup password" : "Password"} autoComplete="current-password" className={inp} />
        {e === "bad" && <p role="alert" className="text-sm text-red-600">Incorrect email or password.</p>}
        {e === "wait" && <p role="alert" className="text-sm text-red-600">Too many attempts. Try again in 15 minutes.</p>}
        <button className="w-full rounded-lg bg-indigo-700 py-2 font-semibold text-white">Sign in</button>
      </form>
    </main>
  );
}
