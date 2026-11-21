// Shared order-payment state transitions. All are idempotent (safe to run twice).
import { db } from "./db";
import { parseItems } from "./orders";

export const PENDING_MINUTES = 30;

/** Marks an order paid. Called by both the browser verify call and the webhook. */
export async function markPaid(razorpayOrderId: string, paymentId: string, amountPaise?: number) {
  return db.$transaction(async (tx) => {
    const o = await tx.order.findUnique({ where: { razorpayOrderId } });
    if (!o) return { ok: false as const, reason: "unknown order" };
    if (amountPaise !== undefined && amountPaise !== o.total * 100) return { ok: false as const, reason: "amount mismatch" };
    if (o.paymentStatus === "PAID") return { ok: true as const, order: o }; // already done
    if (o.status === "CANCELLED") {
      // Customer paid after we released the stock. Keep the money record and flag it for the owner.
      const u = await tx.order.update({ where: { id: o.id }, data: { paymentStatus: "PAID", razorpayPaymentId: paymentId, notes: `${o.notes}\nPAID AFTER EXPIRY (payment ${paymentId}) – refund in Razorpay or re-create the order.`.trim() } });
      return { ok: true as const, order: u };
    }
    const u = await tx.order.update({ where: { id: o.id }, data: { paymentStatus: "PAID", razorpayPaymentId: paymentId, status: o.status === "PENDING_PAYMENT" ? "PLACED" : o.status } });
    return { ok: true as const, order: u };
  });
}

/** Records a failed attempt (customer can still retry within the window). */
export async function markFailed(razorpayOrderId: string) {
  await db.order.updateMany({ where: { razorpayOrderId, paymentStatus: "PENDING" }, data: { paymentStatus: "FAILED" } });
}

/** Releases stock for online orders that were never paid within PENDING_MINUTES. */
export async function expirePendingOrders() {
  const cutoff = new Date(Date.now() - PENDING_MINUTES * 60 * 1000);
  const stale = await db.order.findMany({ where: { status: "PENDING_PAYMENT", paymentStatus: { in: ["PENDING", "FAILED"] }, createdAt: { lt: cutoff } }, select: { id: true } });
  for (const { id } of stale) {
    await db.$transaction(async (tx) => {
      const o = await tx.order.findUnique({ where: { id } });
      if (!o || o.status !== "PENDING_PAYMENT" || o.paymentStatus === "PAID") return;
      for (const it of parseItems(o.items)) await tx.product.updateMany({ where: { slug: it.slug }, data: { stock: { increment: it.qty } } });
      await tx.order.update({ where: { id }, data: { status: "CANCELLED", notes: `${o.notes}\nAuto-cancelled: online payment not completed in ${PENDING_MINUTES} min.`.trim() } });
    });
  }
  return stale.length;
}
