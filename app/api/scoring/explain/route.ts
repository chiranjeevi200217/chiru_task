import { NextRequest, NextResponse } from "next/server";
import { leadRepository } from "@/lib/lead-repository";
import { ExplainRequestSchema } from "@/lib/schemas";
import { generateLeadScoreExplanation } from "@/lib/claude";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = ExplainRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const lead = await leadRepository.getLeadById(parsed.data.leadId);
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const explanation = await generateLeadScoreExplanation(
      lead,
      lead.scoreBreakdown,
      lead.overallScore
    );

    await leadRepository.updateLead(lead.id, { aiExplanation: explanation });

    return NextResponse.json({
      success: true,
      leadId: lead.id,
      explanation,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to generate AI explanation", message: error.message },
      { status: 500 }
    );
  }
}
