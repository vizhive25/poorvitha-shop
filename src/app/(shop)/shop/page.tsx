import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { listProducts } from "@/lib/catalog";
import ProductCard from "@/components/ProductCard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "All products" };

export default async function Shop({ searchParams }: { searchParams: Promise<{ q?: string; sort?: string; brand?: string }> }) {
  const { q = "", sort = "", brand = "" } = await searchParams;
  const brands = (await db.product.findMany({ where: { active: true }, distinct: ["brand"], select: { brand: true }, orderBy: { brand: "asc" } })).map((b) => b.brand);
  const list = await listProducts({ q, sort, brand: brands.includes(brand) ? brand : undefined });
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">{q ? `Results for “${q}”` : "All products"} <span className="text-sm font-normal text-slate-500">({list.length})</span></h1>
        <form className="flex gap-2 text-sm">
          <input type="hidden" name="q" value={q} />
          <input type="hidden" name="brand" value={brand} />
          <select name="sort" defaultValue={sort} className="rounded border px-2 py-1"><option value="">Featured</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select>
          <button className="rounded border px-3 py-1">Apply</button>
        </form>
      </div>
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <Link href={`/shop?q=${encodeURIComponent(q)}&sort=${sort}`} className={`rounded-full border px-3 py-1 ${!brand ? "bg-indigo-700 text-white" : "bg-white"}`}>All brands</Link>
        {brands.map((b) => <Link key={b} href={`/shop?brand=${encodeURIComponent(b)}&q=${encodeURIComponent(q)}&sort=${sort}`} className={`rounded-full border px-3 py-1 ${brand === b ? "bg-indigo-700 text-white" : "bg-white"}`}>{b}</Link>)}
      </div>
      {list.length ? <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{list.map((p) => <ProductCard key={p.slug} p={p} />)}</div> : <p>No products found.</p>}
    </div>
  );
}
