"use client";
import Link from "next/link";
import { useRef } from "react";
import type { Product } from "@/lib/shop";
import ProductCard from "./ProductCard";

export default function ProductRow({ title, href, items }: { title: string; href: string; items: Product[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (d: number) => ref.current?.scrollBy({ left: d * 320, behavior: "smooth" });
  return (
    <section>
      <div className="mb-4 flex items-end justify-between">
        <h2 className="text-2xl font-extrabold">{title}</h2>
        <div className="flex items-center gap-2">
          <Link href={href} className="mr-2 text-sm font-semibold text-indigo-700 hover:underline">View all</Link>
          <button aria-label="Scroll left" onClick={() => scroll(-1)} className="hidden h-9 w-9 rounded-full border bg-white shadow-sm hover:bg-slate-100 md:block">‹</button>
          <button aria-label="Scroll right" onClick={() => scroll(1)} className="hidden h-9 w-9 rounded-full border bg-white shadow-sm hover:bg-slate-100 md:block">›</button>
        </div>
      </div>
      <div ref={ref} className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2">
        {items.map((p) => <div key={p.slug} className="w-44 shrink-0 snap-start md:w-56"><ProductCard p={p} /></div>)}
      </div>
    </section>
  );
}
