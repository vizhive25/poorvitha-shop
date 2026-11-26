import { CartProvider } from "@/components/CartProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { existsSync } from "fs";
import path from "path";

// Drop a small (about 240px wide) logo at public/brand/logo-sm.png (transparent or dark background, roughly square or wide) and it appears in the header.
const hasLogo = () => existsSync(path.join(process.cwd(), "public", "brand", "logo-sm.png"));

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  const logo = hasLogo() ? "/brand/logo-sm.png" : undefined;
  return (
    <CartProvider>
      <Header logo={logo} />
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
      <Footer />
    </CartProvider>
  );
}
