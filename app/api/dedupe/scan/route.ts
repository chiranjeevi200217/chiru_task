import { NextResponse } from "next/server";
import { leadRepository } from "@/lib/lead-repository";

export async function GET() {
  try {
    const clusters = await leadRepository.getDuplicateClusters();
    return NextResponse.json({
      success: true,
      clusterCount: clusters.length,
      clusters,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to scan for duplicate leads", message: error.message },
      { status: 500 }
    );
  }
}
