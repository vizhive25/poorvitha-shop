import Link from "next/link";
import { requirePerm } from "@/lib/auth";
import { db } from "@/lib/db";
import { categories } from "@/lib/shop";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { deleteProduct, quickUpdate } from "../actions";

export const metadata = { title: "Products" };
const PAGE = 25;

export default async function Products({ searchParams }: { searchParams: Promise<{ q?: string; cat?: string; page?: string; saved?: string; deleted?: string }> }) {
  await requirePerm("products");
  const { q = "", cat = "", page = "1", saved, deleted } = await searchParams;
  const where = {
    ...(cat ? { category: cat } : {}),
    ...(q ? { OR: [{ name: { contains: q } }, { brand: { contains: q } }, { slug: { contains: q } }] } : {}),
  };
  const pg = Math.max(1, Number(page) || 1);
  const [total, rows] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({ where, orderBy: [{ sortOrder: "asc" }, { id: "asc" }], skip: (pg - 1) * PAGE, take: PAGE }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const qs = (p: number) => `?q=${encodeURIComponent(q)}&cat=${cat}&page=${p}`;
  const inp = "rounded border border-slate-300 px-2 py-1 text-sm";
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Products <span className="text-sm font-normal text-slate-500">({total})</span></h1>
        <div className="flex gap-2"><Link href="/admin/products/bulk" className="rounded-lg border bg-white px-4 py-2 text-sm font-semibold">Bulk update prices</Link><Link href="/admin/products/new" className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white">+ Add product</Link></div>
      </div>
      {saved && <p className="rounded bg-green-100 px-3 py-2 text-sm text-green-800">Saved.</p>}
      {deleted && <p className="rounded bg-slate-200 px-3 py-2 text-sm">Product deleted.</p>}
      <form className="flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Search name, brand or slug" className={`${inp} w-64`} />
        <select name="cat" defaultValue={cat} className={inp}><option value="">All categories</option>{categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select>
        <button className="rounded border bg-white px-3 py-1 text-sm">Filter</button>
      </form>
      <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">Product</th><th>Price ₹</th><th>Stock</th><th>On request</th><th>Live</th><th></th></tr></thead>
          <tbody className="divide-y">
            {rows.map((p) => {
              const img = (JSON.parse(p.images) as string[])[0];
              const fid = `f${p.id}`;
              return (
                <tr key={p.id} className={p.active ? "" : "bg-slate-50 text-slate-400"}>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {img ? <img src={img} alt="" className="h-10 w-10 rounded border bg-white object-contain" /> : <div className="h-10 w-10 rounded border bg-slate-100" />}
                      <div><Link href={`/admin/products/${p.id}`} className="font-medium text-indigo-800 hover:underline">{p.name}</Link><p className="text-xs text-slate-500">{categories.find((c) => c.slug === p.category)?.name ?? p.category}</p></div>
                    </div>
                  </td>
                  <td><input form={fid} name="price" type="number" min={0} defaultValue={p.price} className={`${inp} w-24`} /></td>
                  <td><input form={fid} name="stock" type="number" min={0} defaultValue={p.stock} className={`${inp} w-20`} /></td>
                  <td><input form={fid} name="priceOnRequest" type="checkbox" defaultChecked={p.priceOnRequest} /></td>
                  <td><input form={fid} name="active" type="checkbox" defaultChecked={p.active} /></td>
                  <td className="space-x-2 whitespace-nowrap pr-3">
                    <form id={fid} action={quickUpdate} className="inline"><input type="hidden" name="id" value={p.id} /><input type="hidden" name="q" value={q} /><button className="rounded bg-slate-900 px-3 py-1 text-xs text-white">Save</button></form>
                    <form action={deleteProduct} className="inline"><input type="hidden" name="id" value={p.id} /><ConfirmButton message="Delete this product permanently? This cannot be undone." className="rounded border border-red-300 px-2 py-1 text-xs text-red-700">Delete</ConfirmButton></form>
                  </td>
                </tr>);
            })}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="flex items-center gap-3 text-sm">
          {pg > 1 && <Link href={qs(pg - 1)} className="rounded border bg-white px-3 py-1">← Prev</Link>}
          <span>Page {pg} of {pages}</span>
          {pg < pages && <Link href={qs(pg + 1)} className="rounded border bg-white px-3 py-1">Next →</Link>}
        </div>
      )}
      <p className="text-xs text-slate-500">Deleting removes the product from the shop for good. To hide it temporarily, untick “Live” instead.</p>
    </div>
  );
}
