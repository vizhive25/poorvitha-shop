import type { MetadataRoute } from "next";
import { categories } from "@/lib/shop";
import { listProducts } from "@/lib/catalog";
import { site } from "@/config/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const u = (p: string) => ({ url: `${site.url}${p}` });
  const products = await listProducts();
  return [u("/"), u("/shop"), ...categories.map((c) => u(`/category/${c.slug}`)), ...products.map((p) => u(`/product/${p.slug}`)),
    ...["about", "contact", "shipping-policy", "return-policy", "warranty", "privacy-policy", "terms", "grievance"].map((s) => u(`/info/${s}`))];
}
