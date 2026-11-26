"use client";
import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import Link from "next/link";
import { site } from "@/config/site";
import type { Product } from "@/lib/shop";

// The cart keeps a snapshot of each product. The server re-checks price and stock
// when the order is placed, and the snapshot is refreshed from the server on load.
export type Line = { slug: string; qty: number; name: string; price: number; stock: number; image?: string };
type Ctx = {
  lines: Line[]; count: number; subtotal: number; shipping: number; total: number;
  add: (p: Product, qty?: number, silent?: boolean) => void; setQty: (slug: string, qty: number) => void; clear: () => void;
};
const C = createContext<Ctx | null>(null);
const KEY = "pm-cart-v2";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<string | null>(null); // name of the product just added
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    let saved: Line[] = [];
    try { const s = localStorage.getItem(KEY); if (s) saved = JSON.parse(s); } catch {}
    setLines(saved);
    setReady(true);
    if (!saved.length) return;
    fetch(`/api/products?slugs=${encodeURIComponent(saved.map((l) => l.slug).join(","))}`)
      .then((r) => r.json())
      .then((d: { products: Product[] }) => {
        const m = new Map(d.products.map((p) => [p.slug, p]));
        setLines(saved.flatMap((l) => {
          const p = m.get(l.slug);
          if (!p || p.priceOnRequest || p.stock < 1) return [];
          return [{ ...l, name: p.name, price: p.price, stock: p.stock, image: p.images?.[0], qty: Math.min(l.qty, p.stock) }];
        }));
      })
      .catch(() => {});
  }, []);

  useEffect(() => { if (ready) try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch {} }, [lines, ready]);

  const add = (p: Product, qty = 1, silent = false) => {
    if (p.priceOnRequest || p.stock < 1) return;
    addLine(p, qty);
    if (silent) return; // "Buy now" goes straight to checkout, so no toast
    setToast(p.name);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 3500);
  };
  const addLine = (p: Product, qty: number) => setLines((l) => {
    if (p.priceOnRequest || p.stock < 1) return l;
    const e = l.find((x) => x.slug === p.slug);
    const snap = { name: p.name, price: p.price, stock: p.stock, image: p.images?.[0] };
    return e ? l.map((x) => x.slug === p.slug ? { ...x, ...snap, qty: Math.min(p.stock, x.qty + qty) } : x)
      : [...l, { slug: p.slug, qty: Math.min(p.stock, qty), ...snap }];
  });
  const setQty = (slug: string, qty: number) => setLines((l) => qty <= 0 ? l.filter((x) => x.slug !== slug) : l.map((x) => x.slug === slug ? { ...x, qty: Math.min(qty, x.stock) } : x));
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const shipping = subtotal === 0 || subtotal >= site.freeShippingAbove ? 0 : site.shippingFee;
  return (
    <C.Provider value={{ lines, count: lines.reduce((s, l) => s + l.qty, 0), subtotal, shipping, total: subtotal + shipping, add, setQty, clear: () => setLines([]) }}>
      {children}
      {/* Confirms an add-to-cart (it used to be silent). The hidden status line is read aloud by screen readers. */}
      <div role="status" aria-live="polite" className="sr-only">{toast ? `${toast} added to cart` : ""}</div>
      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 md:bottom-6">
          <div className="pointer-events-auto flex max-w-md items-center gap-3 rounded-full bg-neutral-900 py-3 pl-5 pr-3 text-sm text-white shadow-lg">
            <span className="truncate">✓ Added to cart</span>
            <Link href="/cart" className="shrink-0 rounded-full bg-white px-4 py-1.5 font-semibold text-neutral-900">View cart</Link>
          </div>
        </div>
      )}
    </C.Provider>
  );
}
export const useCart = () => { const c = useContext(C); if (!c) throw new Error("CartProvider missing"); return c; };
