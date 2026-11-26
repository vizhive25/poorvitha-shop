"use client";
import { useState } from "react";
import type { Product } from "@/lib/shop";
import { ProductImage } from "./ProductCard";
import { thumb } from "@/lib/shop";

export default function Gallery({ p }: { p: Product }) {
  const imgs = p.images ?? [];
  const [i, setI] = useState(0);
  return (
    <div className="max-w-md">
      <div className="overflow-hidden rounded-2xl bg-neutral-100"><ProductImage p={p} src={imgs[i]} className="rounded-none bg-transparent mix-blend-multiply" /></div>
      {imgs.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {imgs.map((src, n) => (
            // eslint-disable-next-line @next/next/no-img-element
            <button key={src} onClick={() => setI(n)} aria-label={`Show image ${n + 1}`}
              className={`h-16 w-16 shrink-0 rounded-xl border bg-neutral-100 p-1 ${n === i ? "border-neutral-900" : "border-transparent"}`}>
              <img src={thumb(src)} alt="" width={64} height={64} loading="lazy" decoding="async" onError={(e) => { if (e.currentTarget.src.includes("/_t/")) e.currentTarget.src = src; }} className="h-full w-full object-contain mix-blend-multiply" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
