import { NextResponse, after } from "next/server";
import { notifyOrder } from "@/lib/notify";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { markFailed, markPaid } from "@/lib/payments";

export const dynamic = "force-dynamic";

// Register this URL in Razorpay Dashboard → Settings → Webhooks with events:
// payment.captured, order.paid, payment.failed. Use the same secret as RAZORPAY_WEBHOOK_SECRET.
export async function POST(req: Request) {
  const raw = await req.text(); // signature is over the exact raw body
  if (!verifyWebhookSignature(raw, req.headers.get("x-razorpay-signature")))
    return NextResponse.json({ error: "bad signature" }, { status: 400 });

  let evt: { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string; amount?: number; status?: string } }; order?: { entity?: { id?: string } } } };
  try { evt = JSON.parse(raw); } catch { return NextResponse.json({ error: "bad json" }, { status: 400 }); }

  const pay = evt.payload?.payment?.entity;
  const rzOrder = pay?.order_id ?? evt.payload?.order?.entity?.id;
  if (!rzOrder) return NextResponse.json({ ok: true }); // nothing we track

  try {
    if ((evt.event === "payment.captured" || evt.event === "order.paid") && pay?.id) {
      const r = await markPaid(rzOrder, pay.id, pay.amount);
      if (!r.ok) console.error("webhook markPaid:", r.reason, rzOrder);
      else if (r.order.status !== "CANCELLED") after(() => notifyOrder(r.order.orderId, "confirmed"));
    } else if (evt.event === "payment.failed") {
      await markFailed(rzOrder);
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "retry" }, { status: 500 }); // Razorpay will retry
  }
  return NextResponse.json({ ok: true });
}
