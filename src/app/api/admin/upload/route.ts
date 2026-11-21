import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { apiUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const MIME: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };
const MAX = 3 * 1024 * 1024; // images live in the database, so keep them small (resize big photos first)

// Check the file's real bytes, not just the browser-supplied type.
function sniff(b: Buffer): string | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP") return "webp";
  return null;
}

export async function POST(req: Request) {
  if (!(await apiUser("products"))) return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (!TYPES[file.type]) return NextResponse.json({ error: "Only JPG, PNG or WebP images" }, { status: 400 });
  if (file.size > MAX) return NextResponse.json({ error: "Image must be under 3 MB. Resize or compress it first." }, { status: 400 });
  const buf = Buffer.from(await file.arrayBuffer());
  const ext = sniff(buf);
  if (!ext) return NextResponse.json({ error: "Not a valid image file" }, { status: 400 });
  const name = `${Date.now().toString(36)}-${randomBytes(4).toString("hex")}.${ext}`;
  await db.uploadedImage.create({ data: { name, mime: MIME[ext], size: buf.length, data: buf } });
  return NextResponse.json({ url: `/uploads/${name}` });
}
