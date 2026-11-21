import { NextResponse } from "next/server";
import { getProductsBySlugs } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const slugs = (new URL(req.url).searchParams.get("slugs") ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 50);
  return NextResponse.json({ products: slugs.length ? await getProductsBySlugs(slugs) : [] });
}
