import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { site } from "@/config/site";

const pages: Record<string, { title: string; body: string[] }> = {
  about: { title: "About us", body: [
    `${site.name} is a retail store for mobile phones, accessories, smartwatches and wireless audio, serving customers across India.`,
    "We stock products from trusted brands and aim for fair prices, honest descriptions and responsive after-sales support.",
    `${site.gstin} · ${site.address}`] },
  contact: { title: "Contact us", body: [`Customer support: ${site.phones}`, `Email: ${site.email}`, `Address: ${site.address}`, `Hours: ${site.hours}`] },
  "shipping-policy": { title: "Shipping policy", body: [
    `Orders above ₹${site.freeShippingAbove} ship free; otherwise a flat ₹${site.shippingFee} fee applies.`,
    "Orders are usually dispatched within 1–2 business days. Delivery typically takes 3–7 business days depending on location.",
    "We will call to confirm Cash on Delivery orders before dispatch. (Timelines are indicative – owner to confirm.)"] },
  "return-policy": { title: "Returns & refunds", body: [
    "Defective, damaged or wrong items can be reported within 7 days of delivery for replacement or refund. (Period to be confirmed by owner.)",
    "Products must be unused with original packaging, accessories and invoice. Opening-video of the parcel is recommended for damage claims.",
    "Refunds are issued to the original payment method or by bank transfer for COD orders."] },
  warranty: { title: "Warranty", body: ["Products carry the manufacturer's warranty. Warranty service is provided by the brand's authorised service centres; we will help you with the process.", "Physical, liquid or tamper damage is not covered."] },
  "privacy-policy": { title: "Privacy policy", body: [
    `${site.name} collects your name, phone number, address and email only to process and deliver orders and to give support.`,
    "We do not sell your data. We share it only with delivery and payment partners as needed to fulfil your order.",
    `To request access or deletion of your data, contact ${site.email}. (Draft – have a legal professional review before launch.)`] },
  terms: { title: "Terms & conditions", body: [
    `By using this website you agree to purchase from ${site.name} under these terms. Prices and availability may change without notice; errors may be corrected and affected orders cancelled with a full refund.`,
    "Brand names and logos belong to their respective owners. Product images are indicative.",
    "Disputes are subject to the jurisdiction of courts in the city of our registered address. (Draft – legal review required.)"] },
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
      {p.body.map((t, i) => <p key={i} className="text-slate-700">{t}</p>)}
    </article>
  );
}
