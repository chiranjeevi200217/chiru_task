import { NextResponse } from "next/server";
import { leadRepository } from "@/lib/lead-repository";

export async function POST() {
  try {
    const res = await leadRepository.resetToSeed();
    return NextResponse.json({
      success: true,
      message: `Successfully loaded ${res.count} realistic SaaS acquisition leads into database.`,
      count: res.count,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to reset seed data", message: error.message },
      { status: 500 }
    );
  }
}
