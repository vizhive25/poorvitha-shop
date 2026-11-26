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
  const nav = "whitespace-nowrap border-b-2 px-0.5 py-3 transition";
  const search = (id: string) => (
    <form role="search" className="w-full" onSubmit={(e) => { e.preventDefault(); router.push(`/shop?q=${encodeURIComponent(q)}`); }}>
      <label htmlFor={id} className="sr-only">Search products</label>
      <input id={id} type="search" enterKeyHint="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search phones, watches, earbuds…"
        className="w-full rounded-full border border-neutral-300 bg-neutral-50 px-4 py-2.5 text-sm outline-none focus:border-neutral-900 focus:bg-white" />
    </form>
  );
  const categoryLinks = (
    <>
      <Link href="/shop" className={`${nav} font-semibold ${path === "/shop" ? "border-neutral-900" : "border-transparent"}`}>All products</Link>
      {categories.map((c) => <Link key={c.slug} href={`/category/${c.slug}`} className={`${nav} ${path === `/category/${c.slug}` ? "border-neutral-900 font-semibold text-neutral-900" : "border-transparent text-neutral-600 hover:text-neutral-900"}`}>{c.name}</Link>)}
    </>
  );
  const navClass = "no-scrollbar mx-auto flex max-w-7xl gap-6 overflow-x-auto px-4 text-sm [mask-image:linear-gradient(to_right,black_90%,transparent)]";
  return (
    <header>
      <div className="bg-neutral-950 py-1.5 text-center text-xs tracking-wide text-white">Free delivery on orders above ₹{site.freeShippingAbove} · Cash on Delivery available</div>
      {/* Only this slim bar (logo, search on larger screens, cart) stays stuck to the top. On phones the search box and category list scroll away to leave room for the products. */}
      <div className="sticky top-0 z-30 border-b border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-2 md:py-3">
          <Link href="/" className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-neutral-900" aria-label={`${site.name} home`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {logo ? <img src={logo} alt={site.name} width={74} height={48} className="h-10 w-auto rounded-lg md:h-12" /> : <span>Poorvitha <span className="text-neutral-500">Mobiles</span></span>}
          </Link>
          <div className="hidden flex-1 md:block">{search("search-desktop")}</div>
          <Link href="/cart" className="ml-auto inline-flex min-h-11 items-center rounded-full bg-neutral-900 px-5 text-sm font-semibold text-white hover:bg-neutral-700">Cart ({count})</Link>
        </div>
        {/* On wide screens the category bar stays with the sticky bar, as before. */}
        <nav aria-label="Categories" className={`${navClass} hidden lg:flex lg:[mask-image:none]`}>{categoryLinks}</nav>
      </div>
      <div className="mx-auto max-w-7xl px-4 pb-1 pt-2 md:hidden">{search("search-mobile")}</div>
      {/* Phones and tablets: the category list sits below, scrolls with the page, and fades on the right edge to show it moves sideways. */}
      <nav aria-label="Categories" className={`${navClass} border-b border-neutral-200 bg-white lg:hidden`}>{categoryLinks}</nav>
    </header>
  );
}
