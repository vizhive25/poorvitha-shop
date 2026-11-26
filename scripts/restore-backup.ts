// Restores a backup made by Admin → Backups into an EMPTY database (run `prisma migrate deploy` first).
//   npm run db:restore -- path/to/poorvitha-backup-....json.gz
// Refuses to run if the database already has products, orders or users, so it can never overwrite live data.
import { readFileSync } from "fs";
import { gunzipSync } from "zlib";
import { PrismaClient } from "@prisma/client";

const file = process.argv[2];
const db = new PrismaClient();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dates = (rows: any[]) => rows.map((r) => { const o = { ...r }; for (const k of Object.keys(o)) if (/(At|Date)$/.test(k) && typeof o[k] === "string") o[k] = new Date(o[k]); return o; });

(async () => {
  if (!file) { console.error("Usage: npm run db:restore -- <backup file .json.gz>"); process.exit(1); }
  const raw = readFileSync(file);
  const d = JSON.parse((raw[0] === 0x1f && raw[1] === 0x8b ? gunzipSync(raw) : raw).toString("utf8"));
  if (d.format !== "poorvitha-backup-v1") { console.error("This is not a Poorvitha backup file."); process.exit(1); }
  const [p, o, u] = await Promise.all([db.product.count(), db.order.count(), db.user.count()]);
  if (p || o || u) { console.error(`Database is not empty (${p} products, ${o} orders, ${u} users). Restore only into a fresh, empty database.`); process.exit(1); }

  console.log("Backup taken:", d.takenAt, d.counts);
  await db.user.createMany({ data: dates(d.users) });
  await db.product.createMany({ data: dates(d.products) });
  await db.order.createMany({ data: dates(d.orders) });
  await db.notification.createMany({ data: dates(d.notifications) });
  await db.auditLog.createMany({ data: dates(d.auditLogs) });
  for (const i of d.images ?? []) await db.uploadedImage.create({ data: { ...dates([i])[0], data: Buffer.from(i.data, "base64") } });
  console.log("Restore complete.");
  await db.$disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
