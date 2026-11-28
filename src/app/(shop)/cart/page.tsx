"use client";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { inr, thumb } from "@/lib/shop";
import { site } from "@/config/site";

export default function CartPage() {
  const { lines, setQty, subtotal, shipping, total } = useCart();
  if (!lines.length) return <div className="py-16 text-center"><h1 className="text-2xl font-extrabold tracking-tight">Your cart is empty</h1><Link href="/shop" className="mt-4 inline-block rounded-full bg-neutral-900 px-6 py-3 font-semibold text-white hover:bg-neutral-700">Continue shopping</Link></div>;
  return (
    <div className="grid gap-8 md:grid-cols-3">
      <div className="space-y-3 md:col-span-2">
        <h1 className="text-3xl font-extrabold tracking-tight">Shopping cart</h1>
        {lines.map((l) => (
          <div key={l.slug} className="flex gap-3 rounded-2xl bg-neutral-100 p-3 sm:p-4">
            <Link href={`/product/${l.slug}`} className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white" aria-hidden tabIndex={-1}>
              {l.image
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={thumb(l.image)} alt="" width={80} height={80} loading="lazy" className="h-full w-full object-contain" />
                : <span className="flex h-full items-center justify-center text-[10px] text-neutral-400">No photo</span>}
            </Link>
            <div className="min-w-0 flex-1">
              <Link href={`/product/${l.slug}`} className="line-clamp-2 font-medium leading-snug hover:underline">{l.name}</Link>
              <p className="mt-0.5 text-sm text-neutral-500">{inr(l.price)} each</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                <div className="flex items-center gap-1">
                  <button aria-label={`Decrease quantity of ${l.name}`} onClick={() => setQty(l.slug, l.qty - 1)} className="h-11 w-11 rounded-full border border-neutral-300 bg-white hover:bg-neutral-200">−</button>
                  <span className="w-7 text-center" aria-live="polite">{l.qty}</span>
                  <button aria-label={`Increase quantity of ${l.name}`} onClick={() => setQty(l.slug, l.qty + 1)} disabled={l.qty >= l.stock} className="h-11 w-11 rounded-full border border-neutral-300 bg-white hover:bg-neutral-200 disabled:opacity-40">+</button>
                </div>
                <button onClick={() => setQty(l.slug, 0)} className="min-h-11 px-2 text-sm text-neutral-600 underline hover:text-neutral-900" aria-label={`Remove ${l.name} from cart`}>Remove</button>
                <span className="ml-auto font-semibold">{inr(l.price * l.qty)}</span>
              </div>
              {l.qty >= l.stock && <p className="mt-1 text-xs text-neutral-500">Maximum available quantity.</p>}
            </div>
          </div>))}
      </div>
      <aside className="h-fit rounded-2xl bg-neutral-100 p-4">
        <h2 className="font-bold">Order summary</h2>
        <dl className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{inr(subtotal)}</dd></div>
          <div className="flex justify-between"><dt>Shipping</dt><dd>{shipping ? inr(shipping) : "Free"}</dd></div>
          <div className="flex justify-between border-t pt-2 text-base font-bold"><dt>Total</dt><dd>{inr(total)}</dd></div>
        </dl>
        {shipping > 0 && <p className="mt-2 text-xs text-neutral-500">Add {inr(site.freeShippingAbove - subtotal)} more for free delivery.</p>}
        <Link href="/checkout" className="mt-4 block rounded-full bg-neutral-900 py-3 text-center font-semibold text-white hover:bg-neutral-700">Proceed to checkout</Link>
        <ul className="mt-4 space-y-1 text-xs text-neutral-600">
          <li>Dispatched in 1–2 business days, delivered in 3–7 business days.</li>
          <li>Pay online, or Cash on Delivery on smaller orders.</li>
          <li>7-day replacement for defective items. <Link href="/info/return-policy" className="underline">Returns policy</Link></li>
        </ul>
      </aside>
    </div>
  );
}
