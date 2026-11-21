"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePerm } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { parseCsv } from "@/lib/csv";

export type BulkChange = {
  slug: string; name: string;
  old: { price: number; mrp: number; stock: number; active: boolean; priceOnRequest: boolean };
  next: { price: number; mrp: number; stock: number; active: boolean; priceOnRequest: boolean };
};
export type BulkState = { error?: string; changes?: BulkChange[]; problems?: string[]; unchanged?: number };

const MAX_ROWS = 500;
const yes = (v: string) => /^(y|yes|true|1)$/i.test(v.trim());
const no = (v: string) => /^(n|no|false|0)$/i.test(v.trim());
const num = (v: string) => (/^\d{1,9}(\.\d+)?$/.test(v.replace(/[,₹\s]/g, "")) ? Math.round(Number(v.replace(/[,₹\s]/g, ""))) : NaN);

/** Step 1: read the uploaded sheet and show exactly what would change. Nothing is saved. */
export async function previewBulk(_prev: BulkState, formData: FormData): Promise<BulkState> {
  await requirePerm("products");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a CSV file first." };
  if (file.size > 1_000_000) return { error: "That file is too large (max 1 MB)." };
  const rows = parseCsv(await file.text());
  if (rows.length < 2) return { error: "The file has no data rows." };
  if (rows.length - 1 > MAX_ROWS) return { error: `Too many rows (max ${MAX_ROWS} per upload).` };

  const head = rows[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const col = (n: string) => head.indexOf(n);
  if (col("slug") < 0) return { error: 'The first row must be a header with a "slug" column (download the sheet from the Products page and keep its headings).' };

  const changes: BulkChange[] = [], problems: string[] = [];
  let unchanged = 0;
  const seen = new Set<string>();
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r], line = r + 1, get = (n: string) => (col(n) >= 0 ? (row[col(n)] ?? "").trim() : "");
    const slug = get("slug");
    if (!slug) { problems.push(`Row ${line}: no slug.`); continue; }
    if (seen.has(slug)) { problems.push(`Row ${line}: ${slug} appears twice (only the first is used).`); continue; }
    seen.add(slug);
    const p = await db.product.findUnique({ where: { slug } });
    if (!p) { problems.push(`Row ${line}: no product with slug "${slug}".`); continue; }

    const old = { price: p.price, mrp: p.mrp, stock: p.stock, active: p.active, priceOnRequest: p.priceOnRequest };
    const next = { ...old };
    let bad = false;

    const sp = get("price");
    if (sp !== "") { const n = num(sp); if (!Number.isFinite(n) || n < 1 || n > 1_000_000) { problems.push(`Row ${line} (${slug}): price "${sp}" must be a number between 1 and 1,000,000.`); bad = true; } else { next.price = n; next.priceOnRequest = false; } }
    const sm = get("mrp");
    if (sm !== "") { const n = num(sm); if (!Number.isFinite(n) || n < 0 || n > 1_000_000) { problems.push(`Row ${line} (${slug}): mrp "${sm}" is not valid.`); bad = true; } else next.mrp = n; }
    const ss = get("stock");
    if (ss !== "") { const n = num(ss); if (!Number.isFinite(n) || n < 0 || n > 100_000) { problems.push(`Row ${line} (${slug}): stock "${ss}" must be 0 to 100,000.`); bad = true; } else next.stock = n; }
    const sl = get("live");
    if (sl !== "") { if (yes(sl)) next.active = true; else if (no(sl)) next.active = false; else { problems.push(`Row ${line} (${slug}): "live" must be yes or no.`); bad = true; } }
    const sr = get("price_on_request");
    if (sr !== "") { if (yes(sr)) next.priceOnRequest = true; else if (no(sr)) { if (next.price < 1) { problems.push(`Row ${line} (${slug}): set a price before turning off "price on request".`); bad = true; } else next.priceOnRequest = false; } else { problems.push(`Row ${line} (${slug}): "price_on_request" must be yes or no.`); bad = true; } }
    if (bad) continue;

    if (next.priceOnRequest) { next.price = 0; next.mrp = 0; }
    else {
      if (next.mrp < next.price) next.mrp = next.price; // an MRP below the selling price makes no sense; no fake discounts
    }
    if (JSON.stringify(old) === JSON.stringify(next)) { unchanged++; continue; }
    changes.push({ slug, name: p.name, old, next });
  }
  return { changes, problems, unchanged };
}

/** Step 2: save the previewed changes (re-validated against the database). */
export async function applyBulk(formData: FormData) {
  const user = await requirePerm("products");
  let list: BulkChange[] = [];
  try { list = JSON.parse(String(formData.get("changes") ?? "[]")); } catch {}
  if (!Array.isArray(list) || list.length > MAX_ROWS) redirect("/admin/products/bulk");
  let done = 0;
  for (const c of list) {
    const n = c?.next;
    if (!c?.slug || !n) continue;
    const price = Math.round(Number(n.price)), mrp = Math.round(Number(n.mrp)), stock = Math.round(Number(n.stock));
    if (![price, mrp, stock].every((v) => Number.isFinite(v) && v >= 0 && v <= 1_000_000) || (!n.priceOnRequest && price < 1)) continue;
    const before = await db.product.findUnique({ where: { slug: c.slug }, select: { price: true, stock: true } });
    if (!before) continue;
    await db.product.update({ where: { slug: c.slug }, data: { price: n.priceOnRequest ? 0 : price, mrp: n.priceOnRequest ? 0 : Math.max(mrp, price), stock, active: !!n.active, priceOnRequest: !!n.priceOnRequest } });
    await audit(user, "bulk update", c.slug, `price ${before.price}→${n.priceOnRequest ? 0 : price}, stock ${before.stock}→${stock}`);
    done++;
  }
  revalidatePath("/", "layout");
  redirect(`/admin/products?saved=1&bulk=${done}`);
}
