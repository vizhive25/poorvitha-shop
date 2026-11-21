import Link from "next/link";
import { db } from "@/lib/db";
import { requirePerm } from "@/lib/auth";
import { site } from "@/config/site";
import { emailEnabled, smsEnabled } from "@/lib/notify";
import { razorpayEnabled } from "@/lib/razorpay";
import { shiprocketEnabled } from "@/lib/shiprocket";

export const metadata = { title: "Launch checklist" };

type Item = { ok: boolean | "warn"; title: string; fix?: string; href?: string };

export default async function Launch() {
  await requirePerm("staff");
  const env = process.env;
  const [total, live, onRequest, noImage, zeroStock, owners, users, priced] = await Promise.all([
    db.product.count(),
    db.product.count({ where: { active: true } }),
    db.product.count({ where: { active: true, priceOnRequest: true } }),
    db.product.count({ where: { active: true, images: "[]" } }),
    db.product.count({ where: { active: true, priceOnRequest: false, stock: 0 } }),
    db.user.count({ where: { role: "OWNER", active: true } }),
    db.user.count({ where: { active: true } }),
    db.product.findMany({ where: { priceOnRequest: false }, select: { price: true, mrp: true } }),
  ]);
  const discounts = priced.filter((p) => p.mrp > p.price).length;

  const business: Item[] = [
    { ok: /^https:\/\//.test(site.url) && !/localhost/.test(site.url), title: `Website address is ${site.url}`, fix: "Set NEXT_PUBLIC_SITE_URL to https://poorvithamobiles.com in the server settings and redeploy (it is fixed at build time)." },
    { ok: !/XXXX|Shop No\. XX/.test(site.address), title: "Shop address is filled in", fix: "Edit `address` in src/config/site.ts and redeploy." },
    { ok: !/X{4,}/.test(site.gstin), title: "GSTIN is filled in", fix: "Edit `gstin` in src/config/site.ts and redeploy." },
    { ok: !/\.example/.test(site.email), title: "Support email is real", fix: "Edit `email` in src/config/site.ts (use a mailbox that exists) and redeploy." },
    { ok: site.phone.length > 8, title: `Support phones: ${site.phones}` },
    { ok: onRequest === 0 ? true : "warn", title: `${onRequest} live products are still "price on request"`, fix: "Fine if intentional. Otherwise set prices.", href: "/admin/products/bulk" },
    { ok: discounts === 0 ? true : "warn", title: `${discounts} products show a "% off" (MRP above price)`, fix: "Only keep real MRPs. Check them in Products.", href: "/admin/products" },
    { ok: noImage === 0 ? true : "warn", title: `${noImage} live products have no photo`, fix: "Add photos in the product page.", href: "/admin/products" },
    { ok: zeroStock === 0 ? true : "warn", title: `${zeroStock} priced products have zero stock (shown as sold out)`, fix: "Set real stock numbers.", href: "/admin/products" },
    { ok: live > 0, title: `${live} of ${total} products are live` },
  ];

  const security: Item[] = [
    { ok: owners >= 1, title: "An Owner account exists", fix: "Sign in at /admin/login with the setup password to create it." },
    { ok: users >= 2 ? true : "warn", title: `${users} active staff account(s)`, fix: "Add a second person as backup in Staff.", href: "/admin/staff" },
    { ok: (env.ADMIN_SECRET?.length ?? 0) >= 32, title: "ADMIN_SECRET is long (32+ characters)", fix: "Set a 64-character random value and redeploy (everyone will have to sign in again)." },
    { ok: !(env.ADMIN_PASSWORD && owners >= 1) ? true : "warn", title: "One-time setup password removed after creating the Owner", fix: "Delete ADMIN_PASSWORD from the server settings (it is not needed once the Owner exists)." },
    { ok: !(env.ADMIN_RESET_EMAIL || env.ADMIN_RESET_PASSWORD), title: "Owner-recovery settings are removed", fix: "Delete ADMIN_RESET_EMAIL and ADMIN_RESET_PASSWORD from the server settings." },
  ];

  const keyId = env.RAZORPAY_KEY_ID ?? "";
  const integrations: Item[] = [
    { ok: razorpayEnabled() && keyId.startsWith("rzp_live_") ? true : "warn", title: !razorpayEnabled() ? "Online payment is OFF (Cash on Delivery only)" : keyId.startsWith("rzp_live_") ? "Razorpay is in LIVE mode" : "Razorpay is in TEST mode", fix: "Use live keys at launch." },
    { ok: razorpayEnabled() ? !!env.RAZORPAY_WEBHOOK_SECRET : "warn", title: "Razorpay webhook secret is set", fix: "Add the webhook in Razorpay and set RAZORPAY_WEBHOOK_SECRET." },
    { ok: shiprocketEnabled() && !!env.SHIPROCKET_WEBHOOK_TOKEN ? true : "warn", title: !shiprocketEnabled() ? "Shiprocket is not connected" : env.SHIPROCKET_WEBHOOK_TOKEN ? "Shiprocket connected, webhook token set" : "Shiprocket connected, webhook token missing", fix: "Set the SHIPROCKET_* values." },
    { ok: emailEnabled() && !!env.OWNER_EMAIL ? true : "warn", title: !emailEnabled() ? "Customer email is OFF" : env.OWNER_EMAIL ? "Customer email on, owner alerts on" : "Customer email on, but no OWNER_EMAIL for new-order alerts", fix: "Set the SMTP_* values and OWNER_EMAIL." },
    { ok: smsEnabled() ? true : "warn", title: smsEnabled() ? "SMS is on" : "SMS is off (optional, needs DLT approval)" },
  ];

  const icon = (ok: boolean | "warn") => (ok === true ? <span className="text-green-600">✔</span> : ok === "warn" ? <span className="text-amber-600">▲</span> : <span className="text-red-600">✖</span>);
  const section = (title: string, items: Item[]) => (
    <section className="rounded-2xl border bg-white p-5 shadow-sm">
      <h2 className="mb-2 font-bold">{title}</h2>
      <ul className="divide-y text-sm">
        {items.map((i) => (
          <li key={i.title} className="flex gap-3 py-2">
            <span className="w-5 shrink-0 text-center">{icon(i.ok)}</span>
            <span>{i.title}{i.ok !== true && i.fix ? <span className="block text-xs text-slate-500">{i.fix} {i.href && <Link href={i.href} className="text-indigo-700 underline">Open</Link>}</span> : null}</span>
          </li>))}
      </ul>
    </section>
  );
  const bad = [...business, ...security, ...integrations].filter((i) => i.ok === false).length;
  return (
    <div className="max-w-3xl space-y-4">
      <h1 className="text-2xl font-bold">Launch checklist</h1>
      <p className={`rounded-lg px-3 py-2 text-sm ${bad === 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{bad === 0 ? "No blocking problems found. Review the ▲ warnings, then follow the go-live list in DEPLOY.md." : `${bad} item(s) marked ✖ should be fixed before launch.`}</p>
      {section("Business and catalogue", business)}
      {section("Security and access", security)}
      {section("Payments, shipping and messages", integrations)}
      <p className="text-xs text-slate-500">This page checks the settings of the server it runs on, so open it on the live site, not on your PC. It cannot test things like backups or that data survives a redeploy: do those by hand (see DEPLOY.md).</p>
    </div>
  );
}
