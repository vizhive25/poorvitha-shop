"use client";
import { useState } from "react";
import { categories } from "@/lib/shop";

export type FormProduct = {
  id?: number; weightGrams: number; name: string; slug: string; brand: string; category: string; price: number; mrp: number; stock: number;
  featured: boolean; active: boolean; priceOnRequest: boolean; description: string; highlights: string[]; images: string[]; videos: string[];
};

const inp = "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm";

export default function ProductForm({ p, action, error }: { p: FormProduct; action: (fd: FormData) => void; error?: string }) {
  const [images, setImages] = useState<string[]>(p.images);
  const [por, setPor] = useState(p.priceOnRequest);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true); setMsg("");
    const added: string[] = [];
    for (const f of Array.from(files)) {
      const fd = new FormData(); fd.append("file", f);
      const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const d = await r.json().catch(() => ({}));
      if (r.ok) added.push(d.url); else setMsg(`${f.name}: ${d.error ?? "upload failed"}`);
    }
    setImages((x) => [...x, ...added].slice(0, 12));
    setBusy(false);
  }
  const move = (i: number, d: number) => setImages((x) => { const y = [...x]; const j = i + d; if (j < 0 || j >= y.length) return y; [y[i], y[j]] = [y[j], y[i]]; return y; });
  const errs: Record<string, string> = { name: "Please enter a product name.", category: "Please choose a category.", slug: "That web address (slug) is already used by another product." };

  return (
    <form action={action} className="space-y-5 rounded-2xl border bg-white p-5 shadow-sm">
      {p.id && <input type="hidden" name="id" value={p.id} />}
      {error && <p role="alert" className="rounded bg-red-100 px-3 py-2 text-sm text-red-800">{errs[error] ?? "Could not save."}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium md:col-span-2">Name<input name="name" required defaultValue={p.name} className={inp} /></label>
        <label className="text-sm font-medium">Brand<input name="brand" defaultValue={p.brand} className={inp} /></label>
        <label className="text-sm font-medium">Category
          <select name="category" required defaultValue={p.category} className={inp}><option value="">Choose…</option>{categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select>
        </label>
        <label className="text-sm font-medium">Web address (slug)<input name="slug" defaultValue={p.slug} placeholder="auto from name" className={inp} /><span className="text-xs font-normal text-slate-500">Changing this changes the product&apos;s link.</span></label>
        <label className="text-sm font-medium">Stock<input name="stock" type="number" min={0} defaultValue={p.stock} className={inp} /></label>
        <label className="text-sm font-medium">Packed weight (grams)<input name="weightGrams" type="number" min={1} defaultValue={p.weightGrams} className={inp} /><span className="text-xs font-normal text-slate-500">Used to pre-fill the shipping weight.</span></label>
      </div>

      <fieldset className="rounded-lg border p-3">
        <legend className="px-1 text-sm font-semibold">Pricing (₹, inclusive of GST)</legend>
        <label className="mb-2 flex items-center gap-2 text-sm"><input type="checkbox" name="priceOnRequest" checked={por} onChange={(e) => setPor(e.target.checked)} /> Price on request (customers enquire instead of ordering)</label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium">Selling price<input name="price" type="number" min={0} defaultValue={p.price} disabled={por} className={inp} /></label>
          <label className="text-sm font-medium">MRP (shown struck through; leave equal to price for no discount)<input name="mrp" type="number" min={0} defaultValue={p.mrp} disabled={por} className={inp} /></label>
        </div>
      </fieldset>

      <label className="block text-sm font-medium">Video links (optional, one per line)<textarea name="videos" rows={3} defaultValue={p.videos.join("\n")} placeholder="https://www.youtube.com/watch?v=…  or  https://www.instagram.com/reel/…" className={inp} /><span className="mt-1 block text-xs font-normal text-slate-500">Only YouTube and Instagram post links work. They show as players on the product page. Use the brand&apos;s own official posts.</span></label>
      <label className="block text-sm font-medium">Key features (one per line)<textarea name="highlights" rows={5} defaultValue={p.highlights.join("\n")} className={inp} /></label>
      <label className="block text-sm font-medium">Description<textarea name="description" rows={4} defaultValue={p.description} className={inp} /></label>

      <div>
        <p className="text-sm font-medium">Images <span className="font-normal text-slate-500">(first image is the main one)</span></p>
        <input type="hidden" name="images" value={JSON.stringify(images)} />
        <div className="mt-2 flex flex-wrap gap-3">
          {images.map((u, i) => (
            <div key={u + i} className="w-28 rounded-lg border p-1 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt="" className="h-24 w-full rounded bg-white object-contain" />
              <div className="mt-1 flex justify-center gap-1 text-xs">
                <button type="button" onClick={() => move(i, -1)} className="rounded border px-1.5" aria-label="Move earlier">←</button>
                <button type="button" onClick={() => move(i, 1)} className="rounded border px-1.5" aria-label="Move later">→</button>
                <button type="button" onClick={() => setImages(images.filter((_, j) => j !== i))} className="rounded border border-red-300 px-1.5 text-red-700" aria-label="Remove">✕</button>
              </div>
            </div>))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy} onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />
          {busy && <span>Uploading…</span>}
          {msg && <span className="text-red-700">{msg}</span>}
        </div>
        <p className="mt-1 text-xs text-slate-500">JPG, PNG or WebP, up to 3 MB each, max 12 images. Square images on a plain background look best.</p>
      </div>

      <div className="flex flex-wrap gap-6 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" name="active" defaultChecked={p.active} /> Live on the shop</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="featured" defaultChecked={p.featured} /> Featured</label>
      </div>
      <button disabled={busy} className="rounded-lg bg-indigo-700 px-6 py-2 font-semibold text-white disabled:bg-slate-400">Save product</button>
    </form>
  );
}
