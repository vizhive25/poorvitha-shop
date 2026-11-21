import type { MetadataRoute } from "next";
import { site } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/admin", "/checkout", "/cart", "/order-success"] }, sitemap: `${site.url}/sitemap.xml` };
}
