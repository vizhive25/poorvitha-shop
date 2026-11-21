// Products supplied by the owner (itel product decks and images).
// No prices were supplied, so these are "price on request" until the owner sets them:
// replace `priceOnRequest: true, price: 0, mrp: 0` with real numbers to enable ordering.
import type { Product } from "../lib/shop";

const img = (slug: string, n: number) => Array.from({ length: n }, (_, i) => `/products/itel/${slug}-${i + 1}.webp`);
const base = { brand: "itel", stock: 25, price: 0, mrp: 0, priceOnRequest: true } as const;

export const extraProducts: Product[] = [
  {
    ...base, slug: "itel-induction-stove-1400w", name: "itel Induction Stove 1400W", category: "home-kitchen", featured: true,
    highlights: ["1400W power, 8 power levels", "7 smart Indian cooking modes + Warm and Manual", "Preset timer functions", "Auto pan detection & automatic shut-off", "Overheat and high/low voltage protection", "Crystal glass plate, push-button controls, digital display", "1 year warranty"],
    description: "Powerful 1400W induction stove built for Indian cooking: deep-fry, pressure cook, soup, heat milk, idli, curry and roti modes, with utensil sensing, self-diagnosis error codes and a live input-voltage display.",
    images: img("itel-induction-stove-1400w", 5),
  },
  {
    ...base, slug: "itel-infrared-cooktop-2200w", name: "itel Infrared Cooktop 2200W with BBQ Grill", category: "home-kitchen", featured: true,
    highlights: ["2200W high-power heating", "5 power modes from 100W to 2200W", "4-digit LED display, all-touch keys and knob", "Programmable timer & auto shut-off", "Free BBQ grill in the box", "Works with copper, aluminium, stainless steel and ceramic cookware", "Crystal glass top, stainless-steel frame, portable handles", "1 year warranty"],
    description: "Flame-free 2200W infrared cooktop with flexible power modes, a clear LED display and an included BBQ grill for paneer, skewers, vegetables and chicken.",
    images: img("itel-infrared-cooktop-2200w", 5),
  },
  {
    ...base, slug: "itel-solar-light-4-panel", name: "itel Solar Light (4-panel, 60W)", category: "solar-lights",
    highlights: ["Built-in 6V 3W solar panel", "3.7V 4800mAh 18650 battery, easily replaceable", "USB output charging (5V 1A)", "Light source up to 60W", "Two brightness levels and burst flash", "Flashlight function", "3 to 6 hours working time"],
    description: "Rechargeable solar flood light with a built-in solar panel, replaceable battery cell, flashlight mode and USB output to charge your phone.",
    images: img("itel-solar-light-4-panel", 1),
  },
  {
    ...base, slug: "itel-solar-light-single-panel", name: "itel Solar Light (single panel, 60W)", category: "solar-lights",
    highlights: ["Built-in 6V 3W solar panel", "3.7V 4800mAh 18650 battery", "10W charging power", "Light source up to 60W", "Two brightness levels and burst flash", "3 to 6 hours working time"],
    description: "Portable solar light with a wide LED panel, two brightness levels and a burst-flash function.",
    images: img("itel-solar-light-single-panel", 1),
  },
  {
    ...base, slug: "itel-car-charger-icc-ca451", name: "itel Drive X 451 Dual-Port 45W Car Charger (ICC-CA451)", category: "chargers-cables",
    highlights: ["45W maximum combined output", "USB-C PD 25W + USB-A QC 3.0 20W", "Over-current and over-voltage protection", "Textured grip with blue LED indicators", "Wide device compatibility"],
    description: "Dual-port fast car charger that charges two compatible devices together while you drive.",
    images: img("itel-car-charger-icc-ca451", 3),
  },
  {
    ...base, slug: "itel-65w-type-c-cable", name: "itel 65W Turbo Charge Type-C to Type-C Cable", category: "chargers-cables",
    highlights: ["65W max charging, 3A", "480Mbps data transfer", "Durable nylon-braided cable", "Built-in cable clip"],
    description: "Braided USB-C to USB-C cable for fast charging up to 65W.",
    images: img("itel-65w-type-c-cable", 1),
  },
  {
    ...base, slug: "itel-100w-type-c-cable", name: "itel 100W Turbo Charge Type-C Cable 1.5m", category: "chargers-cables",
    highlights: ["100W max fast charging, 5A", "1.5 metre length", "480Mbps data transfer", "Durable nylon-braided cable"],
    description: "High-power 100W USB-C to USB-C braided cable.",
    images: img("itel-100w-type-c-cable", 1),
  },
  {
    ...base, slug: "itel-beatz-e30", name: "itel Beatz E30 Type-C Wired Earphones", category: "wired-earphones",
    highlights: ["14mm large driver for extra bass", "Type-C port", "Single-button control with collar clip", "Tangle-free crystal-pattern cable"],
    description: "Stylish wired earphones with a Type-C connector and big 14mm drivers.",
    images: img("itel-beatz-e30", 1),
  },
  {
    ...base, slug: "itel-beatz-e16", name: "itel Beatz E16 Wired Earphones", category: "wired-earphones",
    highlights: ["10mm bass boost driver", "3.5mm jack", "Easy control button with integrated collar clip", "Tangle-free durable cable"],
    description: "Sleek metal-finish earphones with powerful bass and in-line control.",
    images: img("itel-beatz-e16", 1),
  },
  {
    ...base, slug: "itel-roar35-ultra", name: "itel Roar 35 Ultra Neckband", category: "wireless-audio",
    highlights: ["Up to 40 hours playtime*", "10mm dynamic driver", "IPX4 water resistance", "6 months warranty"],
    description: "Bluetooth neckband with long playtime and splash resistance.",
    images: img("itel-roar35-ultra", 1),
  },
];
