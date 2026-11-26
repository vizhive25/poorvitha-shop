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
      <button disabled={disabled} onClick={() => add(product)} className="rounded-full border border-neutral-900 px-6 py-3 font-semibold text-neutral-900 hover:bg-neutral-100 disabled:opacity-40">Add to cart</button>
      <button disabled={disabled} onClick={() => { add(product); router.push("/checkout"); }} className="rounded-full bg-neutral-900 px-6 py-3 font-semibold text-white hover:bg-neutral-700 disabled:bg-neutral-300">Buy now</button>
    </div>
  );
}
