"use client";
import Link from "next/link";
import { Product, inr, thumb } from "@/lib/shop";
import { useCart } from "./CartProvider";

export function ProductImage({ p, className = "", src, small = false }: { p: Product; className?: string; src?: string; small?: boolean }) {
  const img = src ?? p.images?.[0];
  if (img)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={small ? thumb(img) : img} alt={p.name} width={600} height={600} loading="lazy" decoding="async"
      onError={small ? (e) => { if (e.currentTarget.src.includes("/_t/")) e.currentTarget.src = img; } : undefined} className={`aspect-square w-full rounded-lg bg-white object-contain ${className}`} />;
  const hue = (p.brand.charCodeAt(0) * 37 + p.category.length * 23) % 360;
  return (
    <div className={`flex aspect-square items-center justify-center rounded-lg text-center ${className}`}
      style={{ background: `linear-gradient(135deg, hsl(${hue} 70% 94%), hsl(${(hue + 40) % 360} 70% 86%))` }}
      role="img" aria-label={p.name}>
      <span className="px-4 text-sm font-semibold text-slate-700">{p.brand}<br /><span className="text-xs font-normal">Image coming soon</span></span>
    </div>
  );
}

export default function ProductCard({ p }: { p: Product }) {
  const { add } = useCart();
  const off = p.priceOnRequest ? 0 : Math.round(((p.mrp - p.price) / p.mrp) * 100);
  return (
    <div className="group flex flex-col">
      <Link href={`/product/${p.slug}`} className="relative block overflow-hidden rounded-2xl bg-neutral-100">
        <ProductImage p={p} small className="rounded-none bg-transparent mix-blend-multiply transition duration-300 group-hover:scale-105" />
        {off > 0 && <span className="absolute left-2 top-2 rounded-full bg-neutral-900 px-2 py-0.5 text-[11px] font-semibold text-white">{off}% off</span>}
        {!p.priceOnRequest && p.stock < 1 && <span className="absolute right-2 top-2 rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-neutral-600">Sold out</span>}
      </Link>
      <p className="mt-3 text-[11px] font-medium uppercase tracking-widest text-neutral-500">{p.brand}</p>
      <Link href={`/product/${p.slug}`} className="line-clamp-2 min-h-10 text-sm font-medium leading-snug text-neutral-900 hover:underline">{p.name}</Link>
      <div className="mt-1.5 flex items-baseline gap-2">
        <span className="text-base font-bold tracking-tight">{p.priceOnRequest ? "Price on request" : inr(p.price)}</span>
        {off > 0 && <span className="text-xs text-neutral-500 line-through">{inr(p.mrp)}</span>}
      </div>
      {p.priceOnRequest ? (
        <Link href={`/product/${p.slug}`} className="mt-3 flex min-h-11 items-center justify-center rounded-full border border-neutral-900 px-3 py-2 text-center text-sm font-semibold text-neutral-900 hover:bg-neutral-900 hover:text-white">Enquire</Link>
      ) : <button onClick={() => add(p)} disabled={p.stock < 1}
        className="mt-3 min-h-11 rounded-full bg-neutral-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:bg-neutral-200 disabled:text-neutral-500">
        {p.stock < 1 ? "Out of stock" : "Add to cart"}
      </button>}
    </div>
  );
}
