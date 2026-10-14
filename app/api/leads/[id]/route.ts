import { NextRequest, NextResponse } from "next/server";
import { leadRepository } from "@/lib/lead-repository";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lead = await leadRepository.getLeadById(params.id);
    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }
    return NextResponse.json(lead);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch lead", message: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const updated = await leadRepository.updateLead(params.id, body);
    if (!updated) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to update lead", message: error.message }, { status: 500 });
  }
}
