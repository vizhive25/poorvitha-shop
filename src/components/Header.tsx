"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { site } from "@/config/site";
import { categories } from "@/lib/shop";
import { useCart } from "./CartProvider";

export default function Header({ logo }: { logo?: string }) {
  const { count } = useCart();
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <header className="sticky top-0 z-30 border-b bg-white">
      <div className="bg-indigo-800 py-1 text-center text-xs text-white">Free delivery on orders above ₹{site.freeShippingAbove} · Cash on Delivery available</div>
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-xl font-extrabold text-indigo-800" aria-label={`${site.name} home`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {logo ? <img src={logo} alt={site.name} className="h-12 w-auto rounded-lg" /> : <span>Poorvitha <span className="text-slate-900">Mobiles</span></span>}
        </Link>
        <form className="hidden flex-1 md:block" onSubmit={(e) => { e.preventDefault(); router.push(`/shop?q=${encodeURIComponent(q)}`); }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search phones, watches, earbuds…" aria-label="Search products"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </form>
        <Link href="/cart" className="ml-auto rounded-lg border px-3 py-2 text-sm font-semibold">Cart ({count})</Link>
      </div>
      <nav className="mx-auto flex max-w-6xl gap-5 overflow-x-auto px-4 pb-2 text-sm">
        <Link href="/shop" className="whitespace-nowrap font-semibold">All products</Link>
        {categories.map((c) => <Link key={c.slug} href={`/category/${c.slug}`} className="whitespace-nowrap text-slate-600 hover:text-indigo-700">{c.name}</Link>)}
      </nav>
    </header>
  );
}
