import Link from "next/link";
import { site } from "@/config/site";
import { InstagramIcon, MapPinIcon } from "./Icons";

export default function Footer() {
  return (
    <footer className="mt-16 bg-neutral-950 text-sm text-neutral-400">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <p className="text-lg font-bold text-white">{site.name}</p>
          <p className="mt-2">{site.tagline}</p>
          <p className="mt-2">{site.gstin}</p>
        </div>
        <div>
          <p className="font-semibold text-white">Help</p>
          <ul className="mt-2 space-y-1">
            {[["about", "About us"], ["contact", "Contact us"], ["shipping-policy", "Shipping policy"], ["return-policy", "Returns & refunds"], ["warranty", "Warranty"], ["privacy-policy", "Privacy policy"], ["terms", "Terms & conditions"], ["grievance", "Grievance redressal"]].map(([s, l]) =>
              <li key={s}><Link href={`/info/${s}`} className="hover:text-white">{l}</Link></li>)}
            <li><Link href="/track" className="hover:text-white">Track your order</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-semibold text-white">Visit / contact</p>
          <p className="mt-2">{site.address}</p>
          <p className="mt-2"><a href={site.mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-white"><MapPinIcon />Find our shop on Google Maps</a></p>
          <p className="mb-2 mt-1"><a href={site.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-white"><InstagramIcon />Instagram {site.instagramHandle}</a></p>
          <p>Customer support:<br /><a href={`tel:${site.phone.replace(/\s/g, "")}`} className="hover:text-white">{site.phone}</a><br /><a href={`tel:${site.phone2.replace(/\s/g, "")}`} className="hover:text-white">{site.phone2}</a></p><p>{site.email}</p><p>{site.hours}</p>
        </div>
      </div>
      <p className="border-t border-neutral-800 py-4 text-center text-xs">© {new Date().getFullYear()} {site.name}. All rights reserved. Brand names belong to their respective owners.</p>
    </footer>
  );
}
