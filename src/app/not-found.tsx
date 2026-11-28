import type { Metadata } from "next";
import Link from "next/link";
import NotFoundContent from "@/components/NotFoundContent";
import { site } from "@/config/site";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

// Site-wide fallback (pages outside the shop layout, such as unknown top-level addresses).
export default function NotFound() {
  return (
    <>
      <header className="border-b border-neutral-200 bg-white px-4 py-3">
        <Link href="/" className="text-xl font-extrabold tracking-tight">{site.name}</Link>
      </header>
      <main className="mx-auto max-w-7xl px-4"><NotFoundContent /></main>
    </>
  );
}
