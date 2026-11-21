// Minimal Razorpay helpers (server-only). No SDK: just the Orders API over HTTPS + HMAC checks.
import { createHmac, timingSafeEqual } from "crypto";

export const razorpayEnabled = () => !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
export const razorpayKeyId = () => process.env.RAZORPAY_KEY_ID ?? "";

const hmac = (secret: string, data: string | Buffer) => createHmac("sha256", secret).update(data).digest("hex");
const eq = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

/** Create a Razorpay order. amountPaise is an integer number of paise. */
export async function createRazorpayOrder(amountPaise: number, receipt: string): Promise<{ id: string }> {
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
  const r = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({ amount: amountPaise, currency: "INR", receipt, payment_capture: 1 }),
    signal: AbortSignal.timeout(15000),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d.id) throw new Error(`Razorpay order failed (${r.status}): ${d?.error?.description ?? "unknown error"}`);
  return { id: d.id };
}

/** Checks the signature Razorpay Checkout returns to the browser after payment. */
export function verifyCheckoutSignature(razorpayOrderId: string, paymentId: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret || !signature) return false;
  return eq(hmac(secret, `${razorpayOrderId}|${paymentId}`), signature);
}

/** Checks the X-Razorpay-Signature header on webhook calls (HMAC of the raw body). */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  return eq(hmac(secret, rawBody), signature);
}
