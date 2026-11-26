"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useCart } from "@/components/CartProvider";
import { inr } from "@/lib/shop";
import { site } from "@/config/site";

const f = "w-full rounded-xl border border-neutral-300 bg-neutral-50 px-4 py-2.5 outline-none focus:border-neutral-900 focus:bg-white";

type RzInit = { keyId: string; orderId: string; amount: number; name: string; phone: string; email: string };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare global { interface Window { Razorpay?: any } }

export default function Checkout() {
  const { lines, subtotal, shipping, total, clear } = useCart();
  const router = useRouter();
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [online, setOnline] = useState(false);       // is Razorpay configured on the server?
  const [method, setMethod] = useState<"ONLINE" | "COD">("COD");
  const [pending, setPending] = useState<{ orderId: string; rz: RzInit } | null>(null);
  const done = useRef(false);

  const [codMax, setCodMax] = useState(0);              // 0 = no limit
  const codBlocked = codMax > 0 && total > codMax;

  useEffect(() => {
    fetch("/api/config").then((r) => r.json()).then((d) => { setCodMax(Number(d.codMax) || 0); if (d.onlinePayments) { setOnline(true); setMethod("ONLINE"); } }).catch(() => {});
  }, []);
  useEffect(() => { if (codBlocked && online) setMethod("ONLINE"); }, [codBlocked, online]);

  function openRazorpay(orderId: string, rz: RzInit) {
    if (!window.Razorpay) { setErr("Payment window is still loading. Please try again in a moment."); setBusy(false); return; }
    const rp = new window.Razorpay({
      key: rz.keyId, amount: rz.amount, currency: "INR", name: site.name, description: `Order ${orderId}`, order_id: rz.orderId,
      prefill: { name: rz.name, contact: rz.phone, email: rz.email },
      theme: { color: "#171717" },
      handler: async (resp: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        try {
          const r = await fetch("/api/payments/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(resp) });
          const d = await r.json();
          if (!r.ok) throw new Error(d.error || "Verification failed");
          done.current = true; clear(); router.push(`/order-success?id=${orderId}`);
        } catch (x) {
          setErr(`${(x as Error).message} If money was deducted, don't pay again – we'll confirm your order shortly. Order ID: ${orderId}`);
          setBusy(false);
        }
      },
      modal: { ondismiss: () => { if (!done.current) { setBusy(false); setErr("Payment not completed. You can try again below."); } } },
    });
    rp.on("payment.failed", () => setErr("Payment failed. You can try again, or choose Cash on Delivery."));
    rp.open();
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setErr(""); setBusy(true);
    if (pending) { openRazorpay(pending.orderId, pending.rz); return; }
    const customer = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    delete customer.payment;
    try {
      const r = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customer, method, items: lines.map((l) => ({ slug: l.slug, qty: l.qty })) }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not place order");
      if (method === "COD") { clear(); router.push(`/order-success?id=${d.orderId}`); return; }
      setPending({ orderId: d.orderId, rz: d.razorpay });
      openRazorpay(d.orderId, d.razorpay);
    } catch (x) { setErr((x as Error).message); setBusy(false); }
  }

  if (!lines.length && !pending) return <p className="py-16 text-center">Your cart is empty.</p>;
  return (
    <form onSubmit={submit} className="grid gap-8 md:grid-cols-3">
      {online && <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />}
      <div className="space-y-3 md:col-span-2">
        <h1 className="text-3xl font-extrabold tracking-tight">Checkout</h1>
        <fieldset disabled={!!pending} className="space-y-3">
          <input name="name" required minLength={2} placeholder="Full name" className={f} autoComplete="name" />
          <div className="grid gap-3 md:grid-cols-2">
            <input name="phone" required pattern="[6-9][0-9]{9}" title="10-digit Indian mobile number" placeholder="Mobile number" className={f} autoComplete="tel-national" inputMode="numeric" />
            <input name="email" type="email" placeholder="Email (optional)" className={f} autoComplete="email" />
          </div>
          <textarea name="address" required minLength={10} placeholder="Address (house no., street, area)" className={f} rows={3} autoComplete="street-address" />
          <div className="grid gap-3 md:grid-cols-3">
            <input name="city" required placeholder="City" className={f} />
            <input name="state" required placeholder="State" className={f} />
            <input name="pincode" required pattern="[1-9][0-9]{5}" title="6-digit PIN code" placeholder="PIN code" className={f} inputMode="numeric" />
          </div>
        </fieldset>
        <fieldset disabled={!!pending} className="space-y-2 rounded-2xl bg-neutral-100 p-4 text-sm">
          <legend className="px-1 font-semibold">Payment</legend>
          {online && (
            <label className="flex items-center gap-2"><input type="radio" name="payment" checked={method === "ONLINE"} onChange={() => setMethod("ONLINE")} /> Pay online <span className="text-slate-500">(UPI, cards, net banking, wallets)</span></label>
          )}
          <label className={`flex items-center gap-2 ${codBlocked ? "text-slate-400" : ""}`}><input type="radio" name="payment" disabled={codBlocked} checked={method === "COD"} onChange={() => setMethod("COD")} /> Cash on Delivery{codBlocked && <span className="text-xs">(available up to {inr(codMax)}; please pay online for this order)</span>}</label>
          {!online && <p className="text-xs text-slate-500">Online payment is currently unavailable.</p>}
        </fieldset>
        {pending && <p className="rounded bg-amber-50 p-3 text-sm text-amber-900">Order {pending.orderId} is waiting for payment. Items are held for 30 minutes.</p>}
        {err && <p role="alert" className="text-sm text-red-600">{err}</p>}
      </div>
      <aside className="h-fit rounded-2xl border border-neutral-200 bg-white p-5 text-sm">
        <h2 className="font-bold">Your order — {site.name}</h2>
        <ul className="mt-2 space-y-1">{lines.map((l) => <li key={l.slug} className="flex justify-between gap-2"><span>{l.name} × {l.qty}</span><span>{inr(l.price * l.qty)}</span></li>)}</ul>
        <div className="mt-3 flex justify-between"><span>Shipping</span><span>{shipping ? inr(shipping) : "Free"}</span></div>
        <div className="flex justify-between border-t pt-2 text-base font-bold"><span>Total ({inr(subtotal)} + shipping)</span><span>{inr(total)}</span></div>
        <button disabled={busy} className="mt-4 w-full rounded-full bg-neutral-900 py-3 font-semibold text-white hover:bg-neutral-700 disabled:bg-neutral-400">
          {busy ? "Please wait…" : pending ? "Retry payment" : method === "ONLINE" ? `Pay ${inr(total)}` : "Place order"}
        </button>
      </aside>
    </form>
  );
}
