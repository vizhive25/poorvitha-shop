// Customer/owner notifications: email through any SMTP server, SMS through MSG91.
// Server-only. Never throws: a failed message must not break an order. Every attempt is logged in the
// Notification table, and a unique key per (order, channel, event) makes sending idempotent.
import nodemailer, { type Transporter } from "nodemailer";
import { Prisma } from "@prisma/client";
import { db } from "./db";
import { site } from "@/config/site";
import { parseItems } from "./orders";
import { trackingUrl } from "./shiprocket";
import { inr } from "./shop";

export type OrderEvent = "confirmed" | "shipped" | "delivered" | "cancelled";

export const emailEnabled = () => !!(process.env.SMTP_HOST && process.env.MAIL_FROM);
export const smsEnabled = () => !!process.env.MSG91_AUTH_KEY;

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

let transport: Transporter | null = null;
const mailer = () => (transport ??= nodemailer.createTransport({
  host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true" || Number(process.env.SMTP_PORT) === 465,
  auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
}));

type OrderRow = NonNullable<Awaited<ReturnType<typeof db.order.findUnique>>>;

function body(o: OrderRow, ev: OrderEvent): { subject: string; lead: string; extra: string } {
  switch (ev) {
    case "confirmed":
      return { subject: `Order ${o.orderId} confirmed – ${site.name}`, lead: `Thank you for your order, ${esc(o.name)}! We have received it and will dispatch it soon.`,
        extra: `<p>${o.payment === "COD" ? `<b>Payment:</b> Cash on Delivery – please keep <b>${inr(o.total)}</b> ready.` : `<b>Payment:</b> ${inr(o.total)} received online. Thank you!`}</p>` };
    case "shipped":
      return { subject: `Your order ${o.orderId} has been shipped – ${site.name}`, lead: `Good news, ${esc(o.name)} – your order is on its way.`,
        extra: o.awb ? `<p><b>Courier:</b> ${esc(o.courier)}<br><b>AWB / tracking number:</b> ${esc(o.awb)}<br><a href="${esc(trackingUrl(o.awb))}">Track your shipment</a></p>` : "" };
    case "delivered":
      return { subject: `Your order ${o.orderId} was delivered – ${site.name}`, lead: `Your order has been delivered. Thank you for shopping with ${site.name}!`,
        extra: `<p>If anything is wrong with your items, please contact us within the return window – see our <a href="${site.url}/info/return-policy">returns policy</a>.</p>` };
    case "cancelled":
      return { subject: `Your order ${o.orderId} was cancelled – ${site.name}`, lead: `Your order ${esc(o.orderId)} has been cancelled.`,
        extra: o.paymentStatus === "PAID" ? `<p>You paid online, so we will arrange your refund. Please contact us if you have questions.</p>` : "" };
  }
}

function render(o: OrderRow, ev: OrderEvent) {
  const b = body(o, ev);
  const rows = parseItems(o.items).map((i) => `<tr><td style="padding:4px 8px">${esc(i.name)} × ${i.qty}</td><td style="padding:4px 8px;text-align:right">${inr(i.price * i.qty)}</td></tr>`).join("");
  const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#0f172a;max-width:560px;margin:auto">
<h2 style="color:#3730a3">${esc(site.name)}</h2>
<p>${b.lead}</p>${b.extra}
<table style="width:100%;border-collapse:collapse;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0">${rows}
<tr><td style="padding:4px 8px">Shipping</td><td style="padding:4px 8px;text-align:right">${o.shipping ? inr(o.shipping) : "Free"}</td></tr>
<tr><td style="padding:4px 8px"><b>Total</b></td><td style="padding:4px 8px;text-align:right"><b>${inr(o.total)}</b></td></tr></table>
<p><b>Order ID:</b> ${esc(o.orderId)}<br><b>Delivering to:</b><br>${esc(o.name)}<br>${esc(o.address)}<br>${esc(o.city)}, ${esc(o.state)} – ${esc(o.pincode)}</p>
<p><a href="${site.url}/track">Track your order</a> (use your order ID and mobile number).</p>
<p style="color:#64748b;font-size:12px">${esc(site.name)} · ${esc(site.address)} · ${esc(site.phones)} · ${esc(site.email)}<br>${esc(site.gstin)}</p>
</body></html>`;
  const text = `${b.lead.replace(/&#39;/g, "'")}\nOrder ID: ${o.orderId}\nTotal: ${inr(o.total)}\nTrack: ${site.url}/track\n${site.name}`;
  return { subject: b.subject, html, text };
}

async function claim(orderId: string, channel: string, event: string, recipient: string): Promise<boolean> {
  try {
    await db.notification.create({ data: { orderId, channel, event, recipient, status: "SENDING" } });
    return true;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return false; // already sent/attempted
    throw e;
  }
}
const finish = (orderId: string, channel: string, event: string, status: string, error = "") =>
  db.notification.update({ where: { orderId_channel_event: { orderId, channel, event } }, data: { status, error: error.slice(0, 300) } });

async function sendEmail(orderId: string, event: string, to: string, subject: string, html: string, text: string) {
  if (!emailEnabled() || !to) return;
  if (!(await claim(orderId, "EMAIL", event, to))) return;
  try {
    await mailer().sendMail({ from: process.env.MAIL_FROM, to, subject, html, text });
    await finish(orderId, "EMAIL", event, "SENT");
  } catch (e) { await finish(orderId, "EMAIL", event, "FAILED", (e as Error).message); }
}

/** SMS via MSG91 Flow API (https://docs.msg91.com/sms/send-sms). Template variables must be named VAR1, VAR2, ... */
async function sendSms(orderId: string, event: string, mobile: string, templateId: string | undefined, vars: string[]) {
  if (!smsEnabled() || !templateId) return;
  if (!(await claim(orderId, "SMS", event, mobile))) return;
  try {
    const recipient: Record<string, string> = { mobiles: `91${mobile}` };
    // DLT variables must be plain text: keep letters, digits and basic punctuation only.
    vars.forEach((v, i) => (recipient[`VAR${i + 1}`] = v.replace(/[^\p{L}\p{N} .\-_/]/gu, "").trim().slice(0, 30)));
    const r = await fetch(process.env.MSG91_BASE_URL ?? "https://control.msg91.com/api/v5/flow", {
      method: "POST", headers: { accept: "application/json", "content-type": "application/json", authkey: process.env.MSG91_AUTH_KEY! },
      body: JSON.stringify({ template_id: templateId, short_url: "0", recipients: [recipient] }), signal: AbortSignal.timeout(10000),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || d?.type !== "success") throw new Error(`MSG91: ${d?.message ?? r.status}`);
    await finish(orderId, "SMS", event, "SENT");
  } catch (e) { await finish(orderId, "SMS", event, "FAILED", (e as Error).message); }
}

/** Sends the customer email + SMS (and the owner alert for new orders) for an order event. Safe to call repeatedly. */
export async function notifyOrder(orderId: string, ev: OrderEvent, opts: { force?: boolean } = {}) {
  try {
    if (opts.force) await db.notification.deleteMany({ where: { orderId, event: ev, status: "FAILED" } });
    const o = await db.order.findUnique({ where: { orderId } });
    if (!o) return;
    const m = render(o, ev);
    if (o.email) await sendEmail(o.orderId, ev, o.email, m.subject, m.html, m.text);

    const tpl = ev === "confirmed" ? process.env.MSG91_TEMPLATE_CONFIRMED : ev === "shipped" ? process.env.MSG91_TEMPLATE_SHIPPED : undefined;
    if (tpl) await sendSms(o.orderId, ev, o.phone, tpl, ev === "confirmed" ? [o.name.split(" ")[0], o.orderId, String(o.total)] : [o.name.split(" ")[0], o.orderId, o.courier ?? "", o.awb ?? ""]);

    if (ev === "confirmed" && process.env.OWNER_EMAIL) {
      const items = parseItems(o.items).map((i) => `${esc(i.name)} × ${i.qty}`).join("<br>");
      await sendEmail(o.orderId, "owner_new", process.env.OWNER_EMAIL, `New order ${o.orderId} – ${inr(o.total)} (${o.payment === "COD" ? "COD" : "paid online"})`,
        `<p><b>New order ${esc(o.orderId)}</b> – ${inr(o.total)} – ${o.payment === "COD" ? "Cash on Delivery" : "paid online"}</p><p>${items}</p><p>${esc(o.name)}, ${esc(o.phone)}<br>${esc(o.address)}, ${esc(o.city)}, ${esc(o.state)} ${esc(o.pincode)}</p><p><a href="${site.url}/admin/orders/${o.id}">Open in admin</a></p>`,
        `New order ${o.orderId} – ${inr(o.total)}\n${site.url}/admin/orders/${o.id}`);
    }
  } catch (e) {
    console.error("notifyOrder failed:", e);
  }
}
