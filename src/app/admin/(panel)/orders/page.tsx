import Link from "next/link";
import { requirePerm } from "@/lib/auth";
import { db } from "@/lib/db";
import { inr } from "@/lib/shop";
import { ORDER_STATUSES, parseItems } from "@/lib/orders";
import { expirePendingOrders } from "@/lib/payments";

export const metadata = { title: "Orders" };
const PAGE = 25;
const badge: Record<string, string> = { PENDING_PAYMENT: "bg-orange-100 text-orange-800", PLACED: "bg-amber-100 text-amber-800", CONFIRMED: "bg-blue-100 text-blue-800", SHIPPED: "bg-indigo-100 text-indigo-800", DELIVERED: "bg-green-100 text-green-800", CANCELLED: "bg-slate-200 text-slate-600" };

export default async function Orders({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; page?: string }> }) {
  await requirePerm("orders");
  const { status = "", q = "", page = "1" } = await searchParams;
  await expirePendingOrders().catch(() => {});
  const where = {
    ...((ORDER_STATUSES as readonly string[]).includes(status) ? { status } : {}),
    ...(q ? { OR: [{ orderId: { contains: q } }, { name: { contains: q } }, { phone: { contains: q } }] } : {}),
  };
  const pg = Math.max(1, Number(page) || 1);
  const [total, rows] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({ where, orderBy: { createdAt: "desc" }, skip: (pg - 1) * PAGE, take: PAGE }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const qs = (p: number) => `?status=${status}&q=${encodeURIComponent(q)}&page=${p}`;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Orders <span className="text-sm font-normal text-slate-500">({total})</span></h1>
      <form className="flex flex-wrap gap-2 text-sm">
        <input name="q" defaultValue={q} placeholder="Order ID, name or phone" className="w-64 rounded border border-slate-300 px-2 py-1" />
        <select name="status" defaultValue={status} className="rounded border border-slate-300 px-2 py-1"><option value="">All statuses</option>{ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
        <button className="rounded border bg-white px-3 py-1">Filter</button>
        <a href="/api/admin/orders.csv" className="rounded border bg-white px-3 py-1">Export CSV</a>
      </form>
      <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Payment</th><th>Placed</th></tr></thead>
          <tbody className="divide-y">
            {rows.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-slate-500">No orders found.</td></tr>}
            {rows.map((o) => (
              <tr key={o.id} className="hover:bg-slate-50">
                <td className="p-3"><Link href={`/admin/orders/${o.id}`} className="font-medium text-indigo-800 hover:underline">{o.orderId}</Link></td>
                <td>{o.name}<br /><span className="text-xs text-slate-500">{o.phone} · {o.city}</span></td>
                <td>{parseItems(o.items).reduce((s, i) => s + i.qty, 0)}</td>
                <td className="font-semibold">{inr(o.total)}</td>
                <td><span className={`rounded px-2 py-0.5 text-xs ${badge[o.status]}`}>{o.status}</span></td>
                <td className="text-xs">{o.payment === "COD" ? "COD" : <span className={o.paymentStatus === "PAID" ? "font-semibold text-green-700" : "text-orange-700"}>Online · {o.paymentStatus}</span>}</td>
                <td className="text-slate-500">{o.createdAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</td>
              </tr>))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="flex items-center gap-3 text-sm">
          {pg > 1 && <Link href={qs(pg - 1)} className="rounded border bg-white px-3 py-1">← Prev</Link>}
          <span>Page {pg} of {pages}</span>
          {pg < pages && <Link href={qs(pg + 1)} className="rounded border bg-white px-3 py-1">Next →</Link>}
        </div>
      )}
    </div>
  );
}
