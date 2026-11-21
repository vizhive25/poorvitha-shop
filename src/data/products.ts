import { itelProducts } from "./itel";
import { extraProducts } from "./extra";
import { brandProducts } from "./brands";
// Seed catalogue based on product types listed at thegadgetcart.com / brand sites.
// PRICES, MRP & STOCK ARE INDICATIVE – owner must verify before going live.
import type { Product } from "../lib/shop";

const p = (
  slug: string, name: string, brand: string, category: string, price: number, mrpPct: number,
  highlights: string[], description: string, featured = false, stock = 25
// No invented "was" prices: mrpPct is ignored on purpose, so no fake discounts are ever shown.
): Product => ({ slug, name, brand, category, price, mrp: price, stock, featured, highlights, description });

// Product photos: drop files named <slug>.jpg (or .png/.webp) in public/products/
// and list the slug -> extension here. Products not listed show a placeholder.
const images: Record<string, string> = {
  "oraimo-ocd-115cc-magnetic-cable": "jpg",
  "oraimo-silkline-ocd-115cl": "jpg",
  "oraimo-ocd-175cc-100w": "webp",
  "oraimo-fastline-2-ocd-154cc": "jpg",
  "noise-buds-r1": "png", // Noise "Buds R1 Gaana Edition" photo – verify
  "noise-airwave-neckband": "png",
  "noise-airwave-pro-neckband": "png",
  "noise-crest-neckband": "png", // Noise "Airwave Crest" photo
};

const rawProducts: Product[] = [
  p("itel-2165s-keypad", "itel 2165S Keypad Phone", "itel", "mobile-phones", 999, 12, ["1200 mAh battery", "Dual SIM", "Torch & FM"], "Reliable keypad phone for calls and backup use."),
  p("itel-isw-32-smartwatch", "itel ISW 32 Bluetooth Smartwatch", "itel", "smartwatches", 1719, 40, ["Rectangular dial", "Bluetooth calling", "Black strap"], "Bright rectangular display smartwatch."),
  p("itel-alpha-2-pro-isw-o33", "itel Alpha 2 Pro ISW-O33 Smartwatch", "itel", "smartwatches", 1399, 40, ["Bluetooth calling", "Fitness modes", "Blue"], "Calling smartwatch with fitness tracking."),
  p("oraimo-osw-11n", "Oraimo OSW-11N Smartwatch", "Oraimo", "smartwatches", 1219, 40, ["Android compatible", "Black strap", "Activity tracking"], "Value smartwatch from Oraimo."),
  p("oraimo-osw-32n", "Oraimo OSW-32N Smartwatch", "Oraimo", "smartwatches", 1719, 40, ["Rectangular dial", "Black strap", "Bluetooth"], "Rectangular smartwatch with a comfortable strap."),
  p("oraimo-ocd-115cc-magnetic-cable", "Oraimo Magnetic Type-C to Lightning Cable (60W, 1m)", "Oraimo", "chargers-cables", 199, 80, ["60W fast charging", "1 metre", "Self-aligning magnetic"], "Magnetic cable for quick, tidy charging."),
  p("oraimo-silkline-ocd-115cl", "Oraimo SilkLine C to Lightning 20W 1m", "Oraimo", "chargers-cables", 299, 60, ["20W", "1 metre", "Durable braid"], "Smooth, tangle-resistant cable."),
  p("oraimo-ocd-175cc-100w", "Oraimo 100W C to C LED Cable 1.5m", "Oraimo", "chargers-cables", 249, 80, ["100W ultra-fast", "1.5 metres", "LED indicator"], "High-power USB-C cable with LED indicator.", true),
  p("oraimo-fastline-2-ocd-154cc", "Oraimo FastLine 2 C to C 3A 1.5m", "Oraimo", "chargers-cables", 119, 100, ["3A fast charging", "1.5 metres", "USB-C to USB-C"], "Budget USB-C to USB-C fast charging cable."),
  p("itel-fast-konnect-icw-201i", "itel Fast Konnect ICW-201I 20W Charger", "itel", "chargers-cables", 489, 60, ["20W", "USB-C", "Fast charging"], "Compact 20W wall charger.", true),
  p("itel-car-charger-icc-201", "itel Car Charger ICC-201", "itel", "chargers-cables", 339, 60, ["Dual port", "Car use", "Compact"], "Charge two devices on the go."),
  p("itel-cable-c22n", "itel C22N Type-C Cable 1m", "itel", "chargers-cables", 79, 100, ["Type-C", "1 metre", "2.4A"], "Everyday Type-C charging cable."),
  p("itel-buds-air-pro-rhythm", "itel Buds Air Pro – Rhythm", "itel", "wireless-audio", 659, 100, ["Up to 10 hrs playtime", "TWS", "Black"], "True wireless earbuds for daily listening."),
  p("noise-buds-r1", "Noise Buds R1", "Noise", "wireless-audio", 1299, 80, ["TWS", "Environmental noise cancellation (ENC)", "Clear calls"], "Noise earbuds tuned for calls and music."),
  p("noise-crest-neckband", "Noise Crest Bluetooth Neckband", "Noise", "wireless-audio", 1199, 60, ["Up to 50 hrs", "ENC", "Bluetooth"], "Long-lasting neckband."),
  p("noise-airwave-neckband", "Noise Airwave Bluetooth Neckband", "Noise", "wireless-audio", 999, 60, ["Up to 50 hrs", "ENC", "Bluetooth"], "Light neckband for all-day use."),
  p("noise-airwave-pro-neckband", "Noise Airwave Pro Neckband with Mic", "Noise", "wireless-audio", 1499, 60, ["Up to 60 hrs", "ANC", "Built-in mic"], "Premium neckband with ANC."),
  p("itel-neck-earphone-ieb-65", "itel IEB-65 Type-C Neck Earphone", "itel", "wired-earphones", 821, 40, ["USB Type-C", "In-ear", "With mic"], "Type-C wired neck earphone."),
  p("itel-e61-wired", "itel E61 Wired Earphones", "itel", "wired-earphones", 309, 60, ["Wired", "Mic", "Mobile & laptop"], "Wired earphones for phones and laptops."),
  p("itel-e51-wired", "itel E51 Wired Earphones", "itel", "wired-earphones", 199, 60, ["In-ear", "Mic", "Lightweight"], "Basic wired earphones."),
  p("oraimo-obs-52d-speaker", "Oraimo OBS-52D Portable Bluetooth Speaker", "Oraimo", "speakers-powerbanks", 1301, 60, ["2.0 channel", "Portable", "Black"], "Portable Bluetooth speaker."),
  p("oraimo-obs-92d-speaker", "Oraimo OBS-92D Bluetooth Speaker", "Oraimo", "speakers-powerbanks", 2219, 50, ["2.1 channel", "Deep bass", "Bluetooth"], "Room-filling 2.1 speaker.", true),
  p("itel-powerbank-t157", "itel Power Bank T157 (10,000 mAh)", "itel", "speakers-powerbanks", 859, 70, ["10,000 mAh", "Multiple outputs", "Compact"], "Carry power with you.", true),
];

export const products: Product[] = [
  ...extraProducts,
  ...brandProducts,
  ...itelProducts,
  ...rawProducts.map((x) => (images[x.slug] ? { ...x, images: [`/products/${x.slug}.${images[x.slug]}`] } : x)),
];

