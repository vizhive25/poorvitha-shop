import Link from "next/link";
import { db } from "@/lib/db";
import { can, requireAdmin } from "@/lib/auth";
import { inr } from "@/lib/shop";
import { parseItems } from "@/lib/orders";
import { expirePendingOrders } from "@/lib/payments";

export const metadata = { title: "Dashboard" };

const badge: Record<string, string> = { PENDING_PAYMENT: "bg-orange-100 text-orange-800", PLACED: "bg-amber-100 text-amber-800", CONFIRMED: "bg-blue-100 text-blue-800", SHIPPED: "bg-indigo-100 text-indigo-800", DELIVERED: "bg-green-100 text-green-800", CANCELLED: "bg-slate-200 text-slate-600" };

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const user = await requireAdmin();
  const { denied } = await searchParams;
  const canP = can(user.role, "products");
  await expirePendingOrders().catch(() => {});
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const [products, active, onRequest, lowStock, newOrders, recent, month, refundDue] = await Promise.all([
    db.product.count(),
    db.product.count({ where: { active: true } }),
    db.product.count({ where: { priceOnRequest: true } }),
    db.product.findMany({ where: { active: true, priceOnRequest: false, stock: { lte: 5 } }, orderBy: { stock: "asc" }, take: 8 }),
    db.order.count({ where: { status: "PLACED" } }),
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    db.order.aggregate({ where: { createdAt: { gte: since }, status: { notIn: ["CANCELLED", "PENDING_PAYMENT"] } }, _sum: { total: true }, _count: true }),
    db.order.count({ where: { status: "CANCELLED", paymentStatus: "PAID" } }),
  ]);
  const card = "rounded-2xl border bg-white p-4 shadow-sm";
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      {denied && <p className="rounded bg-amber-100 px-3 py-2 text-sm text-amber-900">Your account does not have access to that page.</p>}
      {refundDue > 0 && <Link href="/admin/orders?status=CANCELLED" className="block rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800">{refundDue} cancelled order(s) were paid online – check them and refund in the Razorpay dashboard.</Link>}
      <div className="grid gap-4 md:grid-cols-4">
        <Link href="/admin/orders?status=PLACED" className={card}><p className="text-sm text-slate-500">New orders to confirm</p><p className="text-3xl font-extrabold">{newOrders}</p></Link>
        <div className={card}><p className="text-sm text-slate-500">Orders, last 30 days</p><p className="text-3xl font-extrabold">{month._count}</p></div>
        {canP && <div className={card}><p className="text-sm text-slate-500">Revenue, last 30 days</p><p className="text-3xl font-extrabold">{inr(month._sum.total ?? 0)}</p></div>}
        {canP && <Link href="/admin/products" className={card}><p className="text-sm text-slate-500">Products live / total</p><p className="text-3xl font-extrabold">{active} / {products}</p>{onRequest > 0 && <p className="text-xs text-amber-700">{onRequest} still need a price</p>}</Link>}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <section className={card}>
          <h2 className="mb-3 font-bold">Recent orders</h2>
          {recent.length === 0 ? <p className="text-sm text-slate-500">No orders yet.</p> : (
            <ul className="divide-y text-sm">{recent.map((o) => (
              <li key={o.id}><Link href={`/admin/orders/${o.id}`} className="flex items-center justify-between gap-2 py-2 hover:bg-slate-50">
                <span><b>{o.orderId}</b> · {o.name}<br /><span className="text-slate-500">{parseItems(o.items).reduce((s, i) => s + i.qty, 0)} items · {o.createdAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</span></span>
                <span className="text-right"><b>{inr(o.total)}</b><br /><span className={`rounded px-2 py-0.5 text-xs ${badge[o.status]}`}>{o.status}</span></span>
              </Link></li>))}</ul>
          )}
        </section>
        {canP && <section className={card}>
          <h2 className="mb-3 font-bold">Low stock (5 or fewer)</h2>
          {lowStock.length === 0 ? <p className="text-sm text-slate-500">All good.</p> : (
            <ul className="divide-y text-sm">{lowStock.map((p) => (
              <li key={p.id}><Link href={`/admin/products/${p.id}`} className="flex justify-between py-2 hover:bg-slate-50"><span>{p.name}</span><b className={p.stock === 0 ? "text-red-600" : "text-amber-700"}>{p.stock}</b></Link></li>))}</ul>
          )}
        </section>}
      </div>
    </div>
  );
}
