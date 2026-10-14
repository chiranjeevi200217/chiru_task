import { NextRequest, NextResponse } from "next/server";
import { leadRepository } from "@/lib/lead-repository";
import { BatchValidateSchema } from "@/lib/schemas";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = BatchValidateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { leadIds } = parsed.data;
    const result = await leadRepository.validateBatch(leadIds);

    return NextResponse.json({
      success: true,
      message: `Successfully validated ${result.updatedCount} leads (Email MX & Website Health).`,
      updatedCount: result.updatedCount,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Batch validation failed", message: error.message },
      { status: 500 }
    );
  }
}
