import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { audit } from "@/lib/audit";
import { can, endSession, requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: { default: "Admin", template: "%s | Admin" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

async function logout() {
  "use server";
  const u = await requireAdmin({ allowMustChange: true });
  await audit(u, "logout");
  await endSession();
  redirect("/admin/login");
}

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const u = await requireAdmin({ allowMustChange: true });
  const link = "rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-100";
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-3">
          <Link href="/admin" className="mr-4 font-extrabold text-indigo-800">Poorvitha Admin</Link>
          <Link href="/admin" className={link}>Dashboard</Link>
          {can(u.role, "products") && <Link href="/admin/products" className={link}>Products</Link>}
          <Link href="/admin/orders" className={link}>Orders</Link>
          {can(u.role, "staff") && <Link href="/admin/staff" className={link}>Staff</Link>}
          {can(u.role, "staff") && <Link href="/admin/activity" className={link}>Activity</Link>}
          {can(u.role, "staff") && <Link href="/admin/backups" className={link}>Backups</Link>}
          {can(u.role, "staff") && <Link href="/admin/launch" className={link}>Launch</Link>}
          <Link href="/" target="_blank" className={`${link} ml-auto`}>View shop ↗</Link>
          <Link href="/admin/account" className={link} title={u.email}>{u.name} · {u.role.toLowerCase()}</Link>
          <form action={logout}><button className={`${link} text-red-700`}>Log out</button></form>
        </div>
      </header>
      {u.mustChangePassword && <p className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-900">Please <Link href="/admin/account" className="font-semibold underline">choose your own password</Link> before continuing.</p>}
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
