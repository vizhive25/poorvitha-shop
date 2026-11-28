import Link from "next/link";
import { categories, slim, thumb } from "@/lib/shop";
import { listProducts } from "@/lib/catalog";
import HeroCarousel, { Slide } from "@/components/HeroCarousel";
import ProductRow from "@/components/ProductRow";
import Reveal from "@/components/Reveal";
import { site } from "@/config/site";
import { InstagramIcon, MapPinIcon, WhatsAppIcon } from "@/components/Icons";

const slideDefs = [
  { slug: "itel-a100", title: "Military-grade durability, everyday price", sub: "Shop the latest itel smartphones with big batteries and 90Hz displays.", href: "/category/mobile-phones", cta: "Shop phones", from: "#0a0a0a", to: "#3f3f46" },
  { slug: "itel-unicorn-max", title: "Smartwatches that keep up", sub: "AMOLED screens, Bluetooth calling and fitness tracking from ₹1,299.", href: "/category/smartwatches", cta: "Explore watches", from: "#0a0a0a", to: "#334155" },
  { slug: "itel-buds-ace-anc", title: "Hear more. Hear clearer.", sub: "ANC earbuds and long-life neckbands from itel and Noise.", href: "/category/wireless-audio", cta: "Shop audio", from: "#0a0a0a", to: "#57534e" },
  { slug: "oraimo-ocd-175cc-100w", title: "Charge faster, tangle-free", sub: "100W cables, 20W chargers and power banks for every device.", href: "/category/chargers-cables", cta: "Shop chargers", from: "#0a0a0a", to: "#3f3f46" },
];

export const dynamic = "force-dynamic";

export default async function Home() {
  const products = (await listProducts()).map(slim);
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const slides: Slide[] = slideDefs.flatMap((d) => {
    const p = bySlug.get(d.slug);
    return p?.images?.[0] ? [{ ...d, image: p.images[0] }] : [];
  });
  const withImg = products.filter((p) => p.images?.length);
  const marquee = withImg.filter((_, i) => i % 2 === 0).slice(0, 24);
  const byCat = (slug: string, n = 12) => products.filter((p) => p.category === slug).slice(0, n);
  const catImg = (slug: string) => products.find((p) => p.category === slug && p.images?.length)?.images?.[0];

  const brands = [...products.reduce((m, p) => m.set(p.brand, (m.get(p.brand) ?? 0) + 1), new Map<string, number>())].sort((a, b) => b[1] - a[1]).slice(0, 14);
  const count = (slugs: string[]) => products.filter((p) => slugs.includes(p.category)).length;
  const sub = (slugs: string[], tag: string) => `${count(slugs)} products · ${tag}`;
  const ask = `https://wa.me/${site.whatsapp}?text=${encodeURIComponent("Hi Poorvitha Mobiles, I'm looking for: ")}`;

  return (
    <div className="space-y-16">
      <h1 className="sr-only">{site.name} – mobiles, accessories, smartwatches and audio, delivered across India</h1>
      {slides.length > 0 && <HeroCarousel slides={slides} />}

      <Reveal>
        <div className="grid grid-cols-2 divide-x divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 text-center text-sm font-medium md:grid-cols-4 md:divide-y-0">
          {[["Free delivery", `On orders above ₹${site.freeShippingAbove}`], ["Cash on Delivery", "Pay when it arrives"], ["Brand warranty", "Genuine products"], ["Easy replacement", "7 days for defects"]].map(([t, d]) => (
            <div key={t} className="p-4"><p className="font-semibold">{t}</p><p className="mt-0.5 text-xs font-normal text-neutral-500">{d}</p></div>
          ))}
        </div>
      </Reveal>

      <Reveal>
        <div className="mb-5"><h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">Shop by category</h2><p className="mt-0.5 text-sm text-neutral-500">Everything for your phone, wrist, ears and home</p></div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
          {categories.map((c) => (
            <Link key={c.slug} href={`/category/${c.slug}`} className="group overflow-hidden rounded-2xl bg-neutral-100 p-4 text-center transition hover:bg-neutral-200">
              <div className="flex h-24 items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {catImg(c.slug) && <img src={thumb(catImg(c.slug)!)} alt="" width={96} height={96} loading="lazy" decoding="async" className="max-h-24 object-contain mix-blend-multiply transition group-hover:scale-110" />}
              </div>
              <p className="mt-2 text-sm font-semibold">{c.name}</p>
            </Link>
          ))}
        </div>
      </Reveal>

      <Reveal>
        <div className="mb-5 flex items-end justify-between"><div><h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">Popular brands</h2><p className="mt-0.5 text-sm text-neutral-500">Genuine products with manufacturer warranty</p></div><Link href="/shop" className="rounded-full border border-neutral-900 px-4 py-1.5 text-sm font-semibold hover:bg-neutral-900 hover:text-white">See all</Link></div>
        <div className="no-scrollbar -mx-4 flex gap-5 overflow-x-auto px-4 pb-1">
          {brands.map(([b]) => (
            <Link key={b} href={`/shop?brand=${encodeURIComponent(b)}`} className="group flex w-20 shrink-0 flex-col items-center gap-2 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 text-xl font-extrabold transition group-hover:bg-neutral-900 group-hover:text-white">{b.charAt(0).toUpperCase()}</span>
              <span className="text-xs font-medium uppercase tracking-wide">{b}</span>
            </Link>
          ))}
        </div>
      </Reveal>

      <Reveal><ProductRow title="Latest smartphones" subtitle={sub(["mobile-phones"], "big batteries, honest prices")} href="/category/mobile-phones" items={byCat("mobile-phones")} /></Reveal>

      <Reveal>
        <div className="overflow-hidden rounded-3xl bg-neutral-950 py-6">
          <p className="mb-4 px-6 text-sm font-semibold uppercase tracking-widest text-neutral-400">Browse the range</p>
          <div className="flex w-max gap-6 marquee">
            {[...marquee, ...marquee].map((p, n) => (
              <Link key={p.slug + n} href={`/product/${p.slug}`} {...(n >= marquee.length ? { "aria-hidden": true, tabIndex: -1 } : {})} className="flex h-40 w-40 shrink-0 items-center justify-center rounded-2xl bg-white/95 p-3 transition hover:scale-105">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumb(p.images![0])} alt={p.name} width={160} height={160} loading="lazy" decoding="async" className="max-h-full max-w-full object-contain" />
              </Link>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal><ProductRow title="Smartwatches" subtitle={sub(["smartwatches"], "AMOLED, calling, fitness")} href="/category/smartwatches" items={byCat("smartwatches")} /></Reveal>
      <Reveal><ProductRow title="Audio & earphones" subtitle={sub(["wireless-audio", "wired-earphones"], "earbuds, neckbands, wired")} href="/category/wireless-audio" items={byCat("wireless-audio")} /></Reveal>
      <Reveal><ProductRow title="Home & kitchen" subtitle={sub(["home-kitchen"], "everyday appliances")} href="/category/home-kitchen" items={byCat("home-kitchen")} /></Reveal>
      <Reveal><ProductRow title="Solar lights" subtitle={sub(["solar-lights"], "no electricity bill")} href="/category/solar-lights" items={byCat("solar-lights")} /></Reveal>
      <Reveal><ProductRow title="Smart gadgets & home" subtitle={sub(["smart-gadgets"], "make your home smarter")} href="/category/smart-gadgets" items={byCat("smart-gadgets")} /></Reveal>
      <Reveal><ProductRow title="Chargers, cables & power" subtitle={sub(["chargers-cables", "speakers-powerbanks"], "fast charging essentials")} href="/category/chargers-cables" items={[...byCat("chargers-cables", 8), ...byCat("speakers-powerbanks", 4)]} /></Reveal>

      <Reveal>
        <section className="rounded-3xl bg-neutral-950 p-8 text-center text-white md:p-14">
          <h2 className="text-3xl font-extrabold tracking-tight md:text-4xl">Can&apos;t find it? We&apos;ll get it.</h2>
          <p className="mx-auto mt-3 max-w-xl text-neutral-300">Looking for a phone, accessory or gadget that isn&apos;t listed? Tell us what you need and we&apos;ll try to source it for you.</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <a href={ask} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-neutral-900 hover:bg-neutral-200"><WhatsAppIcon />Ask on WhatsApp</a>
            <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="rounded-full border border-white/40 px-6 py-3 font-semibold hover:bg-white/10">Call {site.phone}</a>
          </div>
          <p className="mt-4 text-sm text-neutral-400">{site.hours} · {site.address}</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
            <a href={site.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-neutral-300"><InstagramIcon />Follow us on Instagram · {site.instagramFollowers} followers</a>
            <a href={site.mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-neutral-300"><MapPinIcon />Find our shop on Google Maps</a>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
