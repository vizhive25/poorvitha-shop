import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategory, inr } from "@/lib/shop";
import { getProductBySlug } from "@/lib/catalog";
import Gallery from "@/components/Gallery";
import AddToCart from "@/components/AddToCart";
import { site } from "@/config/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await getProductBySlug((await params).slug);
  return p ? { title: p.name, description: `${p.name} – ${p.highlights.join(", ")}. Buy at Poorvitha Mobiles.` } : {};
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = await getProductBySlug((await params).slug);
  if (!p) notFound();
  const cat = getCategory(p.category);
  const off = !p.priceOnRequest && p.mrp > p.price;
  const ld = {
    "@context": "https://schema.org", "@type": "Product", name: p.name, brand: { "@type": "Brand", name: p.brand }, description: p.description,
    ...(p.priceOnRequest ? {} : { offers: { "@type": "Offer", priceCurrency: "INR", price: p.price, availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", url: `${site.url}/product/${p.slug}`, seller: { "@type": "Organization", name: site.name } } }),
  };
  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <p className="mb-4 text-sm text-slate-500"><Link href="/">Home</Link> / <Link href={`/category/${p.category}`}>{cat?.name}</Link></p>
      <div className="grid gap-8 md:grid-cols-2">
        <Gallery p={p} />
        <div>
          <p className="text-xs uppercase text-slate-500">{p.brand}</p>
          <h1 className="text-2xl font-bold">{p.name}</h1>
          <div className="mt-3 flex items-baseline gap-3"><span className="text-3xl font-bold">{p.priceOnRequest ? "Price on request" : inr(p.price)}</span>{off && <span className="text-slate-400 line-through">{inr(p.mrp)}</span>}</div>
          {!p.priceOnRequest && <p className="text-xs text-slate-500">Inclusive of all taxes</p>}
          <ul className="mt-4 list-disc space-y-1 pl-5">{p.highlights.map((h) => <li key={h}>{h}</li>)}</ul>
          <p className="mt-4 text-slate-600">{p.description}</p>
          <p className={`mt-3 text-sm font-medium ${p.stock > 0 ? "text-green-700" : "text-red-600"}`}>{p.stock > 0 ? "In stock" : "Out of stock"}</p>
          {p.priceOnRequest ? (
            <div className="mt-4 rounded-xl border bg-indigo-50 p-4 text-sm">
              <p className="font-semibold">Call or message us for today&apos;s price and availability.</p>
              <p className="mt-1">{site.phones} · {site.email}</p>
              <a href={`https://wa.me/${site.whatsapp}?text=${encodeURIComponent("Hi, I'd like to know the price of " + p.name)}`} className="mt-3 inline-block rounded-lg bg-green-600 px-5 py-2 font-semibold text-white">Enquire on WhatsApp</a>
            </div>
          ) : <AddToCart product={p} />}
          <p className="mt-4 text-xs text-slate-500">Sold by {site.name}. Warranty as per brand policy. See <Link className="underline" href="/info/return-policy">return policy</Link>.</p>
        </div>
      </div>
    </div>
  );
}
