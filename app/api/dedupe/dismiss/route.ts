import { NextRequest, NextResponse } from "next/server";
import { leadRepository } from "@/lib/lead-repository";
import { DismissDuplicateSchema } from "@/lib/schemas";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = DismissDuplicateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { duplicateId } = parsed.data;
    const lead = await leadRepository.dismissDuplicate(duplicateId);

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Duplicate dismissed successfully",
      lead,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal error", message: error.message },
      { status: 500 }
    );
  }
}
