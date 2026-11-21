import Link from "next/link";
import { categories, inr } from "@/lib/shop";
import { listProducts } from "@/lib/catalog";
import HeroCarousel, { Slide } from "@/components/HeroCarousel";
import ProductRow from "@/components/ProductRow";
import Reveal from "@/components/Reveal";
import { site } from "@/config/site";

const slideDefs = [
  { slug: "itel-a100", title: "Military-grade durability, everyday price", sub: "Shop the latest itel smartphones with big batteries and 90Hz displays.", href: "/category/mobile-phones", cta: "Shop phones", from: "#312e81", to: "#7c3aed" },
  { slug: "itel-unicorn-max", title: "Smartwatches that keep up", sub: "AMOLED screens, Bluetooth calling and fitness tracking from ₹1,299.", href: "/category/smartwatches", cta: "Explore watches", from: "#0f172a", to: "#0e7490" },
  { slug: "itel-buds-ace-anc", title: "Hear more. Hear clearer.", sub: "ANC earbuds and long-life neckbands from itel and Noise.", href: "/category/wireless-audio", cta: "Shop audio", from: "#7f1d1d", to: "#ea580c" },
  { slug: "oraimo-ocd-175cc-100w", title: "Charge faster, tangle-free", sub: "100W cables, 20W chargers and power banks for every device.", href: "/category/chargers-cables", cta: "Shop chargers", from: "#064e3b", to: "#16a34a" },
];

export const dynamic = "force-dynamic";

export default async function Home() {
  const products = await listProducts();
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const slides: Slide[] = slideDefs.flatMap((d) => {
    const p = bySlug.get(d.slug);
    return p?.images?.[0] ? [{ ...d, image: p.images[0] }] : [];
  });
  const withImg = products.filter((p) => p.images?.length);
  const marquee = withImg.filter((_, i) => i % 2 === 0).slice(0, 24);
  const byCat = (slug: string, n = 12) => products.filter((p) => p.category === slug).slice(0, n);
  const catImg = (slug: string) => products.find((p) => p.category === slug && p.images?.length)?.images?.[0];

  return (
    <div className="space-y-14">
      {slides.length > 0 && <HeroCarousel slides={slides} />}

      <Reveal>
        <div className="grid gap-3 text-center text-sm font-medium md:grid-cols-4">
          {[["🚚", `Free delivery above ₹${site.freeShippingAbove}`], ["💵", "Cash on Delivery"], ["🛡️", "Brand warranty support"], ["🔁", "Easy replacement for defects"]].map(([i, t]) => (
            <div key={t} className="rounded-2xl border bg-white p-4 shadow-sm"><span className="mr-2 text-xl">{i}</span>{t}</div>
          ))}
        </div>
      </Reveal>

      <Reveal>
        <h2 className="mb-4 text-2xl font-extrabold">Shop by category</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
          {categories.map((c) => (
            <Link key={c.slug} href={`/category/${c.slug}`} className="group rounded-2xl border bg-gradient-to-b from-white to-indigo-50 p-4 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <div className="flex h-24 items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {catImg(c.slug) && <img src={catImg(c.slug)} alt="" loading="lazy" className="max-h-24 object-contain transition group-hover:scale-110" />}
              </div>
              <p className="mt-2 text-sm font-semibold">{c.name}</p>
            </Link>
          ))}
        </div>
      </Reveal>

      <Reveal><ProductRow title="Latest smartphones" href="/category/mobile-phones" items={byCat("mobile-phones")} /></Reveal>

      <Reveal>
        <div className="overflow-hidden rounded-3xl bg-slate-900 py-6">
          <p className="mb-4 px-6 text-sm font-semibold uppercase tracking-widest text-indigo-300">Browse the range</p>
          <div className="flex w-max gap-6 marquee">
            {[...marquee, ...marquee].map((p, n) => (
              <Link key={p.slug + n} href={`/product/${p.slug}`} className="flex h-40 w-40 shrink-0 items-center justify-center rounded-2xl bg-white/95 p-3 transition hover:scale-105">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.images![0]} alt={p.name} loading="lazy" className="max-h-full max-w-full object-contain" />
              </Link>
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal><ProductRow title="Smartwatches" href="/category/smartwatches" items={byCat("smartwatches")} /></Reveal>

      <Reveal>
        <section className="grid items-center gap-6 rounded-3xl bg-gradient-to-r from-amber-100 to-rose-100 p-8 md:grid-cols-2 md:p-12">
          <div>
            <h2 className="text-3xl font-extrabold">Brands you trust</h2>
            <p className="mt-2 text-slate-700">We stock itel, Oraimo, Noise, Ringme and Snexian — genuine products with manufacturer warranty, sold at fair prices.</p>
            <Link href="/shop" className="mt-5 inline-block rounded-full bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-slate-700">Browse all products</Link>
          </div>
          <div className="flex justify-around text-3xl font-black tracking-tight text-slate-800">
            <Link href="/shop?brand=itel">itel</Link><Link href="/shop?brand=Oraimo">oraimo</Link><Link href="/shop?brand=Noise">NOISE</Link><Link href="/shop?brand=Ringme">Ringme</Link><Link href="/shop?brand=Snexian">Snexian</Link>
          </div>
        </section>
      </Reveal>

      <Reveal><ProductRow title="Audio & earphones" href="/category/wireless-audio" items={byCat("wireless-audio")} /></Reveal>
      <Reveal><ProductRow title="Home & kitchen" href="/category/home-kitchen" items={byCat("home-kitchen")} /></Reveal>
      <Reveal><ProductRow title="Solar lights" href="/category/solar-lights" items={byCat("solar-lights")} /></Reveal>
      <Reveal><ProductRow title="Smart gadgets & home" href="/category/smart-gadgets" items={byCat("smart-gadgets")} /></Reveal>
      <Reveal><ProductRow title="Chargers, cables & power" href="/category/chargers-cables" items={[...byCat("chargers-cables", 8), ...byCat("speakers-powerbanks", 4)]} /></Reveal>

      <Reveal>
        <section className="rounded-3xl bg-indigo-800 p-8 text-center text-white md:p-12">
          <h2 className="text-2xl font-extrabold md:text-3xl">Need help choosing?</h2>
          <p className="mt-2 text-indigo-100">Call or visit {site.name} — {site.phones} · {site.hours}</p>
          <p className="mt-1 text-sm text-indigo-200">Phones from {inr(Math.min(...products.filter((p) => p.category === "mobile-phones").map((p) => p.price)))}</p>
        </section>
      </Reveal>
    </div>
  );
}
