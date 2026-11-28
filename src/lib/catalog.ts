// Server-only catalogue access (reads the database).
import type { Product as DbProduct } from "@prisma/client";
import { db } from "./db";
import { categories, type Product } from "./shop";

const arr = (s: string): string[] => { try { const v = JSON.parse(s); return Array.isArray(v) ? v.map(String) : []; } catch { return []; } };

export const toProduct = (p: DbProduct): Product => ({
  slug: p.slug, name: p.name, brand: p.brand, category: p.category,
  price: p.price, mrp: p.mrp, stock: p.stock, featured: p.featured,
  priceOnRequest: p.priceOnRequest, highlights: arr(p.highlights), description: p.description, images: arr(p.images), videos: arr(p.videos ?? "[]"),
});

const order = [{ sortOrder: "asc" as const }, { id: "asc" as const }];

export async function listProducts(opts: { category?: string; q?: string; featured?: boolean; sort?: string; brand?: string } = {}): Promise<Product[]> {
  const rows = await db.product.findMany({
    where: { active: true, ...(opts.category ? { category: opts.category } : {}), ...(opts.brand ? { brand: opts.brand } : {}), ...(opts.featured ? { featured: true } : {}) },
    orderBy: order,
  });
  let list = rows.map(toProduct);
  // Forgiving search: every word typed must appear somewhere in the product's name, brand, category or features,
  // in any order, and spacing doesn't matter ("powerbank" finds "Power Bank", "smart watch" finds smartwatches).
  const words = (opts.q ?? "").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  if (words.length) {
    const catName = (slug: string) => categories.find((c) => c.slug === slug)?.name ?? "";
    list = list.filter((p) => {
      const hay = `${p.name} ${p.brand} ${catName(p.category)} ${p.highlights.join(" ")}`.toLowerCase();
      const tokens = hay.split(/[^a-z0-9]+/).filter(Boolean);
      const pairs = tokens.slice(1).map((t, i) => tokens[i] + t); // "power" + "bank" also answers "powerbank"
      const compact = tokens.join("");
      // Short words ("a50", "s24") must start a word, so they don't match inside other text; longer words may match inside a word ("watch" in "smartwatches").
      return words.every((w) => tokens.some((t) => t.startsWith(w)) || pairs.some((t) => t.startsWith(w)) || (w.length >= 5 && compact.includes(w)));
    });
  }
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
