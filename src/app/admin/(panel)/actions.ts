"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { notifyOrder, type OrderEvent } from "@/lib/notify";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePerm } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { categories } from "@/lib/shop";
import { ORDER_STATUSES } from "@/lib/orders";


const int = (v: FormDataEntryValue | null, min = 0, max = 10_000_000) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;
};
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
const str = (v: FormDataEntryValue | null, max = 2000) => String(v ?? "").trim().slice(0, max);

export async function saveProduct(formData: FormData) {
  const user = await requirePerm("products");
  const id = Number(formData.get("id")) || 0;
  const name = str(formData.get("name"), 200);
  const category = str(formData.get("category"), 60);
  if (!name) redirect(`/admin/products/${id || "new"}?e=name`);
  if (!categories.some((c) => c.slug === category)) redirect(`/admin/products/${id || "new"}?e=category`);

  let images: string[] = [];
  try { const v = JSON.parse(str(formData.get("images"), 20000)); if (Array.isArray(v)) images = v.map(String).filter((u) => u.startsWith("/") || u.startsWith("https://")).slice(0, 12); } catch {}
  const highlights = str(formData.get("highlights"), 4000).split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 12);
  const priceOnRequest = formData.get("priceOnRequest") === "on";

  const data = {
    name,
    slug: slugify(str(formData.get("slug"), 100)) || slugify(name),
    brand: str(formData.get("brand"), 60) || "itel",
    category,
    price: priceOnRequest ? 0 : int(formData.get("price")),
    mrp: priceOnRequest ? 0 : Math.max(int(formData.get("mrp")), int(formData.get("price"))),
    stock: int(formData.get("stock")),
    weightGrams: int(formData.get("weightGrams"), 1, 200000) || 300,
    featured: formData.get("featured") === "on",
    active: formData.get("active") === "on",
    priceOnRequest,
    description: str(formData.get("description"), 4000),
    highlights: JSON.stringify(highlights),
    images: JSON.stringify(images),
  };

  try {
    const before = id ? await db.product.findUnique({ where: { id }, select: { price: true, stock: true, active: true } }) : null;
    if (id) await db.product.update({ where: { id }, data });
    else await db.product.create({ data: { ...data, sortOrder: -Math.floor(Date.now() / 1000) } }); // newest first
    await audit(user, id ? "product edited" : "product created", data.slug, before ? `price ${before.price}→${data.price}, stock ${before.stock}→${data.stock}, live ${before.active}→${data.active}` : `price ${data.price}, stock ${data.stock}`);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") redirect(`/admin/products/${id || "new"}?e=slug`);
    throw e;
  }
  revalidatePath("/", "layout");
  redirect("/admin/products?saved=1");
}

export async function quickUpdate(formData: FormData) {
  const user = await requirePerm("products");
  const id = Number(formData.get("id"));
  if (!id) return;
  const priceOnRequest = formData.get("priceOnRequest") === "on";
  const price = priceOnRequest ? 0 : int(formData.get("price"));
  const cur = await db.product.findUnique({ where: { id }, select: { mrp: true, slug: true, price: true, stock: true, active: true } });
  await db.product.update({
    where: { id },
    data: { price, mrp: priceOnRequest ? 0 : Math.max(cur?.mrp ?? 0, price), stock: int(formData.get("stock")), active: formData.get("active") === "on", priceOnRequest },
  });
  await audit(user, "product quick-edit", cur?.slug ?? String(id), `price ${cur?.price}→${price}, stock ${cur?.stock}→${int(formData.get("stock"))}, live ${cur?.active}→${formData.get("active") === "on"}`);
  revalidatePath("/", "layout");
  redirect("/admin/products?saved=1" + (formData.get("q") ? `&q=${encodeURIComponent(String(formData.get("q")))}` : ""));
}

export async function deleteProduct(formData: FormData) {
  const user = await requirePerm("products");
  const id = Number(formData.get("id"));
  const gone = id ? await db.product.findUnique({ where: { id }, select: { slug: true } }) : null;
  if (id) await db.product.delete({ where: { id } }).catch(() => {});
  if (gone) await audit(user, "product deleted", gone.slug);
  revalidatePath("/", "layout");
  redirect("/admin/products?deleted=1");
}

export async function setOrderStatus(formData: FormData) {
  const user = await requirePerm("orders");
  const id = Number(formData.get("id"));
  const status = str(formData.get("status"), 20);
  if (!id || !(ORDER_STATUSES as readonly string[]).includes(status)) return;
  let changed = "", from = "";
  await db.$transaction(async (tx) => {
    const o = await tx.order.findUnique({ where: { id } });
    if (!o || o.status === status || o.status === "CANCELLED") return; // cancelled orders are final
    if (status === "CANCELLED") {
      // Put the stock back.
      const items: { slug: string; qty: number }[] = JSON.parse(o.items);
      for (const it of items) await tx.product.updateMany({ where: { slug: it.slug }, data: { stock: { increment: it.qty } } });
    }
    await tx.order.update({ where: { id }, data: { status } });
    changed = o.orderId;
    from = o.status;
  });
  if (changed) await audit(user, "order status", changed, `${from} → ${status}`);
  if (changed && (status === "CANCELLED" || status === "DELIVERED")) { const ev: OrderEvent = status === "CANCELLED" ? "cancelled" : "delivered"; after(() => notifyOrder(changed, ev)); }
  redirect(`/admin/orders/${id}?saved=1`);
}

export async function saveOrderNotes(formData: FormData) {
  const user = await requirePerm("orders");
  const id = Number(formData.get("id"));
  if (id) { const o = await db.order.update({ where: { id }, data: { notes: str(formData.get("notes"), 2000) }, select: { orderId: true } }); await audit(user, "order notes", o.orderId); }
  redirect(`/admin/orders/${id}?saved=1`);
}

export async function resendMessages(formData: FormData) {
  const user = await requirePerm("orders");
  const id = Number(formData.get("id"));
  const ev = str(formData.get("event"), 20) as OrderEvent;
  const o = id ? await db.order.findUnique({ where: { id }, select: { orderId: true } }) : null;
  if (!o || !["confirmed", "shipped", "delivered", "cancelled"].includes(ev)) return;
  await notifyOrder(o.orderId, ev, { force: true });
  await audit(user, "resent message", o.orderId, ev);
  redirect(`/admin/orders/${id}?saved=1`);
}
