import { db } from "@/lib/db";
import { requirePerm } from "@/lib/auth";

export const metadata = { title: "Backups" };
export const dynamic = "force-dynamic";

export default async function Backups() {
  await requirePerm("staff");
  const [last, products, orders, images] = await Promise.all([
    db.auditLog.findFirst({ where: { action: "backup downloaded" }, orderBy: { createdAt: "desc" } }),
    db.product.count(), db.order.count(), db.uploadedImage.count(),
  ]);
  const days = last ? Math.floor((Date.now() - last.createdAt.getTime()) / 86400000) : null;
  const btn = "inline-block rounded-lg px-4 py-2 text-sm font-semibold";
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">Backups</h1>
      <div className={`rounded-2xl border p-4 text-sm ${days === null || days > 7 ? "border-amber-300 bg-amber-50 text-amber-900" : "border-emerald-300 bg-emerald-50 text-emerald-900"}`}>
        {last ? <>Last backup downloaded <b>{last.createdAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</b> by {last.userEmail} ({days === 0 ? "today" : `${days} day${days === 1 ? "" : "s"} ago`}).{days! > 7 && " It is time for a new one."}</> : <>No backup has been downloaded yet.</>}
      </div>
      <div className="space-y-3 rounded-2xl border bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-600">One file with everything in the shop: {products} products, {orders} orders, staff accounts, activity log and {images} uploaded photos.</p>
        <div className="flex flex-wrap gap-2">
          <a href="/api/admin/backup" className={`${btn} bg-indigo-700 text-white`}>Download full backup</a>
          <a href="/api/admin/backup?images=0" className={`${btn} border`}>Without photos (smaller)</a>
        </div>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
          <li><b>Do this every week</b>, and after any big catalogue change. Keep the file in your email or Google Drive, not only on the shop computer.</li>
          <li>The file holds customer names, phones and addresses and staff password hashes. Keep it private.</li>
          <li>Restoring needs a developer: see &ldquo;Backups&rdquo; in DEPLOY.md. It only works into an empty database.</li>
        </ul>
      </div>
    </div>
  );
}
