import { apiUser } from "@/lib/auth";
import { shiprocketDiagnose } from "@/lib/shiprocket";

export const dynamic = "force-dynamic";

// Owner-only check of the Shiprocket connection: /api/admin/shiprocket-test?pin=560023&cod=1
// Shows whether login works, what Shiprocket says about a PIN code, and whether the pickup nickname exists. No secrets are returned.
export async function GET(req: Request) {
  const user = await apiUser("staff");
  if (!user) return new Response("Unauthorized", { status: 401 });
  const u = new URL(req.url);
  const pin = (u.searchParams.get("pin") ?? "560023").replace(/\D/g, "").slice(0, 6);
  const cod = u.searchParams.get("cod") !== "0";
  return Response.json(await shiprocketDiagnose(pin, cod), { headers: { "Cache-Control": "no-store" } });
}
