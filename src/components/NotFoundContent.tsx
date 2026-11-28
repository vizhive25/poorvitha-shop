import Link from "next/link";
import { categories } from "@/lib/shop";
import { site } from "@/config/site";

/** Friendly "page not found" body, used inside the shop layout and as the site-wide fallback. */
export default function NotFoundContent() {
  return (
    <div className="mx-auto max-w-xl py-14 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-neutral-500">Error 404</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight">We couldn&apos;t find that page</h1>
      <p className="mt-2 text-neutral-600">The link may be old, or the product may no longer be listed. Try a search or pick a category.</p>
      <form action="/shop" role="search" className="mx-auto mt-6 flex max-w-md gap-2">
        <label htmlFor="nf-q" className="sr-only">Search products</label>
        <input id="nf-q" name="q" type="search" placeholder="Search phones, watches, earbuds…" className="min-w-0 flex-1 rounded-full border border-neutral-300 bg-neutral-50 px-4 py-2.5 text-sm" />
        <button className="rounded-full bg-neutral-900 px-5 text-sm font-semibold text-white hover:bg-neutral-700">Search</button>
      </form>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {categories.map((c) => <Link key={c.slug} href={`/category/${c.slug}`} className="rounded-full border border-neutral-300 px-3.5 py-1.5 text-sm hover:border-neutral-900">{c.name}</Link>)}
      </div>
      <p className="mt-8 text-sm text-neutral-600">
        <Link href="/" className="font-semibold underline">Back to home</Link> · Need help? Call {site.phone}
      </p>
    </div>
  );
}
