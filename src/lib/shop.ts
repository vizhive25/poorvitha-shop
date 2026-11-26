// Client-safe shared types and helpers.
export type Category = { slug: string; name: string; blurb: string };
export type Product = {
  slug: string; name: string; brand: string; category: string;
  price: number; mrp: number; stock: number; featured?: boolean;
  highlights: string[]; description: string;
  priceOnRequest?: boolean; // no price set yet: shown as "Price on request", cannot be ordered
  images?: string[]; // files in public/products/, first is the main image
  videos?: string[]; // YouTube or Instagram post links, shown as embedded players on the product page
};

export const categories: Category[] = [
  { slug: "mobile-phones", name: "Mobile Phones", blurb: "Smartphones and keypad phones" },
  { slug: "smartwatches", name: "Smartwatches", blurb: "Bluetooth calling & fitness watches" },
  { slug: "chargers-cables", name: "Chargers & Cables", blurb: "Fast chargers, car chargers, cables" },
  { slug: "wireless-audio", name: "Wireless Audio", blurb: "TWS earbuds & neckbands" },
  { slug: "wired-earphones", name: "Wired Earphones", blurb: "Earphones with mic" },
  { slug: "home-kitchen", name: "Home & Kitchen", blurb: "Induction stoves and infrared cooktops" },
  { slug: "solar-lights", name: "Solar Lights", blurb: "Rechargeable solar flood lights" },
  { slug: "smart-gadgets", name: "Smart Gadgets", blurb: "AI recorders and home appliances" },
  { slug: "speakers-powerbanks", name: "Speakers & Power Banks", blurb: "Bluetooth speakers and power banks" },
];

export const getCategory = (slug: string) => categories.find((c) => c.slug === slug);
/** Trims a product to what a product card needs, so listing pages don't ship long descriptions to the browser. */
export const slim = (p: Product): Product => ({ ...p, highlights: [], description: "", images: p.images?.slice(0, 1), videos: undefined });

/** Small (480px) copy of a catalogue photo, for cards and tiles. Other images (e.g. admin uploads) are returned unchanged. */
export const thumb = (src: string): string =>
  src.startsWith("/products/") && !src.startsWith("/products/_t/") ? `/products/_t/${src.slice("/products/".length)}.webp` : src;

/**
 * Turns a pasted YouTube or Instagram link into a safe embed address (anything else returns null).
 * Only these two sites are allowed, and the link itself is never used as the embed address.
 */
export function videoEmbed(url: string): { kind: "youtube" | "instagram"; src: string; link: string } | null {
  let u: URL;
  try { u = new URL(url.trim()); } catch { return null; }
  if (u.protocol !== "https:") return null;
  const host = u.hostname.replace(/^(www|m)\./, "");
  if (host === "youtu.be" || host === "youtube.com") {
    const m = host === "youtu.be" ? u.pathname.match(/^\/([\w-]{11})/) : (u.pathname.match(/^\/(?:shorts|embed|live)\/([\w-]{11})/) ?? (u.pathname === "/watch" ? ["", u.searchParams.get("v") ?? ""] : null));
    return m && /^[\w-]{11}$/.test(m[1]) ? { kind: "youtube", src: `https://www.youtube-nocookie.com/embed/${m[1]}`, link: `https://www.youtube.com/watch?v=${m[1]}` } : null;
  }
  if (host === "instagram.com") {
    const m = u.pathname.match(/^\/(?:[\w.]+\/)?(p|reel|tv)\/([\w-]+)/);
    return m ? { kind: "instagram", src: `https://www.instagram.com/${m[1]}/${m[2]}/embed`, link: `https://www.instagram.com/${m[1]}/${m[2]}/` } : null;
  }
  return null;
}

export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
