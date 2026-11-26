import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { site } from "@/config/site";

// A line starting with "## " is a heading; every other line is a paragraph.
// Legal pages are drafts written from standard Indian e-commerce practice (Consumer Protection (E-Commerce) Rules 2020,
// DPDP Act 2023). Owner to confirm the business facts and have a professional review them.
const UPDATED = "26 November 2026";
const pages: Record<string, { title: string; body: string[] }> = {
  about: { title: "About us", body: [
    `${site.name} is a retail store for mobile phones, accessories, smartwatches, audio, home & kitchen products, solar lights and smart gadgets, serving customers across India.`,
    "We stock products from trusted brands and aim for fair prices, honest descriptions and responsive after-sales support.",
    "## Seller details",
    `Business name: ${site.name}`, `${site.gstin}`, `Address: ${site.address}`, `Phone: ${site.phones}`, `Email: ${site.email}`, `Hours: ${site.hours}`] },

  contact: { title: "Contact us", body: [
    `Customer support: ${site.phones}`, `Email: ${site.email}`, `Address: ${site.address}`, `Hours: ${site.hours}`,
    "When you write about an order, please include your order ID and the mobile number used on the order so we can help you faster.",
    "For complaints, see our Grievance redressal page (/info/grievance)."] },

  "shipping-policy": { title: "Shipping policy", body: [
    `Last updated: ${UPDATED}`,
    "## Where we deliver",
    "We deliver to serviceable PIN codes across India. We do not ship outside India.",
    "## Shipping charges",
    `Orders of ₹${site.freeShippingAbove} and above ship free. For orders below ₹${site.freeShippingAbove} a flat shipping fee of ₹${site.shippingFee} applies. The fee is shown at checkout before you pay.`,
    "## Dispatch and delivery time",
    "Orders are usually dispatched within 1–2 business days after confirmation. Delivery typically takes 3–7 business days after dispatch, depending on your location. These are estimates; delays can occur because of courier issues, weather, public holidays or events beyond our control.",
    "## Cash on Delivery",
    "We may call or message you to confirm a Cash on Delivery order before dispatch. If we cannot reach you or you decline to confirm, the order may be cancelled. Please keep the exact amount ready at delivery.",
    "## Tracking",
    "Once your order is shipped you will receive an email (if you gave one) and can track it at /track using your order ID.",
    "## Receiving your parcel",
    "Please check that the parcel is sealed and undamaged before accepting it. If it looks tampered with or damaged, refuse it or tell the courier and us immediately. We recommend recording a short video while opening the parcel."] },

  "return-policy": { title: "Returns, refunds & cancellation", body: [
    `Last updated: ${UPDATED}`,
    "## Cancellation",
    "You can cancel an order before it is dispatched by calling or emailing us with your order ID. Once an order is dispatched it cannot be cancelled, but you may still refuse delivery or use the return process below if eligible. If you paid online and the order is cancelled before dispatch, the full amount is refunded.",
    "## What can be returned",
    "You can request a replacement or refund within 7 days of delivery if the product is defective, damaged in transit, not working on arrival, or not the item you ordered. Please contact us within this period with your order ID and clear photos or a video showing the problem.",
    "## What cannot be returned",
    "We do not accept returns for change of mind, or for products with physical damage, liquid damage, burn marks or tampering after delivery, or products returned without original packaging, accessories or invoice. Items that are hygiene-sensitive once opened (for example earphones) can be returned only if defective.",
    "## How a return works",
    "1) Contact us within 7 days of delivery. 2) We review your request, usually within 2 business days, and may ask for photos or a video. 3) If approved, we arrange pickup or tell you how to send the product back. 4) After we receive and inspect the product we send a replacement or issue a refund.",
    "## Refunds",
    "Refunds for online payments go back to the original payment method (UPI, card, net banking or wallet) within 5–7 business days of approval; your bank may take extra time to show it. For Cash on Delivery orders, we refund by bank transfer or UPI to the details you give us, within 5–7 business days of approval.",
    "## Failed or double payments",
    "If money was debited but your order was not confirmed, it is normally returned automatically by your bank or payment provider within 5–7 business days. If not, contact us with your payment reference and we will help."] },

  warranty: { title: "Warranty", body: [
    `Last updated: ${UPDATED}`,
    "Products carry the manufacturer's warranty where applicable; the warranty period is printed on the box or the manufacturer's warranty card (and in the product features where the brand states it). If you are unsure, ask us before you buy. Warranty service is provided by the brand's authorised service centres, and we will help you with the process.",
    "Please keep your invoice and the original packaging. The invoice is usually needed as proof of purchase for warranty claims.",
    "Physical, liquid, burn or tamper damage, damage from misuse, and normal wear are not covered.",
    "A product that is dead on arrival or damaged in transit is handled under our Returns policy, not the warranty."] },

  "privacy-policy": { title: "Privacy policy", body: [
    `Last updated: ${UPDATED}`,
    `${site.name} ("we") respects your privacy. This policy explains what we collect, why, and your choices.`,
    "## What we collect",
    "When you place an order we collect your name, mobile number, delivery address, PIN code, city, state, and optionally your email. We also keep the order details (items, amounts, payment method and status). Our server records technical data such as IP address for security and to prevent abuse.",
    "## Why we use it",
    "We use your information to process and deliver your order, send order updates, give support, handle returns and refunds, prevent fraud, and meet legal and tax obligations.",
    "## Payments",
    "Online payments are processed by Razorpay. Your card, UPI or bank details are entered on Razorpay's secure page and are never stored on our servers. We receive only the payment status and reference.",
    "## Who we share it with",
    "We share what is needed with delivery and logistics partners (for example Shiprocket and courier companies) to deliver your order, with Razorpay to process payments, and with our email service to send order emails. We do not sell your personal data. We may disclose information if the law requires it.",
    "## Cookies",
    "We use only essential storage in your browser, for example to keep your shopping cart. We do not use advertising cookies.",
    "## How long we keep it",
    "We keep order records for as long as needed for accounting, tax and legal purposes, and delete or anonymise other data when it is no longer needed.",
    "## Your rights",
    `You can ask to see, correct or delete your personal data, or withdraw consent, by writing to ${site.email} or calling ${site.phone}. We may need to keep some records where the law requires it.`,
    "## Security",
    "We use reasonable security measures, including encrypted connections (HTTPS) and restricted staff access. No system is completely secure, so please protect your own devices and details.",
    "## Changes and complaints",
    "We may update this policy and will change the date above. For privacy concerns, contact our Grievance Officer (see /info/grievance)."] },

  terms: { title: "Terms & conditions", body: [
    `Last updated: ${UPDATED}`,
    `By using this website and placing an order you agree to these terms. The website is operated by ${site.name}, ${site.address}.`,
    "## Orders",
    "Placing an order is an offer to buy. We confirm it by email or phone, and a contract is formed when we accept your order and dispatch it. We may decline or cancel an order, for example if stock is not available, the price was shown wrongly, we cannot verify the order, or we cannot deliver to your area. If you have already paid, we refund the full amount.",
    "## Prices and payment",
    "All prices are in Indian Rupees (₹) and include applicable taxes unless stated. Shipping charges, if any, are shown at checkout. Prices and availability can change without notice. You can pay online (UPI, cards, net banking, wallets) or by Cash on Delivery where offered.",
    "## Products",
    "We try to describe and picture products accurately, but images are indicative and manufacturers may change specifications, colours or packaging. Brand names and logos belong to their respective owners and are used only to identify products.",
    "## Delivery, returns and warranty",
    "Delivery, returns, refunds and warranty are governed by our Shipping policy, Returns policy and Warranty page, which form part of these terms.",
    "## Your responsibilities",
    "Please give accurate details and use the website lawfully. Do not place fake or abusive orders or try to disrupt the site. We may block orders that look fraudulent.",
    "## Liability",
    "To the extent the law allows, our liability for any order is limited to the amount you paid for it. We are not liable for delays or failures caused by events beyond our reasonable control.",
    "## Governing law",
    "These terms are governed by Indian law. Disputes are subject to the courts of Bengaluru, Karnataka, without affecting any rights you have under consumer protection law.",
    "## Complaints",
    "See our Grievance redressal page for how to raise a complaint."] },

  grievance: { title: "Grievance redressal", body: [
    `Last updated: ${UPDATED}`,
    "If you have a complaint about an order, a product, payment, or how we handle your data, please contact our Grievance Officer.",
    `Grievance Officer: ${site.grievanceOfficer}`, `${site.name}, ${site.address}`, `Email: ${site.email}`, `Phone: ${site.phones} (${site.hours})`,
    "We acknowledge every complaint within 48 hours and aim to resolve it within one month of receiving it. Please include your order ID, mobile number and a short description.",
    "You may also approach the National Consumer Helpline (1915) or consumerhelpline.gov.in."] },
};

export const generateStaticParams = () => Object.keys(pages).map((page) => ({ page }));
export async function generateMetadata({ params }: { params: Promise<{ page: string }> }): Promise<Metadata> {
  const p = pages[(await params).page]; return p ? { title: p.title } : {};
}
export default async function Info({ params }: { params: Promise<{ page: string }> }) {
  const p = pages[(await params).page];
  if (!p) notFound();
  return (
    <article className="max-w-2xl space-y-3">
      <h1 className="text-2xl font-bold">{p.title}</h1>
      {p.body.map((t, i) => t.startsWith("## ")
        ? <h2 key={i} className="pt-3 text-lg font-semibold">{t.slice(3)}</h2>
        : <p key={i} className="text-slate-700">{t}</p>)}
    </article>
  );
}
