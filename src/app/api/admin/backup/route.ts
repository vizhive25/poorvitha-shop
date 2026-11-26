import { gzipSync } from "zlib";
import { db } from "@/lib/db";
import { apiUser } from "@/lib/auth";
import { audit } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Owner-only full backup: every table as JSON, gzipped. Restore with `npm run db:restore -- <file>` (see DEPLOY.md).
// Contains customer data and password hashes: keep the file private. ?images=0 leaves out uploaded photos (much smaller).
export async function GET(req: Request) {
  const user = await apiUser("staff");
  if (!user) return new Response("Unauthorized", { status: 401 });
  const withImages = new URL(req.url).searchParams.get("images") !== "0";
  await audit(user, "backup downloaded", withImages ? "full" : "without images");

  const [products, orders, notifications, users, auditLogs, images] = await Promise.all([
    db.product.findMany(), db.order.findMany(), db.notification.findMany(), db.user.findMany(), db.auditLog.findMany(),
    withImages ? db.uploadedImage.findMany() : Promise.resolve([]),
  ]);
  const data = {
    format: "poorvitha-backup-v1",
    takenAt: new Date().toISOString(),
    withImages,
    counts: { products: products.length, orders: orders.length, notifications: notifications.length, users: users.length, auditLogs: auditLogs.length, images: images.length },
    products, orders, notifications, users, auditLogs,
    images: images.map((i) => ({ ...i, data: Buffer.from(i.data).toString("base64") })),
  };
  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
  return new Response(new Uint8Array(gzipSync(JSON.stringify(data))), {
    headers: { "Content-Type": "application/gzip", "Content-Disposition": `attachment; filename="poorvitha-backup-${stamp}${withImages ? "" : "-noimages"}.json.gz"`, "Cache-Control": "no-store" },
  });
}
