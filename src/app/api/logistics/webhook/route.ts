import { NextResponse, after } from "next/server";
import { notifyOrder } from "@/lib/notify";
import { timingSafeEqual } from "crypto";
import { db } from "@/lib/db";
import { mapStatus } from "@/lib/shiprocket";

export const dynamic = "force-dynamic";

// Shiprocket tracking webhook. In Shiprocket go to Settings > API > Webhooks, set this URL, and enter the value of
// SHIPROCKET_WEBHOOK_TOKEN as the security token (Shiprocket sends it as the x-api-key header).
// The URL (and domain) must not contain "shiprocket", "kartrocket", "sr" or "kr".
export async function POST(req: Request) {
  const expected = process.env.SHIPROCKET_WEBHOOK_TOKEN;
  const got = req.headers.get("x-api-key") ?? "";
  const a = Buffer.from(got), b = Buffer.from(expected ?? "");
  if (!expected || a.length !== b.length || !timingSafeEqual(a, b)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const e = await req.json().catch(() => null) as { awb?: string; current_status?: string; shipment_status?: string; order_id?: string } | null;
  const awb = e?.awb ? String(e.awb) : "";
  const status = String(e?.current_status ?? e?.shipment_status ?? "");
  if (!awb || !status) return NextResponse.json({ ok: true }); // nothing to apply; always answer 200 as Shiprocket requires

  const o = await db.order.findFirst({ where: { awb } });
  if (o) {
    const next = mapStatus(status);
    // Never move a cancelled or already-delivered order backwards.
    const allow = next && o.status !== "CANCELLED" && o.status !== "DELIVERED";
    await db.order.update({ where: { id: o.id }, data: { shippingStatus: status, shippingUpdatedAt: new Date(), ...(allow ? { status: next } : {}) } });
    if (allow && next === "DELIVERED") after(() => notifyOrder(o.orderId, "delivered"));
  }
  return NextResponse.json({ ok: true });
}
