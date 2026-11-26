"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { site } from "@/config/site";
import { categories } from "@/lib/shop";
import { useCart } from "./CartProvider";

export default function Header({ logo }: { logo?: string }) {
  const { count } = useCart();
  const router = useRouter();
  const path = usePathname();
  const [q, setQ] = useState("");
  const nav = "whitespace-nowrap border-b-2 py-2 transition";
  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="bg-neutral-950 py-1.5 text-center text-xs tracking-wide text-white">Free delivery on orders above ₹{site.freeShippingAbove} · Cash on Delivery available</div>
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-neutral-900" aria-label={`${site.name} home`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {logo ? <img src={logo} alt={site.name} className="h-12 w-auto rounded-lg" /> : <span>Poorvitha <span className="text-neutral-500">Mobiles</span></span>}
        </Link>
        <form className="hidden flex-1 md:block" onSubmit={(e) => { e.preventDefault(); router.push(`/shop?q=${encodeURIComponent(q)}`); }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search phones, watches, earbuds…" aria-label="Search products"
            className="w-full rounded-full border border-neutral-300 bg-neutral-50 px-4 py-2 text-sm outline-none focus:border-neutral-900 focus:bg-white" />
        </form>
        <Link href="/cart" className="ml-auto rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-700">Cart ({count})</Link>
      </div>
      <nav className="mx-auto flex max-w-6xl gap-6 overflow-x-auto px-4 text-sm">
        <Link href="/shop" className={`${nav} font-semibold ${path === "/shop" ? "border-neutral-900" : "border-transparent"}`}>All products</Link>
        {categories.map((c) => <Link key={c.slug} href={`/category/${c.slug}`} className={`${nav} ${path === `/category/${c.slug}` ? "border-neutral-900 font-semibold text-neutral-900" : "border-transparent text-neutral-600 hover:text-neutral-900"}`}>{c.name}</Link>)}
      </nav>
    </header>
  );
}
