"use client";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { inr } from "@/lib/shop";
import { site } from "@/config/site";

export default function CartPage() {
  const { lines, setQty, subtotal, shipping, total } = useCart();
  if (!lines.length) return <div className="py-16 text-center"><h1 className="text-2xl font-bold">Your cart is empty</h1><Link href="/shop" className="mt-4 inline-block text-indigo-700 underline">Continue shopping</Link></div>;
  return (
    <div className="grid gap-8 md:grid-cols-3">
      <div className="space-y-3 md:col-span-2">
        <h1 className="text-2xl font-bold">Shopping cart</h1>
        {lines.map((l) => (
          <div key={l.slug} className="flex items-center justify-between gap-3 rounded-xl border bg-white p-4">
            <div><Link href={`/product/${l.slug}`} className="font-medium">{l.name}</Link><p className="text-sm text-slate-500">{inr(l.price)} each</p></div>
            <div className="flex items-center gap-2">
              <button aria-label="Decrease" onClick={() => setQty(l.slug, l.qty - 1)} className="h-8 w-8 rounded border">−</button>
              <span className="w-6 text-center">{l.qty}</span>
              <button aria-label="Increase" onClick={() => setQty(l.slug, l.qty + 1)} className="h-8 w-8 rounded border">+</button>
              <span className="w-20 text-right font-semibold">{inr(l.price * l.qty)}</span>
            </div>
          </div>))}
      </div>
      <aside className="h-fit rounded-xl border bg-white p-4">
        <h2 className="font-bold">Order summary</h2>
        <dl className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{inr(subtotal)}</dd></div>
          <div className="flex justify-between"><dt>Shipping</dt><dd>{shipping ? inr(shipping) : "Free"}</dd></div>
          <div className="flex justify-between border-t pt-2 text-base font-bold"><dt>Total</dt><dd>{inr(total)}</dd></div>
        </dl>
        {shipping > 0 && <p className="mt-2 text-xs text-slate-500">Add {inr(site.freeShippingAbove - subtotal)} more for free delivery.</p>}
        <Link href="/checkout" className="mt-4 block rounded-lg bg-indigo-700 py-3 text-center font-semibold text-white">Proceed to checkout</Link>
      </aside>
    </div>
  );
}
