"use client";
import Link from "next/link";
import { Product, inr } from "@/lib/shop";
import { useCart } from "./CartProvider";

export function ProductImage({ p, className = "", src }: { p: Product; className?: string; src?: string }) {
  const img = src ?? p.images?.[0];
  if (img)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={img} alt={p.name} loading="lazy" className={`aspect-square w-full rounded-lg bg-white object-contain ${className}`} />;
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
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <Link href={`/product/${p.slug}`}><ProductImage p={p} /></Link>
      <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">{p.brand}</p>
      <Link href={`/product/${p.slug}`} className="line-clamp-2 min-h-10 text-sm font-medium hover:text-indigo-700">{p.name}</Link>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-lg font-bold">{p.priceOnRequest ? "Price on request" : inr(p.price)}</span>
        {off > 0 && <><span className="text-xs text-slate-400 line-through">{inr(p.mrp)}</span>
        <span className="text-xs font-semibold text-green-700">{off}% off</span></>}
      </div>
      {p.priceOnRequest ? (
        <Link href={`/product/${p.slug}`} className="mt-3 rounded-lg border border-indigo-700 px-3 py-2 text-center text-sm font-semibold text-indigo-700 hover:bg-indigo-50">Enquire</Link>
      ) : <button onClick={() => add(p)} disabled={p.stock < 1}
        className="mt-3 rounded-lg bg-indigo-700 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-800 disabled:bg-slate-300">
        {p.stock < 1 ? "Out of stock" : "Add to cart"}
      </button>}
    </div>
  );
}
