import { NextResponse, after } from "next/server";
import { notifyOrder } from "@/lib/notify";
import { allow, ipOf } from "@/lib/ratelimit";
import { verifyCheckoutSignature } from "@/lib/razorpay";
import { markPaid } from "@/lib/payments";

export const dynamic = "force-dynamic";

// Called by the browser right after Razorpay Checkout succeeds. The webhook is the backup path.
export async function POST(req: Request) {
  if (!allow(`verify:${ipOf(req)}`, 30, 10 * 60 * 1000)) return NextResponse.json({ error: "Too many attempts." }, { status: 429 });
  const b = await req.json().catch(() => null);
  const rzOrder = String(b?.razorpay_order_id ?? ""), pay = String(b?.razorpay_payment_id ?? ""), sig = String(b?.razorpay_signature ?? "");
  if (!rzOrder || !pay || !verifyCheckoutSignature(rzOrder, pay, sig))
    return NextResponse.json({ error: "Payment could not be verified." }, { status: 400 });
  const r = await markPaid(rzOrder, pay);
  if (!r.ok) return NextResponse.json({ error: "Order not found." }, { status: 404 });
  if (r.order.status !== "CANCELLED") after(() => notifyOrder(r.order.orderId, "confirmed"));
  return NextResponse.json({ orderId: r.order.orderId });
}
