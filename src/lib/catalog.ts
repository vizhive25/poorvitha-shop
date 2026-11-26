// Server-only catalogue access (reads the database).
import type { Product as DbProduct } from "@prisma/client";
import { db } from "./db";
import type { Product } from "./shop";

const arr = (s: string): string[] => { try { const v = JSON.parse(s); return Array.isArray(v) ? v.map(String) : []; } catch { return []; } };

export const toProduct = (p: DbProduct): Product => ({
  slug: p.slug, name: p.name, brand: p.brand, category: p.category,
  price: p.price, mrp: p.mrp, stock: p.stock, featured: p.featured,
  priceOnRequest: p.priceOnRequest, highlights: arr(p.highlights), description: p.description, images: arr(p.images),
});

const order = [{ sortOrder: "asc" as const }, { id: "asc" as const }];

export async function listProducts(opts: { category?: string; q?: string; featured?: boolean; sort?: string; brand?: string } = {}): Promise<Product[]> {
  const rows = await db.product.findMany({
    where: { active: true, ...(opts.category ? { category: opts.category } : {}), ...(opts.brand ? { brand: opts.brand } : {}), ...(opts.featured ? { featured: true } : {}) },
    orderBy: order,
  });
  let list = rows.map(toProduct);
  const q = opts.q?.trim().toLowerCase();
  if (q) list = list.filter((p) => `${p.name} ${p.brand}`.toLowerCase().includes(q));
  const key = (p: Product) => (p.priceOnRequest ? 1e12 : p.price);
  // Products without a price go last, so shoppers see things they can buy first (order is otherwise unchanged).
  if (!opts.sort) list = [...list.filter((p) => !p.priceOnRequest), ...list.filter((p) => p.priceOnRequest)];
  if (opts.sort === "low") list = [...list].sort((a, b) => key(a) - key(b));
  if (opts.sort === "high") list = [...list].sort((a, b) => (b.priceOnRequest ? -1 : b.price) - (a.priceOnRequest ? -1 : a.price));
  return list;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const p = await db.product.findFirst({ where: { slug, active: true } });
  return p ? toProduct(p) : null;
}

export async function getProductsBySlugs(slugs: string[]): Promise<Product[]> {
  const rows = await db.product.findMany({ where: { slug: { in: slugs }, active: true } });
  return rows.map(toProduct);
}
