"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requirePerm } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { loadStarterCatalogue } from "@/lib/starter";

/** Owner only: adds any starter products that are not in the database yet. Existing products are never changed. */
export async function importStarter() {
  const user = await requirePerm("staff");
  const r = await loadStarterCatalogue(db);
  await audit(user, "starter catalogue loaded", "", `${r.created} added of ${r.total}`);
  revalidatePath("/", "layout");
  redirect(`/admin/products?saved=1&bulk=${r.created}`);
}
