"use client";
import { useState } from "react";
import type { Product } from "@/lib/shop";
import { ProductImage } from "./ProductCard";

export default function Gallery({ p }: { p: Product }) {
  const imgs = p.images ?? [];
  const [i, setI] = useState(0);
  return (
    <div className="max-w-md">
      <ProductImage p={p} src={imgs[i]} />
      {imgs.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {imgs.map((src, n) => (
            // eslint-disable-next-line @next/next/no-img-element
            <button key={src} onClick={() => setI(n)} aria-label={`Show image ${n + 1}`}
              className={`h-16 w-16 shrink-0 rounded border bg-white p-1 ${n === i ? "border-indigo-600" : "border-slate-200"}`}>
              <img src={src} alt="" loading="lazy" className="h-full w-full object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
