import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategory, slim } from "@/lib/shop";
import { listProducts } from "@/lib/catalog";
import ProductCard from "@/components/ProductCard";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const c = getCategory((await params).slug);
  return c ? { title: c.name, description: `Buy ${c.name.toLowerCase()} online at Poorvitha Mobiles. ${c.blurb}.` } : {};
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const c = getCategory((await params).slug);
  if (!c) notFound();
  const items = await listProducts({ category: c.slug });
  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight">{c.name}</h1>
      <p className="mb-6 mt-1 text-sm text-neutral-500">{items.length} products · {c.blurb}</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 xl:grid-cols-5">{items.map(slim).map((p) => <ProductCard key={p.slug} p={p} />)}</div>
    </div>
  );
}
