import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategory } from "@/lib/shop";
import { listProducts } from "@/lib/catalog";
import Listing from "@/components/Listing";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = getCategory((await params).slug);
  return c ? { title: c.name, description: `Buy ${c.name.toLowerCase()} online at Poorvitha Mobiles. ${c.blurb}.` } : {};
}

export default async function CategoryPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ sort?: string; brand?: string; page?: string }> }) {
  const c = getCategory((await params).slug);
  if (!c) notFound();
  const { sort = "", brand = "", page = "1" } = await searchParams;
  const all = await listProducts({ category: c.slug });
  const brands = [...new Set(all.map((p) => p.brand))].sort();
  const b = brands.includes(brand) ? brand : "";
  const items = await listProducts({ category: c.slug, sort, brand: b || undefined });
  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight">{c.name}</h1>
      <p className="mb-6 mt-1 text-sm text-neutral-500">{all.length} products · {c.blurb}</p>
      <Listing basePath={`/category/${c.slug}`} params={{ sort, brand: b, page }} brands={brands} items={items} />
    </div>
  );
}
