import { requireAdmin } from "@/lib/auth";
import { MIN_PASSWORD } from "@/lib/password";
import { changeOwnPassword, signOutEverywhere } from "../staff-actions";

export const metadata = { title: "My account" };

export default async function Account({ searchParams }: { searchParams: Promise<{ saved?: string; err?: string; must?: string }> }) {
  const me = await requireAdmin({ allowMustChange: true });
  const { saved, err, must } = await searchParams;
  const inp = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";
  return (
    <div className="max-w-md space-y-5">
      <h1 className="text-2xl font-bold">My account</h1>
      <p className="text-sm text-slate-600">{me.name} · {me.email} · {me.role.toLowerCase()}</p>
      {must && <p className="rounded bg-amber-100 px-3 py-2 text-sm text-amber-900">Please choose your own password to continue. Enter the temporary password you were given as the current password.</p>}
      {saved && <p className="rounded bg-green-100 px-3 py-2 text-sm text-green-800">Saved.</p>}
      {err && <p role="alert" className="rounded bg-red-100 px-3 py-2 text-sm text-red-800">{err}</p>}
      <form action={changeOwnPassword} className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="font-bold">Change password</h2>
        <input name="current" type="password" required placeholder="Current password" autoComplete="current-password" className={inp} />
        <input name="password" type="password" required minLength={MIN_PASSWORD} placeholder={`New password (min ${MIN_PASSWORD} characters, letters + numbers)`} autoComplete="new-password" className={inp} />
        <input name="again" type="password" required placeholder="New password again" autoComplete="new-password" className={inp} />
        <button className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white">Change password</button>
        <p className="text-xs text-slate-500">Changing your password signs you out on all other devices.</p>
      </form>
      <form action={signOutEverywhere} className="rounded-2xl border bg-white p-5 shadow-sm">
        <h2 className="mb-2 font-bold">Lost a device?</h2>
        <button className="rounded-lg border px-4 py-2 text-sm">Sign out everywhere else</button>
      </form>
    </div>
  );
}
