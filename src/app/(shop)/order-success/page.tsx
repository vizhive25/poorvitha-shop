import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { site } from "@/config/site";

export const metadata: Metadata = { title: "Order placed", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Success({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  // Only status fields are shown, never customer details.
  const o = id ? await db.order.findUnique({ where: { orderId: id }, select: { payment: true, paymentStatus: true } }) : null;
  const paid = o?.payment === "RAZORPAY" && o.paymentStatus === "PAID";
  const waiting = o?.payment === "RAZORPAY" && o.paymentStatus !== "PAID";
  return (
    <div className="py-16 text-center">
      <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900">{waiting ? "Confirming your payment…" : "Thank you for your order!"}</h1>
      {id && <p className="mt-3">Order ID: <strong>{id}</strong></p>}
      <p className="mt-2 text-neutral-600">
        {paid ? `Payment received. ${site.name} will confirm and dispatch your order shortly.`
          : waiting ? "We haven't received the payment confirmation yet. Refresh in a minute; if money was deducted we'll confirm the order shortly."
          : `${site.name} will call you to confirm the delivery. Pay in cash when your order arrives.`}
      </p>
      <Link href="/shop" className="mt-6 inline-block rounded-full bg-neutral-900 px-6 py-3 font-semibold text-white hover:bg-neutral-700">Continue shopping</Link>
    </div>
  );
}
