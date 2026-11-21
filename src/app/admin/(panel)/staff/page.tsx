import { db } from "@/lib/db";
import { ROLES, ROLE_LABEL, requirePerm } from "@/lib/auth";
import { MIN_PASSWORD } from "@/lib/password";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { createStaff, resetStaffPassword, updateStaff } from "../staff-actions";

export const metadata = { title: "Staff" };

export default async function Staff({ searchParams }: { searchParams: Promise<{ saved?: string; err?: string }> }) {
  const me = await requirePerm("staff");
  const { saved, err } = await searchParams;
  const users = await db.user.findMany({ orderBy: { createdAt: "asc" } });
  const card = "rounded-2xl border bg-white p-5 shadow-sm";
  const inp = "rounded border border-slate-300 px-2 py-1 text-sm";
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Staff</h1>
      {saved && <p className="rounded bg-green-100 px-3 py-2 text-sm text-green-800">Saved.</p>}
      {err && <p role="alert" className="rounded bg-red-100 px-3 py-2 text-sm text-red-800">{err}</p>}

      <section className={card}>
        <h2 className="mb-3 font-bold">Add a staff member</h2>
        <form action={createStaff} className="grid gap-3 text-sm md:grid-cols-5">
          <input name="name" required placeholder="Name" className={inp} />
          <input name="email" type="email" required placeholder="Email" className={inp} />
          <select name="role" defaultValue="ORDERS" className={inp}>{ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select>
          <input name="password" type="text" required minLength={MIN_PASSWORD} placeholder="Temporary password" autoComplete="off" className={inp} />
          <button className="rounded bg-indigo-700 px-3 py-1 font-semibold text-white">Add</button>
        </form>
        <p className="mt-2 text-xs text-slate-500">Share the temporary password privately. They must choose their own at first sign-in. At least {MIN_PASSWORD} characters, with letters and numbers.</p>
      </section>

      <section className={`${card} overflow-x-auto`}>
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-slate-500"><tr><th className="pb-2">Person</th><th>Role</th><th>Active</th><th>Last sign-in</th><th>Reset password</th></tr></thead>
          <tbody className="divide-y">
            {users.map((u) => {
              const fid = `u${u.id}`;
              const self = u.id === me.id;
              return (
                <tr key={u.id} className={u.active ? "" : "text-slate-400"}>
                  <td className="py-2">{u.name}{self && <span className="ml-1 text-xs text-indigo-700">(you)</span>}<br /><span className="text-xs text-slate-500">{u.email}</span>{u.mustChangePassword && <span className="ml-1 rounded bg-amber-100 px-1 text-xs text-amber-800">temp password</span>}</td>
                  <td><select form={fid} name="role" defaultValue={u.role} disabled={self} className={inp}>{ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select></td>
                  <td><input form={fid} name="active" type="checkbox" defaultChecked={u.active} disabled={self} /></td>
                  <td className="text-xs text-slate-500">{u.lastLoginAt ? u.lastLoginAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "never"}</td>
                  <td>
                    <div className="flex flex-wrap items-center gap-2">
                      {!self && <form id={fid} action={updateStaff}><input type="hidden" name="id" value={u.id} /><button className="rounded bg-slate-900 px-3 py-1 text-xs text-white">Save</button></form>}
                      <form action={resetStaffPassword} className="flex items-center gap-1"><input type="hidden" name="id" value={u.id} /><input name="password" required minLength={MIN_PASSWORD} placeholder="New temp password" autoComplete="off" className={`${inp} w-36`} /><ConfirmButton message={`Reset ${u.name}'s password and sign them out everywhere?`} className="rounded border px-2 py-1 text-xs">Reset</ConfirmButton></form>
                    </div>
                  </td>
                </tr>);
            })}
          </tbody>
        </table>
      </section>

      <section className={card}>
        <h2 className="mb-2 font-bold">What each role can do</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li><b>Owner:</b> everything, including staff accounts and the activity log.</li>
          <li><b>Manager:</b> products (prices, stock, images, delete) and orders (status, shipping, messages, CSV export).</li>
          <li><b>Orders only:</b> view and process orders. No access to products, staff or revenue figures.</li>
        </ul>
      </section>
    </div>
  );
}
