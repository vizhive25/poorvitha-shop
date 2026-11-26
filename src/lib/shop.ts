// Client-safe shared types and helpers.
export type Category = { slug: string; name: string; blurb: string };
export type Product = {
  slug: string; name: string; brand: string; category: string;
  price: number; mrp: number; stock: number; featured?: boolean;
  highlights: string[]; description: string;
  priceOnRequest?: boolean; // no price set yet: shown as "Price on request", cannot be ordered
  images?: string[]; // files in public/products/, first is the main image
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
export const slim = (p: Product): Product => ({ ...p, highlights: [], description: "", images: p.images?.slice(0, 1) });

export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
