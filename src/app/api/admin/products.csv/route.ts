import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { csvCell } from "@/lib/csv";

export const dynamic = "force-dynamic";

// Spreadsheet of all products for bulk editing. Re-upload it at Admin → Products → Bulk update.
export async function GET(req: Request) {
  const user = await apiUser("products");
  if (!user) return new Response("Unauthorized", { status: 401 });
  const onlyMissing = new URL(req.url).searchParams.get("missing") === "1";
  const rows = await db.product.findMany({ where: onlyMissing ? { priceOnRequest: true } : {}, orderBy: [{ brand: "asc" }, { name: "asc" }] });
  await audit(user, "products exported", onlyMissing ? "missing prices" : "all");
  const head = ["slug", "name", "brand", "category", "price", "mrp", "stock", "live", "price_on_request"];
  const lines = rows.map((p) => [p.slug, p.name, p.brand, p.category, p.priceOnRequest ? "" : p.price, p.priceOnRequest ? "" : p.mrp, p.stock, p.active ? "yes" : "no", p.priceOnRequest ? "yes" : "no"]);
  const csv = [head, ...lines].map((r) => r.map(csvCell).join(",")).join("\r\n");
  return new Response("﻿" + csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="products${onlyMissing ? "-missing-prices" : ""}.csv"` } });
}
