import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { parseItems } from "@/lib/orders";

export const dynamic = "force-dynamic";

// Guard against spreadsheet formula injection from customer-supplied text.
const cell = (v: unknown) => {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
};

export async function GET() {
  const user = await apiUser("orders");
  if (!user) return new Response("Unauthorized", { status: 401 });
  await audit(user, "orders exported", "orders.csv");
  const orders = await db.order.findMany({ orderBy: { createdAt: "desc" }, take: 5000 });
  const head = ["Order ID", "Date", "Status", "Name", "Phone", "Email", "Address", "City", "State", "PIN", "Items", "Subtotal", "Shipping", "Total", "Payment", "Notes"];
  const rows = orders.map((o) => [o.orderId, o.createdAt.toISOString(), o.status, o.name, o.phone, o.email, o.address, o.city, o.state, o.pincode,
    parseItems(o.items).map((i) => `${i.name} x${i.qty}`).join("; "), o.subtotal, o.shipping, o.total, o.payment, o.notes]);
  const csv = [head, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
  return new Response("﻿" + csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="orders.csv"' } });
}
