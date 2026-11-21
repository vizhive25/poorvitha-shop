// Loads the starter catalogue (src/data/*) into the database. Adds only products that are missing,
// so anything edited in the admin panel is never overwritten. Used by `prisma db seed` and by the admin
// page "Load starter catalogue" (so no terminal is needed on the live server).
import type { PrismaClient } from "@prisma/client";

// Estimated packed weights (grams) per category; edit per product in the admin.
const WEIGHT: Record<string, number> = { "mobile-phones": 450, smartwatches: 250, "chargers-cables": 150, "wireless-audio": 200, "wired-earphones": 120, "home-kitchen": 3500, "solar-lights": 1500, "smart-gadgets": 800, "speakers-powerbanks": 500 };

export async function loadStarterCatalogue(db: PrismaClient): Promise<{ created: number; total: number }> {
  const { products } = await import("../data/products");
  const have = new Set((await db.product.findMany({ select: { slug: true } })).map((p) => p.slug));
  let created = 0;
  for (const [i, p] of products.entries()) {
    if (have.has(p.slug)) continue;
    await db.product.create({
      data: {
        slug: p.slug, name: p.name, brand: p.brand, category: p.category,
        price: p.price, mrp: p.mrp, stock: p.stock, featured: !!p.featured,
        priceOnRequest: !!p.priceOnRequest, active: true,
        highlights: JSON.stringify(p.highlights), description: p.description,
        images: JSON.stringify(p.images ?? []), sortOrder: i,
        weightGrams: p.slug.startsWith("itel-washing-machine") ? 40000 : WEIGHT[p.category] ?? 300,
      },
    });
    created++;
  }
  return { created, total: products.length };
}
