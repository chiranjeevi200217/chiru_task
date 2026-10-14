import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { leadRepository } from "@/lib/lead-repository";
import { LeadQuerySchema, LeadCreateSchema } from "@/lib/schemas";
import { ScoringWeights, DEFAULT_WEIGHTS } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());

    const parsedQuery = LeadQuerySchema.safeParse(searchParams);
    if (!parsedQuery.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsedQuery.error.format() },
        { status: 400 }
      );
    }

    const {
      page,
      pageSize,
      search,
      minScore,
      maxScore,
      categories,
      contactTypes,
      websiteStatuses,
      minTeamSize,
      maxTeamSize,
      hideDuplicates,
      sortBy,
      sortOrder,
      categoryWeight,
      teamSizeWeight,
      companyAgeWeight,
      revenueWeight,
      contactWeight,
      healthTechWeight,
    } = parsedQuery.data;

    const weights: ScoringWeights = {
      categoryWeight: categoryWeight ?? DEFAULT_WEIGHTS.categoryWeight,
      teamSizeWeight: teamSizeWeight ?? DEFAULT_WEIGHTS.teamSizeWeight,
      companyAgeWeight: companyAgeWeight ?? DEFAULT_WEIGHTS.companyAgeWeight,
      revenueWeight: revenueWeight ?? DEFAULT_WEIGHTS.revenueWeight,
      contactWeight: contactWeight ?? DEFAULT_WEIGHTS.contactWeight,
      healthTechWeight: healthTechWeight ?? DEFAULT_WEIGHTS.healthTechWeight,
    };

    const result = await leadRepository.getLeads({
      criteria: {
        search,
        minScore,
        maxScore,
        categories,
        contactTypes: contactTypes as any,
        websiteStatuses: websiteStatuses as any,
        minTeamSize,
        maxTeamSize,
        hideDuplicates,
      },
      weights,
      page,
      pageSize,
      sortBy,
      sortOrder,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[GET /api/leads] Error:", error);
    return NextResponse.json({ error: "Failed to fetch leads", message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (Array.isArray(body)) {
      const parsedArray = z.array(LeadCreateSchema).safeParse(body);
      if (!parsedArray.success) {
        return NextResponse.json({ error: "Invalid leads array payload", details: parsedArray.error.format() }, { status: 400 });
      }
      const res = await leadRepository.addLeads(parsedArray.data as any);
      return NextResponse.json({ success: true, count: res.count });
    }

    const parsed = LeadCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid lead payload", details: parsed.error.format() }, { status: 400 });
    }

    const res = await leadRepository.addLeads([parsed.data as any]);
    return NextResponse.json({ success: true, count: res.count });
  } catch (error: any) {
    console.error("[POST /api/leads] Error:", error);
    return NextResponse.json({ error: "Failed to create lead", message: error.message }, { status: 500 });
  }
}
