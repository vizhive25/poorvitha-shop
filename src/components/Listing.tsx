import Link from "next/link";
import ProductCard from "./ProductCard";
import { slim, categories, type Product } from "@/lib/shop";
import { site } from "@/config/site";

const PAGE_SIZE = 24;
const SORTS: [string, string][] = [["", "Featured"], ["low", "Price: low to high"], ["high", "Price: high to low"]];
const pill = (on: boolean) => `inline-flex min-h-9 items-center rounded-full border px-3.5 text-sm ${on ? "border-neutral-900 bg-neutral-900 text-white" : "border-neutral-300 bg-white hover:border-neutral-900"}`;

export type ListParams = { q?: string; sort?: string; brand?: string; page?: string };

/**
 * Product grid shared by /shop and the category pages: sort links (applied instantly, no "Apply" button),
 * brand chips, 24 products per page with page links, and a helpful message when nothing matches.
 */
export default function Listing({ basePath, params, brands, items }: { basePath: string; params: ListParams; brands: string[]; items: Product[] }) {
  const href = (o: Partial<ListParams>) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...params, ...o })) if (v && !(k === "page" && v === "1")) sp.set(k, v);
    const s = sp.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const page = Math.min(pages, Math.max(1, parseInt(params.page ?? "1", 10) || 1));
  const shown = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 1);
  const ask = `https://wa.me/${site.whatsapp}?text=${encodeURIComponent("Hi Poorvitha Mobiles, I'm looking for: " + (params.q ?? ""))}`;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2" aria-label="Sort">
        <span className="mr-1 text-sm text-neutral-500">Sort:</span>
        {SORTS.map(([v, l]) => <Link key={v} href={href({ sort: v, page: "1" })} className={pill((params.sort ?? "") === v)} aria-current={(params.sort ?? "") === v}>{l}</Link>)}
      </div>
      {brands.length > 1 && (
        <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto pb-1" aria-label="Brands">
          <Link href={href({ brand: "", page: "1" })} className={`${pill(!params.brand)} shrink-0`}>All brands</Link>
          {brands.map((b) => <Link key={b} href={href({ brand: b, page: "1" })} className={`${pill(params.brand === b)} shrink-0`}>{b}</Link>)}
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-2xl bg-neutral-100 p-6 text-center">
          <p className="text-lg font-semibold">{params.q ? `No products match “${params.q}”` : "No products found"}</p>
          <p className="mt-1 text-sm text-neutral-600">Try a shorter word, another spelling, or browse a category.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {categories.map((c) => <Link key={c.slug} href={`/category/${c.slug}`} className={pill(false)}>{c.name}</Link>)}
          </div>
          <p className="mt-5 text-sm">Can&apos;t find it? We&apos;ll try to get it for you.</p>
          <a href={ask} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block rounded-full bg-neutral-900 px-5 py-2.5 font-semibold text-white hover:bg-neutral-700">Ask on WhatsApp</a>
        </div>
      ) : (
        <>
          <p className="mb-3 text-sm text-neutral-500">Showing {(page - 1) * PAGE_SIZE + 1}–{(page - 1) * PAGE_SIZE + shown.length} of {items.length}</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 xl:grid-cols-5">{shown.map(slim).map((p) => <ProductCard key={p.slug} p={p} />)}</div>
          {pages > 1 && (
            <nav aria-label="Pages" className="mt-10 flex flex-wrap items-center justify-center gap-2">
              {page > 1 && <Link href={href({ page: String(page - 1) })} className={pill(false)} rel="prev">← Previous</Link>}
              {nums.map((n, i) => (
                <span key={n} className="flex items-center gap-2">
                  {i > 0 && n - nums[i - 1] > 1 && <span aria-hidden className="text-neutral-400">…</span>}
                  <Link href={href({ page: String(n) })} className={pill(n === page)} aria-current={n === page ? "page" : undefined}>{n}</Link>
                </span>
              ))}
              {page < pages && <Link href={href({ page: String(page + 1) })} className={pill(false)} rel="next">Next →</Link>}
            </nav>
          )}
        </>
      )}
    </div>
  );
}
