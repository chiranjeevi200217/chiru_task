import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { enrichHomepageEthically } from "@/lib/enrichment";

const EnrichSchema = z.object({
  domain: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = EnrichSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid domain", details: parsed.error.format() }, { status: 400 });
    }

    const result = await enrichHomepageEthically(parsed.data.domain);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to enrich domain", message: error.message }, { status: 500 });
  }
}
