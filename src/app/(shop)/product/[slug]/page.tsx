import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategory, inr, videoEmbed } from "@/lib/shop";
import { getProductBySlug } from "@/lib/catalog";
import Gallery from "@/components/Gallery";
import AddToCart from "@/components/AddToCart";
import { site } from "@/config/site";
import { WhatsAppIcon } from "@/components/Icons";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await getProductBySlug((await params).slug);
  if (!p) return {};
  // Keep the description search-friendly (about 155 characters) instead of pasting every feature.
  const tail = " Buy at Poorvitha Mobiles.";
  const feats = p.highlights.join(", ");
  const full = `${p.name} – ${feats}.`;
  const description = (full.length + tail.length > 160 ? full.slice(0, 160 - tail.length - 1).replace(/[\s,–-]+\S*$/, "") + "…" : full) + tail;
  const image = p.images?.[0];
  return {
    title: p.name,
    description,
    // Share previews (WhatsApp, Instagram, Facebook) show this product, not the shop logo.
    openGraph: { type: "website", siteName: site.name, locale: "en_IN", title: p.name, description, url: `/product/${p.slug}`, ...(image ? { images: [{ url: image, alt: p.name }] } : {}) },
    twitter: { card: image ? "summary_large_image" : "summary", title: p.name, description, ...(image ? { images: [image] } : {}) },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = await getProductBySlug((await params).slug);
  if (!p) notFound();
  const cat = getCategory(p.category);
  const off = !p.priceOnRequest && p.mrp > p.price;
  const ld = {
    "@context": "https://schema.org", "@type": "Product", name: p.name, brand: { "@type": "Brand", name: p.brand }, description: p.description, sku: p.slug,
    ...(p.images?.length ? { image: p.images.map((u) => (u.startsWith("http") ? u : `${site.url}${u}`)) } : {}),
    ...(p.priceOnRequest ? {} : { offers: { "@type": "Offer", priceCurrency: "INR", price: p.price, availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", url: `${site.url}/product/${p.slug}`, seller: { "@type": "Organization", name: site.name } } }),
  };
  const videos = (p.videos ?? []).map((v) => videoEmbed(v)).filter((v): v is NonNullable<ReturnType<typeof videoEmbed>> => !!v);
  const crumbs = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: site.url },
    { "@type": "ListItem", position: 2, name: cat?.name ?? "Shop", item: `${site.url}/category/${p.category}` },
    { "@type": "ListItem", position: 3, name: p.name, item: `${site.url}/product/${p.slug}` }] };
  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs).replace(/</g, "\\u003c") }} />
      <p className="mb-4 text-sm text-neutral-500"><Link href="/" className="hover:text-neutral-900">Home</Link> / <Link href={`/category/${p.category}`} className="hover:text-neutral-900">{cat?.name}</Link></p>
      {/* min-w-0: lets both columns shrink below their content width, so a long photo strip never widens the page on small phones. */}
      <div className="grid gap-8 md:grid-cols-2 [&>*]:min-w-0">
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
          {!p.priceOnRequest && (
            <ul className="mt-5 grid gap-2 rounded-2xl bg-neutral-100 p-4 text-sm sm:grid-cols-2">
              <li><b>Delivery:</b> dispatched in 1–2 business days, then 3–7 business days across India</li>
              <li><b>Shipping:</b> {p.price >= site.freeShippingAbove ? "Free on this item" : `Free above ₹${site.freeShippingAbove}, else ₹${site.shippingFee}`}</li>
              <li><b>Payment:</b> UPI, cards, net banking or Cash on Delivery</li>
              <li><b>Returns:</b> 7-day replacement for defects</li>
            </ul>
          )}
          <p className="mt-4 text-xs text-neutral-500">Sold by {site.name}. Manufacturer&apos;s warranty applies; the period is printed on the box or warranty card. See <Link className="underline" href="/info/return-policy">return policy</Link> and <Link className="underline" href="/info/warranty">warranty</Link>.</p>
        </div>
      </div>
      {videos.length > 0 && (
        <section className="mt-10" aria-label="Product videos">
          <h2 className="mb-3 text-xl font-extrabold tracking-tight">Watch it in action</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {videos.map((v) => (
              <div key={v.src} className={`overflow-hidden rounded-2xl bg-neutral-100 ${v.kind === "youtube" ? "aspect-video" : "mx-auto h-[560px] w-full max-w-[400px]"}`}>
                <iframe src={v.src} title={`${p.name} video`} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen className="h-full w-full border-0" />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
