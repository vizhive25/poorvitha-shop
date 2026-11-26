import Link from "next/link";
import { requirePerm } from "@/lib/auth";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import ProductForm from "@/components/admin/ProductForm";
import { saveProduct } from "../../actions";

export const metadata = { title: "Edit product" };

const arr = (s: string): string[] => { try { return JSON.parse(s); } catch { return []; } };

export default async function EditProduct({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ e?: string }> }) {
  await requirePerm("products");
  const id = Number((await params).id);
  const p = Number.isInteger(id) ? await db.product.findUnique({ where: { id } }) : null;
  if (!p) notFound();
  const { e } = await searchParams;
  return (
    <div className="space-y-4">
      <p className="text-sm"><Link href="/admin/products" className="text-indigo-700">← Products</Link> · <Link href={`/product/${p.slug}`} target="_blank" className="text-indigo-700">View on shop ↗</Link></p>
      <h1 className="text-2xl font-bold">{p.name}</h1>
      <ProductForm action={saveProduct} error={e} p={{ id: p.id, weightGrams: p.weightGrams, name: p.name, slug: p.slug, brand: p.brand, category: p.category, price: p.price, mrp: p.mrp, stock: p.stock, featured: p.featured, active: p.active, priceOnRequest: p.priceOnRequest, description: p.description, highlights: arr(p.highlights), images: arr(p.images), videos: arr(p.videos ?? "[]") }} />
    </div>
  );
}
