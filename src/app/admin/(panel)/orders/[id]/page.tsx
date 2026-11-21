import Link from "next/link";
import { requirePerm } from "@/lib/auth";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { inr } from "@/lib/shop";
import { ORDER_STATUSES, parseItems } from "@/lib/orders";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { resendMessages, saveOrderNotes, setOrderStatus } from "../../actions";
import { emailEnabled, smsEnabled } from "@/lib/notify";
import { cancelShipment, refreshTracking, shipOrder } from "../../ship-actions";
import { shiprocketEnabled, trackingUrl } from "@/lib/shiprocket";

export const metadata = { title: "Order" };

export default async function OrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string; err?: string }> }) {
  await requirePerm("orders");
  const id = Number((await params).id);
  const o = Number.isInteger(id) ? await db.order.findUnique({ where: { id } }) : null;
  if (!o) notFound();
  const { saved, err } = await searchParams;
  const items = parseItems(o.items);
  const prods = await db.product.findMany({ where: { slug: { in: items.map((i) => i.slug) } }, select: { slug: true, weightGrams: true } });
  const grams = items.reduce((s, i) => s + (prods.find((p) => p.slug === i.slug)?.weightGrams ?? 300) * i.qty, 0);
  const defaultKg = Math.max(0.1, Math.round((grams + 100) / 10) / 100); // + 100 g packing
  const shippable = !["CANCELLED", "PENDING_PAYMENT"].includes(o.status) && (o.payment === "COD" || o.paymentStatus === "PAID");
  const sr = shiprocketEnabled();
  const msgs = await db.notification.findMany({ where: { orderId: o.orderId }, orderBy: { createdAt: "asc" } });
  const cancelled = o.status === "CANCELLED";
  const card = "rounded-2xl border bg-white p-5 shadow-sm";
  return (
    <div className="space-y-4">
      <p className="text-sm"><Link href="/admin/orders" className="text-indigo-700">← Orders</Link></p>
      <h1 className="text-2xl font-bold">Order {o.orderId}</h1>
      {saved && <p className="rounded bg-green-100 px-3 py-2 text-sm text-green-800">Saved.</p>}
      {err && <p role="alert" className="rounded bg-red-100 px-3 py-2 text-sm text-red-800">{err}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        <section className={card}>
          <h2 className="mb-2 font-bold">Customer & delivery</h2>
          <p className="font-medium">{o.name}</p>
          <p><a href={`tel:${o.phone}`} className="text-indigo-700">{o.phone}</a>{o.email && <> · {o.email}</>}</p>
          <p className="mt-2 whitespace-pre-line text-sm">{o.address}{"\n"}{o.city}, {o.state} – {o.pincode}</p>
          <p className="mt-3 text-xs text-slate-500">Placed {o.createdAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} · Payment: {o.payment === "COD" ? "Cash on Delivery" : `Razorpay · ${o.paymentStatus}`}</p>
          {o.razorpayPaymentId && <p className="text-xs text-slate-500">Razorpay payment ID: {o.razorpayPaymentId}</p>}
        </section>
        <section className={card}>
          <h2 className="mb-2 font-bold">Status</h2>
          <form action={setOrderStatus} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="id" value={o.id} />
            <select key={o.status} name="status" defaultValue={o.status} disabled={cancelled} className="rounded border border-slate-300 px-2 py-1 text-sm">{ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
            {!cancelled && <ConfirmButton message="Change the status? Cancelling returns the items to stock and cannot be undone." className="rounded bg-slate-900 px-3 py-1 text-sm text-white">Update</ConfirmButton>}
          </form>
          {cancelled && <p className="mt-2 text-xs text-slate-500">Cancelled orders are final; stock was returned.</p>}
          {o.paymentStatus === "PAID" && cancelled && <p className="mt-2 rounded bg-red-50 p-2 text-xs text-red-800">This order was paid online. Refund it in the Razorpay dashboard.</p>}
          {o.paymentStatus === "PAID" && !cancelled && <p className="mt-2 text-xs text-slate-500">Paid online. If you cancel, refund the customer in the Razorpay dashboard.</p>}
          <form action={saveOrderNotes} className="mt-4 space-y-2">
            <input type="hidden" name="id" value={o.id} />
            <label className="block text-sm font-medium">Internal notes (tracking ID, courier, etc.)<textarea name="notes" rows={3} defaultValue={o.notes} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
            <button className="rounded border bg-white px-3 py-1 text-sm">Save notes</button>
          </form>
        </section>
      </div>
      <section className={card}>
        <h2 className="mb-2 font-bold">Shipping (Shiprocket)</h2>
        {!sr && <p className="text-sm text-slate-500">Shiprocket is not connected yet. Add the SHIPROCKET_* settings to <code>.env</code> (see README).</p>}
        {sr && !shippable && <p className="text-sm text-slate-500">This order can&apos;t be shipped yet (it must be paid or Cash on Delivery, and not cancelled).</p>}
        {sr && shippable && !o.awb && (
          <form action={shipOrder} className="space-y-3 text-sm">
            <input type="hidden" name="id" value={o.id} />
            <p className="text-slate-600">Packed weight and size. Estimated from product weights; adjust to the real parcel before shipping.{o.shiprocketShipmentId ? " (A Shiprocket order already exists; this will finish assigning the courier.)" : ""}</p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <label className="font-medium">Weight (kg)<input name="weight" type="number" step="0.01" min="0.05" defaultValue={defaultKg} className="mt-1 w-full rounded border border-slate-300 px-2 py-1" /></label>
              <label className="font-medium">Length (cm)<input name="length" type="number" step="0.1" min="0.6" defaultValue={grams > 3000 ? 40 : 15} className="mt-1 w-full rounded border border-slate-300 px-2 py-1" /></label>
              <label className="font-medium">Breadth (cm)<input name="breadth" type="number" step="0.1" min="0.6" defaultValue={grams > 3000 ? 30 : 10} className="mt-1 w-full rounded border border-slate-300 px-2 py-1" /></label>
              <label className="font-medium">Height (cm)<input name="height" type="number" step="0.1" min="0.6" defaultValue={grams > 3000 ? 25 : 8} className="mt-1 w-full rounded border border-slate-300 px-2 py-1" /></label>
            </div>
            <ConfirmButton message="Create the shipment in Shiprocket, assign a courier and request pickup? This affects your live Shiprocket account and wallet." className="rounded bg-indigo-700 px-4 py-2 font-semibold text-white">Create shipment &amp; request pickup</ConfirmButton>
          </form>
        )}
        {o.awb && (
          <div className="space-y-2 text-sm">
            <p><b>{o.courier}</b> · AWB <b>{o.awb}</b> · status: <b>{o.shippingStatus || "—"}</b>{o.shippingUpdatedAt && <span className="text-xs text-slate-500"> (updated {o.shippingUpdatedAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })})</span>}</p>
            <p className="space-x-3"><a href={trackingUrl(o.awb)} target="_blank" className="text-indigo-700 underline">Track ↗</a>{o.labelUrl && <a href={o.labelUrl} target="_blank" className="text-indigo-700 underline">Print label ↗</a>}</p>
            <div className="flex flex-wrap gap-2">
              <form action={refreshTracking}><input type="hidden" name="id" value={o.id} /><button className="rounded border bg-white px-3 py-1">Refresh status</button></form>
              {o.status !== "DELIVERED" && <form action={cancelShipment}><input type="hidden" name="id" value={o.id} /><ConfirmButton message="Cancel this shipment in Shiprocket? Only works before pickup." className="rounded border border-red-300 px-3 py-1 text-red-700">Cancel shipment</ConfirmButton></form>}
            </div>
          </div>
        )}
        {!o.awb && o.shippingStatus === "SHIPMENT CANCELLED" && <p className="mt-2 text-xs text-slate-500">Previous shipment was cancelled.</p>}
      </section>
      <section className={card}>
        <h2 className="mb-2 font-bold">Messages to customer</h2>
        {!emailEnabled() && !smsEnabled() && <p className="text-sm text-slate-500">Email and SMS are not set up yet (see README).</p>}
        {msgs.length === 0 && (emailEnabled() || smsEnabled()) && <p className="text-sm text-slate-500">Nothing sent yet.</p>}
        <ul className="divide-y text-sm">
          {msgs.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span>{m.channel} · {m.event.replace("_", " ")} → {m.recipient}<br /><span className="text-xs text-slate-500">{m.createdAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}{m.error && ` · ${m.error}`}</span></span>
              <span className="flex items-center gap-2">
                <span className={`rounded px-2 py-0.5 text-xs ${m.status === "SENT" ? "bg-green-100 text-green-800" : m.status === "FAILED" ? "bg-red-100 text-red-800" : "bg-slate-100"}`}>{m.status}</span>
                {m.status === "FAILED" && m.event !== "owner_new" && <form action={resendMessages}><input type="hidden" name="id" value={o.id} /><input type="hidden" name="event" value={m.event} /><button className="rounded border bg-white px-2 py-0.5 text-xs">Resend</button></form>}
              </span>
            </li>))}
        </ul>
      </section>
      <section className={card}>
        <h2 className="mb-2 font-bold">Items</h2>
        <table className="w-full text-sm">
          <tbody className="divide-y">
            {items.map((i) => <tr key={i.slug}><td className="py-2">{i.name}</td><td>× {i.qty}</td><td className="text-right">{inr(i.price)}</td><td className="text-right font-medium">{inr(i.price * i.qty)}</td></tr>)}
          </tbody>
        </table>
        <dl className="mt-3 ml-auto max-w-xs space-y-1 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{inr(o.subtotal)}</dd></div>
          <div className="flex justify-between"><dt>Shipping</dt><dd>{o.shipping ? inr(o.shipping) : "Free"}</dd></div>
          <div className="flex justify-between border-t pt-1 text-base font-bold"><dt>{o.payment === "COD" ? "Collect on delivery" : o.paymentStatus === "PAID" ? "Total (paid online)" : "Total"}</dt><dd>{inr(o.total)}</dd></div>
        </dl>
      </section>
    </div>
  );
}
