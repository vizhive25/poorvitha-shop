"use server";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { notifyOrder } from "@/lib/notify";
import { db } from "@/lib/db";
import { requirePerm } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { parseItems } from "@/lib/orders";
import { assignAwb, cancelShiprocketOrder, createShiprocketOrder, generateLabel, mapStatus, requestPickup, shiprocketEnabled, trackAwb } from "@/lib/shiprocket";

const num = (v: FormDataEntryValue | null, min: number, max: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
};
const back = (id: number, q: string): never => redirect(`/admin/orders/${id}?${q}`);
const fail = (id: number, e: unknown): never => back(id, `err=${encodeURIComponent((e instanceof Error ? e.message : "Shipping failed").slice(0, 300))}`);

/** Creates the Shiprocket order, assigns a courier/AWB, requests pickup and fetches the label. Safe to retry: each step is skipped if already done. */
export async function shipOrder(formData: FormData) {
  const user = await requirePerm("orders");
  const id = Number(formData.get("id"));
  const o = id ? await db.order.findUnique({ where: { id } }) : null;
  if (!o) return;
  if (!shiprocketEnabled()) return back(id, "err=" + encodeURIComponent("Shiprocket is not configured (see README)."));
  if (o.status === "CANCELLED" || o.status === "PENDING_PAYMENT" || (o.payment === "RAZORPAY" && o.paymentStatus !== "PAID"))
    return back(id, "err=" + encodeURIComponent("Only paid or Cash-on-Delivery orders that are not cancelled can be shipped."));

  const weightKg = num(formData.get("weight"), 0.05, 60), l = num(formData.get("length"), 0.6, 200), b = num(formData.get("breadth"), 0.6, 200), h = num(formData.get("height"), 0.6, 200);
  if (!weightKg || !l || !b || !h) return back(id, "err=" + encodeURIComponent("Enter a valid weight (kg) and package size (cm)."));

  try {
    let cur = o;
    if (!cur.shiprocketShipmentId) {
      const ref = cur.shipAttempts > 0 ? `${cur.orderId}-${cur.shipAttempts}` : cur.orderId; // Shiprocket won't reuse a cancelled order id
      const r = await createShiprocketOrder({
        orderId: ref, createdAt: cur.createdAt, payment: cur.payment === "COD" ? "COD" : "Prepaid",
        name: cur.name, phone: cur.phone, email: cur.email, address: cur.address, city: cur.city, state: cur.state, pincode: cur.pincode,
        items: parseItems(cur.items), subtotal: cur.subtotal, shipping: cur.shipping, weightKg, lengthCm: l, breadthCm: b, heightCm: h,
      });
      cur = await db.order.update({ where: { id }, data: { shiprocketOrderId: r.orderId, shiprocketShipmentId: r.shipmentId, shippingStatus: "NEW" } });
    }
    if (!cur.awb) {
      const a = await assignAwb(cur.shiprocketShipmentId!);
      cur = await db.order.update({ where: { id }, data: { awb: a.awb, courier: a.courier, shippingStatus: "AWB ASSIGNED", status: cur.status === "PLACED" ? "CONFIRMED" : cur.status } });
    }
    after(() => notifyOrder(cur.orderId, "shipped"));
    const notes: string[] = [];
    try { notes.push(await requestPickup(cur.shiprocketShipmentId!)); } catch (e) { notes.push(`Pickup not requested: ${(e as Error).message}`); }
    try { const url = await generateLabel(cur.shiprocketShipmentId!); if (url) await db.order.update({ where: { id }, data: { labelUrl: url } }); } catch (e) { notes.push(`Label not generated: ${(e as Error).message}`); }
    await db.order.update({ where: { id }, data: { notes: `${cur.notes}\n${notes.join(" | ")}`.trim() } });
  } catch (e) {
    return fail(id, e);
  }
  back(id, "saved=1");
}

export async function refreshTracking(formData: FormData) {
  await requirePerm("orders");
  const id = Number(formData.get("id"));
  const o = id ? await db.order.findUnique({ where: { id } }) : null;
  if (!o?.awb) return;
  try {
    const t = await trackAwb(o.awb);
    const next = mapStatus(t.status);
    await db.order.update({ where: { id }, data: { shippingStatus: t.status || o.shippingStatus, shippingUpdatedAt: new Date(), ...(next && o.status !== "CANCELLED" ? { status: next } : {}) } });
    if (next === "DELIVERED" && o.status !== "CANCELLED" && o.status !== "DELIVERED") after(() => notifyOrder(o.orderId, "delivered"));
  } catch (e) {
    return fail(id, e);
  }
  back(id, "saved=1");
}

/** Cancels the shipment at Shiprocket (works until pickup). The shop order itself stays open so you can re-ship. */
export async function cancelShipment(formData: FormData) {
  const user = await requirePerm("orders");
  const id = Number(formData.get("id"));
  const o = id ? await db.order.findUnique({ where: { id } }) : null;
  if (!o?.shiprocketOrderId) return;
  try {
    await cancelShiprocketOrder(o.shiprocketOrderId);
    await audit(user, "shipment cancelled", o.orderId, `AWB ${o.awb}`);
    await db.order.update({ where: { id }, data: { shiprocketOrderId: null, shiprocketShipmentId: null, awb: null, courier: null, labelUrl: null, shippingStatus: "SHIPMENT CANCELLED", shipAttempts: { increment: 1 }, status: o.status === "SHIPPED" ? "CONFIRMED" : o.status } });
  } catch (e) {
    return fail(id, e);
  }
  back(id, "saved=1");
}
