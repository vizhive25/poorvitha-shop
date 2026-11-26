"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./CartProvider";
import { inr } from "@/lib/shop";

import type { Product } from "@/lib/shop";

export default function AddToCart({ product }: { product: Product }) {
  const disabled = product.stock < 1;
  const { add } = useCart();
  const router = useRouter();
  const inline = useRef<HTMLDivElement>(null);
  const [showBar, setShowBar] = useState(false);

  // On phones, once the normal buttons scroll out of view, a bar sticks to the bottom so buying is always one thumb-tap away.
  useEffect(() => {
    const el = inline.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setShowBar(!e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const buyNow = () => { add(product, 1, true); router.push("/checkout"); };
  return (
    <>
      <div ref={inline} className="mt-4 flex gap-3">
        <button disabled={disabled} onClick={() => add(product)} className="min-h-12 rounded-full border border-neutral-900 px-6 py-3 font-semibold text-neutral-900 hover:bg-neutral-100 disabled:opacity-40">Add to cart</button>
        <button disabled={disabled} onClick={buyNow} className="min-h-12 rounded-full bg-neutral-900 px-6 py-3 font-semibold text-white hover:bg-neutral-700 disabled:bg-neutral-300">Buy now</button>
      </div>
      {showBar && !disabled && (
        <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-neutral-200 bg-white/95 px-4 py-3 backdrop-blur md:hidden" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
          <div className="min-w-0 flex-1"><p className="truncate text-xs text-neutral-500">{product.name}</p><p className="text-lg font-extrabold leading-tight">{inr(product.price)}</p></div>
          <button onClick={() => add(product)} className="min-h-12 rounded-full border border-neutral-900 px-4 font-semibold">Add</button>
          <button onClick={buyNow} className="min-h-12 rounded-full bg-neutral-900 px-5 font-semibold text-white">Buy now</button>
        </div>
      )}
    </>
  );
}
