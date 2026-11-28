import type { Metadata } from "next";
import { db } from "@/lib/db";
import { listProducts } from "@/lib/catalog";
import Listing from "@/components/Listing";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "All products" };

export default async function Shop({ searchParams }: { searchParams: Promise<{ q?: string; sort?: string; brand?: string; page?: string }> }) {
  const { q = "", sort = "", brand = "", page = "1" } = await searchParams;
  const brands = (await db.product.findMany({ where: { active: true }, distinct: ["brand"], select: { brand: true }, orderBy: { brand: "asc" } })).map((b) => b.brand);
  const list = await listProducts({ q, sort, brand: brands.includes(brand) ? brand : undefined });
  return (
    <div>
      <h1 className="mb-4 text-3xl font-extrabold tracking-tight">{q ? `Results for “${q}”` : "All products"} <span className="text-sm font-normal text-neutral-500">({list.length})</span></h1>
      <Listing basePath="/shop" params={{ q, sort, brand: brands.includes(brand) ? brand : "", page }} brands={brands} items={list} />
    </div>
  );
}
