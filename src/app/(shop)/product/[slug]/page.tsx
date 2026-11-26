import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategory, inr } from "@/lib/shop";
import { getProductBySlug } from "@/lib/catalog";
import Gallery from "@/components/Gallery";
import AddToCart from "@/components/AddToCart";
import { site } from "@/config/site";
import { WhatsAppIcon } from "@/components/Icons";

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
      <p className="mb-4 text-sm text-neutral-500"><Link href="/" className="hover:text-neutral-900">Home</Link> / <Link href={`/category/${p.category}`} className="hover:text-neutral-900">{cat?.name}</Link></p>
      <div className="grid gap-8 md:grid-cols-2">
        <Gallery p={p} />
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">{p.brand}</p>
          <h1 className="mt-1 text-2xl font-extrabold leading-tight tracking-tight md:text-3xl">{p.name}</h1>
          <div className="mt-3 flex items-baseline gap-3"><span className="text-3xl font-extrabold tracking-tight">{p.priceOnRequest ? "Price on request" : inr(p.price)}</span>{off && <><span className="text-neutral-400 line-through">{inr(p.mrp)}</span><span className="rounded-full bg-neutral-900 px-2 py-0.5 text-xs font-semibold text-white">{Math.round(((p.mrp - p.price) / p.mrp) * 100)}% off</span></>}</div>
          {!p.priceOnRequest && <p className="text-xs text-neutral-500">Inclusive of all taxes</p>}
          <ul className="mt-4 list-disc space-y-1 pl-5">{p.highlights.map((h) => <li key={h}>{h}</li>)}</ul>
          <p className="mt-4 text-neutral-600">{p.description}</p>
          <p className={`mt-3 text-sm font-medium ${p.stock > 0 ? "text-emerald-700" : "text-red-600"}`}>{p.stock > 0 ? "In stock" : "Out of stock"}</p>
          {p.priceOnRequest ? (
            <div className="mt-4 rounded-2xl bg-neutral-100 p-4 text-sm">
              <p className="font-semibold">Call or message us for today&apos;s price and availability.</p>
              <p className="mt-1">{site.phones} · {site.email}</p>
              <a href={`https://wa.me/${site.whatsapp}?text=${encodeURIComponent("Hi, I'd like to know the price of " + p.name)}`} className="mt-3 inline-flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-2 font-semibold text-white hover:bg-neutral-700"><WhatsAppIcon />Enquire on WhatsApp</a>
            </div>
          ) : <AddToCart product={p} />}
          <p className="mt-4 text-xs text-neutral-500">Sold by {site.name}. Warranty as per brand policy. See <Link className="underline" href="/info/return-policy">return policy</Link>.</p>
        </div>
      </div>
    </div>
  );
}
