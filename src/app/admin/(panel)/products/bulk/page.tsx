import Link from "next/link";
import { db } from "@/lib/db";
import { can, requirePerm } from "@/lib/auth";
import BulkPrices from "@/components/admin/BulkPrices";
import { importStarter } from "../../catalog-actions";

export const metadata = { title: "Bulk update" };

export default async function Bulk() {
  const user = await requirePerm("products");
  const total = await db.product.count();
  const missing = await db.product.count({ where: { priceOnRequest: true } });
  return (
    <div className="max-w-3xl space-y-4">
      <p className="text-sm"><Link href="/admin/products" className="text-indigo-700">← Products</Link></p>
      <h1 className="text-2xl font-bold">Bulk update prices &amp; stock</h1>
      <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700">
        <li>Download the sheet: <a href="/api/admin/products.csv?missing=1" className="text-indigo-700 underline">only products that still need a price ({missing})</a> or <a href="/api/admin/products.csv" className="text-indigo-700 underline">all products</a>.</li>
        <li>Open it in Excel or Google Sheets. Fill the <b>price</b> column (selling price in ₹, GST included). Optionally set <b>mrp</b>, <b>stock</b> and <b>live</b> (yes/no). Leave the <b>slug</b> column and the headings as they are, and delete rows you don&apos;t want to touch.</li>
        <li>Save as <b>CSV</b> and upload it below. You will see every change before anything is saved.</li>
      </ol>
      <p className="text-xs text-slate-500">Giving a product a price takes it off “price on request” so customers can order it. An MRP lower than the price is raised to the price (no fake discounts). Blank cells are left unchanged.</p>
      <BulkPrices />
      {can(user.role, "staff") && (
        <form action={importStarter} className="rounded-2xl border bg-white p-5 text-sm shadow-sm">
          <h2 className="font-bold">Starter catalogue</h2>
          <p className="mt-1 text-slate-600">The database has {total} products. This adds any products from the built-in starter list that are missing (for example on a brand-new server). It never changes products that already exist.</p>
          <button className="mt-3 rounded border bg-white px-3 py-1">Load starter catalogue</button>
        </form>
      )}
    </div>
  );
}
