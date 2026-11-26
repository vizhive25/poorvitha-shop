import { NextResponse, after } from "next/server";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { site } from "@/config/site";
import { parseItems } from "@/lib/orders";
import { createRazorpayOrder, razorpayEnabled, razorpayKeyId } from "@/lib/razorpay";
import { expirePendingOrders } from "@/lib/payments";
import { notifyOrder } from "@/lib/notify";
import { pincodeServiceable } from "@/lib/shiprocket";
import { allow, ipOf } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

class OrderError extends Error {}

export async function POST(req: Request) {
  // Stops bots from emptying stock with fake orders: 8 orders per IP per 10 minutes.
  if (!allow(`order:${ipOf(req)}`, 8, 10 * 60 * 1000)) return NextResponse.json({ error: "Too many orders from this connection. Please try again in a few minutes or call us." }, { status: 429 });
  let body: { customer?: Record<string, unknown>; items?: { slug?: unknown; qty?: unknown }[]; method?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  const online = body?.method === "ONLINE";
  if (online && !razorpayEnabled()) return NextResponse.json({ error: "Online payment is not available right now. Please choose Cash on Delivery." }, { status: 400 });

  const c = body?.customer ?? {};
  const s = (v: unknown, max = 300) => String(v ?? "").trim().slice(0, max);
  const customer = { name: s(c.name, 100), phone: s(c.phone, 10), email: s(c.email, 120), address: s(c.address, 400), city: s(c.city, 80), state: s(c.state, 80), pincode: s(c.pincode, 6) };

  if (customer.name.length < 2 || !/^[6-9]\d{9}$/.test(customer.phone) || customer.address.length < 10 || !customer.city || !customer.state || !/^[1-9]\d{5}$/.test(customer.pincode))
    return NextResponse.json({ error: "Please check your name, mobile number and address." }, { status: 400 });
  if (customer.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(customer.email))
    return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
  if (!Array.isArray(body?.items) || !body.items.length || body.items.length > 50)
    return NextResponse.json({ error: "Cart is empty." }, { status: 400 });

  // Can a courier reach this PIN code (with COD if chosen)? If Shiprocket can't be asked, we allow the order.
  if ((await pincodeServiceable(customer.pincode, !online)) === false)
    return NextResponse.json({ error: online ? "Sorry, we can't deliver to this PIN code yet. Please check the PIN code or call us." : "Cash on Delivery isn't available at this PIN code. Please pay online, or call us." }, { status: 400 });

  await expirePendingOrders().catch(() => {}); // free up stock held by abandoned payments

  const orderId = "PM" + Date.now().toString(36).toUpperCase() + randomBytes(2).toString("hex").toUpperCase();
  let total = 0;

  try {
    await db.$transaction(async (tx) => {
      // Prices and stock always come from the database, never from the client.
      const items: { slug: string; name: string; qty: number; price: number }[] = [];
      let subtotal = 0;
      for (const it of body.items!) {
        const qty = Math.floor(Number(it?.qty));
        const p = await tx.product.findFirst({ where: { slug: String(it?.slug), active: true } });
        if (!p || p.priceOnRequest || !(qty >= 1) || qty > p.stock)
          throw new OrderError(`"${p?.name ?? "An item"}" is unavailable in that quantity.`);
        // Atomic decrement guards against two orders buying the last unit.
        const upd = await tx.product.updateMany({ where: { id: p.id, stock: { gte: qty } }, data: { stock: { decrement: qty } } });
        if (upd.count !== 1) throw new OrderError(`"${p.name}" just sold out.`);
        items.push({ slug: p.slug, name: p.name, qty, price: p.price });
        subtotal += p.price * qty;
      }
      const shipping = subtotal >= site.freeShippingAbove ? 0 : site.shippingFee;
      total = subtotal + shipping;
      if (!online && site.codMax > 0 && total > site.codMax)
        throw new OrderError(`Cash on Delivery is available for orders up to ₹${site.codMax}. Please pay online for this order.`);
      await tx.order.create({
        data: {
          orderId, ...customer, subtotal, shipping, total, items: JSON.stringify(items), notes: "",
          payment: online ? "RAZORPAY" : "COD",
          paymentStatus: online ? "PENDING" : "COD",
          status: online ? "PENDING_PAYMENT" : "PLACED",
        },
      });
    });
  } catch (e) {
    if (e instanceof OrderError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error(e);
    return NextResponse.json({ error: "Could not place order. Please try again." }, { status: 500 });
  }

  if (!online) { after(() => notifyOrder(orderId, "confirmed")); return NextResponse.json({ orderId }); }

  // Online: stock is held; now ask Razorpay for a payment order.
  try {
    const rz = await createRazorpayOrder(total * 100, orderId);
    await db.order.update({ where: { orderId }, data: { razorpayOrderId: rz.id } });
    return NextResponse.json({ orderId, razorpay: { keyId: razorpayKeyId(), orderId: rz.id, amount: total * 100, name: customer.name, phone: customer.phone, email: customer.email } });
  } catch (e) {
    console.error(e);
    // Give the stock back and cancel.
    await db.$transaction(async (tx) => {
      const o = await tx.order.findUnique({ where: { orderId } });
      if (!o) return;
      for (const it of parseItems(o.items)) await tx.product.updateMany({ where: { slug: it.slug }, data: { stock: { increment: it.qty } } });
      await tx.order.update({ where: { id: o.id }, data: { status: "CANCELLED", paymentStatus: "FAILED", notes: "Could not create Razorpay order." } });
    });
    return NextResponse.json({ error: "Could not start online payment. Please try again or choose Cash on Delivery." }, { status: 502 });
  }
}
