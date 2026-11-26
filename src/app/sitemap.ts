import type { MetadataRoute } from "next";
import { categories } from "@/lib/shop";
import { db } from "@/lib/db";
import { site } from "@/config/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const u = (p: string, lastModified?: Date) => ({ url: `${site.url}${p}`, ...(lastModified ? { lastModified } : {}) });
  const products = await db.product.findMany({ where: { active: true }, select: { slug: true, updatedAt: true }, orderBy: { id: "asc" } });
  return [u("/"), u("/shop"), ...categories.map((c) => u(`/category/${c.slug}`)), ...products.map((p) => u(`/product/${p.slug}`, p.updatedAt)),
    ...["about", "contact", "shipping-policy", "return-policy", "warranty", "privacy-policy", "terms", "grievance"].map((s) => u(`/info/${s}`))];
}
