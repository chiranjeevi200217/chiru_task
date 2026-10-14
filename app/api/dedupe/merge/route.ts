import { NextRequest, NextResponse } from "next/server";
import { leadRepository } from "@/lib/lead-repository";
import { MergeRequestSchema } from "@/lib/schemas";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = MergeRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid merge payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { primaryId, duplicateId, overrides } = parsed.data;
    const result = await leadRepository.executeMerge(primaryId, duplicateId, overrides);

    if (!result) {
      return NextResponse.json(
        { error: "Failed to merge leads: primary or duplicate not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully merged duplicate ${result.duplicate.companyName} into ${result.primary.companyName}`,
      primary: result.primary,
      duplicate: result.duplicate,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal merge error", message: error.message },
      { status: 500 }
    );
  }
}
