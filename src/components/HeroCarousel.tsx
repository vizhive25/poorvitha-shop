"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export type Slide = { title: string; sub: string; href: string; cta: string; image: string; from: string; to: string };

export default function HeroCarousel({ slides }: { slides: Slide[] }) {
  const [i, setI] = useState(0);
  const [hover, setHover] = useState(false);    // pointer, touch or keyboard focus is on the banner
  const [stopped, setStopped] = useState(false); // the visitor pressed pause, or prefers reduced motion

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setStopped(true);
  }, []);
  useEffect(() => {
    if (hover || stopped) return;
    const t = setInterval(() => setI((x) => (x + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [hover, stopped, slides.length]);

  return (
    <section className="relative overflow-hidden rounded-3xl" aria-roledescription="carousel" aria-label="Featured offers"
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)} onBlur={() => setHover(false)}
      onTouchStart={() => setHover(true)} onTouchEnd={() => setTimeout(() => setHover(false), 8000)}>
      <div className="flex transition-transform duration-700 ease-out motion-reduce:transition-none" style={{ transform: `translateX(-${i * 100}%)` }} aria-live={stopped || hover ? "polite" : "off"}>
        {slides.map((s, n) => (
          <div key={s.title} className="grid min-w-full items-center gap-4 px-6 py-10 text-white md:grid-cols-2 md:px-14 md:py-14" style={{ background: `linear-gradient(120deg, ${s.from}, ${s.to})` }} aria-hidden={n !== i}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-white/70">Poorvitha Mobiles</p>
              <h2 className="mt-2 text-3xl font-extrabold leading-tight md:text-5xl">{s.title}</h2>
              <p className="mt-3 max-w-md text-white/85">{s.sub}</p>
              <Link href={s.href} tabIndex={n === i ? 0 : -1} className="mt-6 inline-block rounded-full bg-white px-7 py-3 font-semibold text-slate-900 shadow-lg transition hover:scale-105">{s.cta} →</Link>
            </div>
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.image} alt="" width={320} height={320} decoding="async" loading={n === 0 ? "eager" : "lazy"} fetchPriority={n === 0 ? "high" : undefined} className="floaty h-56 w-auto object-contain drop-shadow-2xl md:h-80" />
            </div>
          </div>
        ))}
      </div>
      <div className="absolute bottom-1 left-1/2 flex -translate-x-1/2 items-center">
        {slides.map((s, n) => (
          <button key={s.title} onClick={() => setI(n)} aria-label={`Go to slide ${n + 1}`} aria-current={n === i} className="flex h-11 w-6 items-center justify-center">
            <span className={`h-2 rounded-full transition-all ${n === i ? "w-6 bg-white" : "w-2 bg-white/50"}`} />
          </button>
        ))}
      </div>
      <button onClick={() => setStopped((v) => !v)} aria-label={stopped ? "Play slideshow" : "Pause slideshow"} className="absolute bottom-2 right-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-sm text-white backdrop-blur hover:bg-white/40">
        {stopped ? "▶" : "❚❚"}
      </button>
      <button aria-label="Previous slide" onClick={() => setI((i - 1 + slides.length) % slides.length)} className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 rounded-full bg-white/20 text-white backdrop-blur hover:bg-white/40 md:block">‹</button>
      <button aria-label="Next slide" onClick={() => setI((i + 1) % slides.length)} className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 rounded-full bg-white/20 text-white backdrop-blur hover:bg-white/40 md:block">›</button>
    </section>
  );
}
