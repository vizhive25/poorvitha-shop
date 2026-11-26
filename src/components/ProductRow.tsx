"use client";
import Link from "next/link";
import { useRef } from "react";
import type { Product } from "@/lib/shop";
import ProductCard from "./ProductCard";

export default function ProductRow({ title, href, items, subtitle }: { title: string; href: string; items: Product[]; subtitle?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (d: number) => ref.current?.scrollBy({ left: d * 320, behavior: "smooth" });
  if (!items.length) return null;
  return (
    <section>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-neutral-500">{subtitle}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link href={href} className="mr-1 whitespace-nowrap rounded-full border border-neutral-900 px-4 py-1.5 text-sm font-semibold hover:bg-neutral-900 hover:text-white">Shop all</Link>
          <button aria-label="Scroll left" onClick={() => scroll(-1)} className="hidden h-9 w-9 rounded-full border border-neutral-300 bg-white hover:bg-neutral-100 md:block">‹</button>
          <button aria-label="Scroll right" onClick={() => scroll(1)} className="hidden h-9 w-9 rounded-full border border-neutral-300 bg-white hover:bg-neutral-100 md:block">›</button>
        </div>
      </div>
      <div ref={ref} className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2">
        {items.map((p) => <div key={p.slug} className="w-44 shrink-0 snap-start md:w-56"><ProductCard p={p} /></div>)}
      </div>
    </section>
  );
}
