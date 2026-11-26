import { NextResponse } from "next/server";
import { razorpayEnabled } from "@/lib/razorpay";
import { site } from "@/config/site";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ onlinePayments: razorpayEnabled(), codMax: site.codMax });
}
