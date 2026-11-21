"use client";
import { useRouter } from "next/navigation";
import { useCart } from "./CartProvider";

import type { Product } from "@/lib/shop";

export default function AddToCart({ product }: { product: Product }) {
  const disabled = product.stock < 1;
  const { add } = useCart();
  const router = useRouter();
  return (
    <div className="mt-4 flex gap-3">
      <button disabled={disabled} onClick={() => add(product)} className="rounded-lg border border-indigo-700 px-5 py-3 font-semibold text-indigo-700 disabled:opacity-40">Add to cart</button>
      <button disabled={disabled} onClick={() => { add(product); router.push("/checkout"); }} className="rounded-lg bg-indigo-700 px-5 py-3 font-semibold text-white disabled:bg-slate-300">Buy now</button>
    </div>
  );
}
