import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { site } from "@/config/site";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} – ${site.tagline}`, template: `%s | ${site.name}` },
  description: site.description,
  openGraph: { siteName: site.name, type: "website", locale: "en_IN", title: site.name, description: site.description, images: [{ url: "/brand/logo.png", width: 900, height: 584, alt: site.name }] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const ld = { "@context": "https://schema.org", "@type": "Store", name: site.name, url: site.url, telephone: [site.phone, site.phone2], email: site.email, address: site.address };
  return (
    <html lang="en-IN">
      <body className={`${geist.variable} bg-slate-50 font-sans text-slate-900 antialiased`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
        {children}
      </body>
    </html>
  );
}
