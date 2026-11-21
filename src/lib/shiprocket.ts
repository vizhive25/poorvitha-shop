// Shiprocket API client (server-only). Endpoints and field names follow https://apidocs.shiprocket.in/
// Auth: an API user's email + password -> bearer token (cached in memory, refreshed on 401).
const BASE = process.env.SHIPROCKET_BASE_URL ?? "https://apiv2.shiprocket.in/v1/external"; // override is for local testing against a mock

export const shiprocketEnabled = () => !!(process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD && process.env.SHIPROCKET_PICKUP_LOCATION);

let cached: { token: string; at: number } | null = null;
const TOKEN_TTL = 8 * 24 * 3600 * 1000; // Shiprocket tokens last ~10 days; refresh earlier

async function login(force = false): Promise<string> {
  if (!force && cached && Date.now() - cached.at < TOKEN_TTL) return cached.token;
  const r = await fetch(`${BASE}/auth/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: process.env.SHIPROCKET_EMAIL, password: process.env.SHIPROCKET_PASSWORD }),
    signal: AbortSignal.timeout(15000),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok || !d.token) throw new Error(`Shiprocket login failed (${r.status}). Check SHIPROCKET_EMAIL / SHIPROCKET_PASSWORD (use the API user).`);
  cached = { token: d.token, at: Date.now() };
  return d.token;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function call(method: "GET" | "POST", path: string, body?: unknown): Promise<any> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const token = await login(attempt > 0);
    const r = await fetch(`${BASE}${path}`, {
      method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(25000),
    });
    if (r.status === 401 && attempt === 0) continue; // token expired: log in again once
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      const msg = d?.message || (d?.errors ? JSON.stringify(d.errors) : "") || `HTTP ${r.status}`;
      throw new Error(`Shiprocket ${path}: ${msg}`);
    }
    return d;
  }
  throw new Error("Shiprocket authentication failed");
}

export type ShipOrderInput = {
  orderId: string; createdAt: Date; payment: "COD" | "Prepaid";
  name: string; phone: string; email: string; address: string; city: string; state: string; pincode: string;
  items: { name: string; slug: string; qty: number; price: number }[];
  subtotal: number; shipping: number;
  weightKg: number; lengthCm: number; breadthCm: number; heightCm: number;
};

/** Creates the order in Shiprocket. Returns Shiprocket's order_id and shipment_id. */
export async function createShiprocketOrder(o: ShipOrderInput) {
  const first = o.name.trim().split(/\s+/);
  const d = await call("POST", "/orders/create/adhoc", {
    order_id: o.orderId,
    order_date: new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Kolkata", dateStyle: "short", timeStyle: "short" }).format(o.createdAt), // "YYYY-MM-DD HH:mm" in IST
    pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION,
    billing_customer_name: first[0],
    billing_last_name: first.slice(1).join(" "),
    billing_address: o.address,
    billing_city: o.city,
    billing_pincode: Number(o.pincode),
    billing_state: o.state,
    billing_country: "India",
    billing_email: o.email || process.env.SHIPROCKET_FALLBACK_EMAIL || process.env.SHOP_EMAIL || "orders@poorvithamobiles.example",
    billing_phone: Number(o.phone),
    shipping_is_billing: true,
    order_items: o.items.map((i) => ({ name: i.name, sku: i.slug, units: i.qty, selling_price: i.price })),
    payment_method: o.payment, // "COD" or "Prepaid"
    shipping_charges: o.shipping,
    sub_total: o.subtotal,
    length: o.lengthCm, breadth: o.breadthCm, height: o.heightCm, weight: o.weightKg,
  });
  if (!d.order_id || !d.shipment_id) throw new Error(`Shiprocket did not return an order: ${JSON.stringify(d).slice(0, 200)}`);
  return { orderId: Number(d.order_id), shipmentId: Number(d.shipment_id) };
}

/** Assigns a courier (Shiprocket auto-picks one per your account rules) and returns the AWB. */
export async function assignAwb(shipmentId: number) {
  const d = await call("POST", "/courier/assign/awb", { shipment_id: shipmentId });
  const data = d?.response?.data;
  if (d?.awb_assign_status !== 1 || !data?.awb_code) {
    throw new Error(`AWB not assigned: ${d?.message ?? d?.response?.data?.awb_assign_error ?? JSON.stringify(d).slice(0, 200)}`);
  }
  return { awb: String(data.awb_code), courier: String(data.courier_name ?? "") };
}

export async function requestPickup(shipmentId: number) {
  const d = await call("POST", "/courier/generate/pickup", { shipment_id: [shipmentId] });
  return String(d?.response?.data ?? d?.message ?? "Pickup requested");
}

export async function generateLabel(shipmentId: number): Promise<string | null> {
  const d = await call("POST", "/courier/generate/label", { shipment_id: [shipmentId] });
  return d?.label_created === 1 && d?.label_url ? String(d.label_url) : null;
}

/** Live tracking by AWB. */
export async function trackAwb(awb: string): Promise<{ status: string; activities: { date: string; activity: string; location: string }[] }> {
  const d = await call("GET", `/courier/track/awb/${encodeURIComponent(awb)}`);
  const td = d?.tracking_data ?? {};
  const st = td?.shipment_track?.[0]?.current_status ?? "";
  return { status: String(st), activities: (td?.shipment_track_activities ?? []).slice(0, 15).map((a: { date: string; activity: string; location: string }) => ({ date: a.date, activity: a.activity, location: a.location })) };
}

/** Cancels the order in Shiprocket (only possible before it is picked up). */
export async function cancelShiprocketOrder(shiprocketOrderId: number) {
  await call("POST", "/orders/cancel", { ids: [shiprocketOrderId] });
}

export const trackingUrl = (awb: string) => `https://shiprocket.co/tracking/${encodeURIComponent(awb)}`;

/** Maps Shiprocket's status text to our order status (or null to leave it). */
export function mapStatus(s: string): "SHIPPED" | "DELIVERED" | null {
  const t = s.toUpperCase();
  if (t === "DELIVERED") return "DELIVERED";
  if (/PICKED UP|IN TRANSIT|SHIPPED|OUT FOR DELIVERY|REACHED AT DESTINATION/.test(t)) return "SHIPPED";
  return null;
}
