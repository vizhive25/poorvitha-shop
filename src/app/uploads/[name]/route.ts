import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Serves photos uploaded in the admin. They are stored in the database, so they survive redeploys and are backed up with it.
export async function GET(req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!/^[a-z0-9-]+\.(jpg|png|webp)$/.test(name)) return new Response("Not found", { status: 404 });
  const img = await db.uploadedImage.findUnique({ where: { name }, select: { mime: true, data: true, createdAt: true } });
  if (!img) return new Response("Not found", { status: 404 });
  const etag = `"${name}"`;
  if (req.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers: { ETag: etag } });
  return new Response(new Uint8Array(img.data), { headers: { "Content-Type": img.mime, "Cache-Control": "public, max-age=31536000, immutable", ETag: etag, "X-Content-Type-Options": "nosniff" } });
}
