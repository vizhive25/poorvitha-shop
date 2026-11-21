import { db } from "@/lib/db";
import { requirePerm } from "@/lib/auth";

export const metadata = { title: "Activity" };

export default async function Activity({ searchParams }: { searchParams: Promise<{ who?: string }> }) {
  await requirePerm("staff");
  const { who = "" } = await searchParams;
  const [rows, people] = await Promise.all([
    db.auditLog.findMany({ where: who ? { userEmail: who } : {}, orderBy: { createdAt: "desc" }, take: 300 }),
    db.auditLog.findMany({ distinct: ["userEmail"], select: { userEmail: true }, orderBy: { userEmail: "asc" } }),
  ]);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Activity <span className="text-sm font-normal text-slate-500">(latest 300)</span></h1>
      <form className="flex gap-2 text-sm">
        <select name="who" defaultValue={who} className="rounded border border-slate-300 px-2 py-1"><option value="">Everyone</option>{people.map((p) => <option key={p.userEmail}>{p.userEmail}</option>)}</select>
        <button className="rounded border bg-white px-3 py-1">Filter</button>
      </form>
      <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">When</th><th>Who</th><th>Action</th><th>Target</th><th>Detail</th></tr></thead>
          <tbody className="divide-y">
            {rows.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-slate-500">Nothing recorded yet.</td></tr>}
            {rows.map((a) => (
              <tr key={a.id}><td className="whitespace-nowrap p-3 text-slate-500">{a.createdAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</td><td>{a.userEmail}</td><td className={a.action === "login failed" ? "text-red-700" : ""}>{a.action}</td><td>{a.target}</td><td className="text-slate-600">{a.detail}</td></tr>))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
