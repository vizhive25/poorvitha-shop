import Link from "next/link";
import { requirePerm } from "@/lib/auth";
import ProductForm from "@/components/admin/ProductForm";
import { saveProduct } from "../../actions";

export const metadata = { title: "Add product" };

export default async function NewProduct({ searchParams }: { searchParams: Promise<{ e?: string }> }) {
  await requirePerm("products");
  const { e } = await searchParams;
  return (
    <div className="space-y-4">
      <p className="text-sm"><Link href="/admin/products" className="text-indigo-700">← Products</Link></p>
      <h1 className="text-2xl font-bold">Add product</h1>
      <ProductForm action={saveProduct} error={e} p={{ weightGrams: 300, name: "", slug: "", brand: "itel", category: "", price: 0, mrp: 0, stock: 0, featured: false, active: true, priceOnRequest: false, description: "", highlights: [], images: [] }} />
    </div>
  );
}
