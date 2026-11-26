import type { Metadata } from "next";
import { db } from "@/lib/db";
import { trackingUrl } from "@/lib/shiprocket";
import { headers } from "next/headers";
import { allow } from "@/lib/ratelimit";

export const metadata: Metadata = { title: "Track your order", robots: { index: false } };
export const dynamic = "force-dynamic";

const STEPS = ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED"];
const LABEL: Record<string, string> = { PENDING_PAYMENT: "Awaiting payment", PLACED: "Order placed", CONFIRMED: "Confirmed", SHIPPED: "Shipped", DELIVERED: "Delivered", CANCELLED: "Cancelled" };

// Requires BOTH the order ID and the phone number used on the order, so orders can't be guessed.
export default async function Track({ searchParams }: { searchParams: Promise<{ id?: string; phone?: string }> }) {
  const { id = "", phone = "" } = await searchParams;
  const asked = id.trim() !== "" || phone.trim() !== "";
  const ip = ((await headers()).get("x-forwarded-for") ?? "local").split(",")[0].trim();
  const limited = asked && !allow(`track:${ip}`, 30, 10 * 60 * 1000);
  const o = !limited && id.trim() && /^[6-9]\d{9}$/.test(phone.trim())
    ? await db.order.findFirst({ where: { orderId: id.trim().toUpperCase(), phone: phone.trim() }, select: { orderId: true, status: true, awb: true, courier: true, shippingStatus: true, createdAt: true } })
    : null;
  const inp = "w-full rounded-full border border-neutral-300 bg-neutral-50 px-4 py-2 outline-none focus:border-neutral-900 focus:bg-white";
  const at = o ? STEPS.indexOf(o.status) : -1;
  return (
    <div className="mx-auto max-w-lg space-y-5">
      <h1 className="text-3xl font-extrabold tracking-tight">Track your order</h1>
      <form className="space-y-3 rounded-2xl bg-neutral-100 p-5">
        <input name="id" defaultValue={id} required placeholder="Order ID (e.g. PM…)" className={inp} />
        <input name="phone" defaultValue={phone} required pattern="[6-9][0-9]{9}" placeholder="Mobile number used on the order" className={inp} inputMode="numeric" />
        <button className="w-full rounded-full bg-neutral-900 py-2 font-semibold text-white hover:bg-neutral-700">Track</button>
      </form>
      {limited && <p role="alert" className="text-sm text-red-600">Too many lookups. Please try again in a few minutes.</p>}
      {asked && !o && !limited && <p role="alert" className="text-sm text-red-600">We couldn&apos;t find an order with those details. Please check and try again.</p>}
      {o && (
        <div className="space-y-4 rounded-2xl bg-neutral-100 p-5">
          <p className="text-sm text-slate-500">Order {o.orderId} · placed {o.createdAt.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
          <p className="text-xl font-bold">{LABEL[o.status] ?? o.status}</p>
          {o.status !== "CANCELLED" && o.status !== "PENDING_PAYMENT" && (
            <ol className="flex gap-1 text-xs">{STEPS.map((s, i) => <li key={s} className={`flex-1 rounded px-1 py-1 text-center ${i <= at ? "bg-neutral-900 text-white" : "bg-white text-neutral-500"}`}>{LABEL[s]}</li>)}</ol>
          )}
          {o.awb && (
            <p className="text-sm">{o.courier} · AWB <b>{o.awb}</b>{o.shippingStatus && <> · {o.shippingStatus}</>}<br />
              <a href={trackingUrl(o.awb)} target="_blank" rel="noopener noreferrer" className="underline">Live courier tracking ↗</a></p>
          )}
        </div>
      )}
    </div>
  );
}
